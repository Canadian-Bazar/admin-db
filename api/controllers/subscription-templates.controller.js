import { matchedData } from 'express-validator'
import httpStatus from 'http-status'
import mongoose from 'mongoose'
import SubscriptionPlanTemplate from '../models/subsciption-plan-template.schema.js'
import SubscriptionPlanVersion from '../models/subscription-plan-version.schema.js'
import buildResponse from '../utils/buildResponse.js'
import buildErrorObject from '../utils/buildErrorObject.js'
import handleError from '../utils/handleError.js'

const generateSlug = (name) => {
  return name
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim()
}

/**
 * Create a new subscription plan template
 */
export const createTemplateController = async (req, res) => {
  const session = await mongoose.startSession()

  try {
    const validatedData = matchedData(req)
    const { name, description, category, sortOrder, createdBy } = validatedData

    await session.startTransaction()

    let baseSlug = generateSlug(name)
    let slug = baseSlug
    let suffix = 1

    while (await SubscriptionPlanTemplate.exists({ slug }).session(session)) {
      slug = `${baseSlug}-${suffix++}`
    }

    const [newTemplate] = await SubscriptionPlanTemplate.create(
      [{
        name,
        slug,
        description,
        category: category || 'basic',
        sortOrder: sortOrder || 0,
        isActive: true,
        createdBy
      }],
      { session }
    )

    await session.commitTransaction()

    return res.status(httpStatus.CREATED).json(
      buildResponse(httpStatus.CREATED, {
        message: 'Subscription plan template created successfully',
        template: newTemplate
      })
    )
  } catch (err) {
    await session.abortTransaction()
    handleError(res, err)
  } finally {
    session.endSession()
  }
}

/**
 * Get all subscription plan templates with pagination and filtering
 */
export const getAllTemplatesController = async (req, res) => {
  try {
    const validatedData = matchedData(req)
    let { page = 1, limit = 10, search, category, isActive } = validatedData

    limit = Math.min(Number(limit), 50)
    page = Number(page)

    const filter = {}

    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ]
    }

    if (category) {
      filter.category = category
    }

    if (isActive !== undefined) {
      filter.isActive = isActive === 'true' || isActive === true
    }

    const templates = await SubscriptionPlanTemplate.find(filter)
      .populate('createdBy', 'name email')
      .populate('lastModifiedBy', 'name email')
      .sort({ sortOrder: 1, createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)

    const total = await SubscriptionPlanTemplate.countDocuments(filter)

    const templatesWithVersionCount = await Promise.all(
      templates.map(async (template) => {
        const versionCount = await SubscriptionPlanVersion.countDocuments({
          templateId: template._id
        })
        const currentVersion = await SubscriptionPlanVersion.findOne({
          templateId: template._id,
          isCurrent: true,
          isDeprecated: false
        })
        
        return {
          ...template.toObject(),
          versionCount,
          hasCurrentVersion: !!currentVersion
        }
      })
    )

    res.status(httpStatus.OK).json(
      buildResponse(httpStatus.OK, {
        templates: templatesWithVersionCount,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      })
    )
  } catch (err) {
    handleError(res, err)
  }
}

/**
 * Get all active subscription plan templates with their current versions
 */
export const getAllActiveSubscriptionTemplatesController = async (_req, res) => {
  try {
    const templates = await SubscriptionPlanTemplate.find({ 
      isActive: true 
    }).sort({ sortOrder: 1, name: 1 })
    
    const templatesWithVersions = await Promise.all(
      templates.map(async (template) => {
        const currentVersion = await SubscriptionPlanVersion.findOne({
          templateId: template._id,
          isCurrent: true,
          isDeprecated: false
        })
        
        return {
          _id: template._id,
          name: template.name,
          slug: template.slug,
          description: template.description,
          category: template.category,
          currentVersion: currentVersion ? {
            _id: currentVersion._id,
            versionNumber: currentVersion.versionNumber,
            pricing: currentVersion.pricing,
            features: currentVersion.features,
            featuresArray: currentVersion.featuresArray
          } : null
        }
      })
    )
    
    // Filter out templates without current versions
    const validTemplates = templatesWithVersions.filter(t => t.currentVersion)
    
    res.status(httpStatus.OK).json(
      buildResponse(httpStatus.OK, {
        templates: validTemplates,
        total: validTemplates.length
      })
    )
  } catch (err) {
    handleError(res, err)
  }
}

/**
 * Get subscription plan template by ID
 */
export const getTemplateByIdController = async (req, res) => {
  try {
    const validatedData = matchedData(req)
    const { templateId } = validatedData

    const template = await SubscriptionPlanTemplate.findById(templateId)
      .populate('createdBy', 'name email')
      .populate('lastModifiedBy', 'name email')

    if (!template) {
      throw buildErrorObject(httpStatus.NOT_FOUND, 'Subscription plan template not found')
    }

    // Get all versions for this template
    const versions = await SubscriptionPlanVersion.find({
      templateId: template._id
    }).sort({ versionNumber: -1 })

    const response = {
      ...template.toObject(),
      versions
    }

    res.status(httpStatus.OK).json(buildResponse(httpStatus.OK, response))
  } catch (err) {
    handleError(res, err)
  }
}

/**
 * Update subscription plan template
 */
export const updateTemplateController = async (req, res) => {
  const session = await mongoose.startSession()

  try {
    await session.withTransaction(async () => {
      const validatedData = matchedData(req)
      const { templateId, name, description, category, sortOrder, lastModifiedBy } = validatedData

      const template = await SubscriptionPlanTemplate.findById(templateId).session(session)
      if (!template) {
        throw buildErrorObject(httpStatus.NOT_FOUND, 'Subscription plan template not found')
      }

      if (name && name !== template.name) {
        let slug = generateSlug(name)
        let count = 0
        let existingTemplate

        do {
          if (count > 0) {
            slug = `${generateSlug(name)}-${count}`
          }
          existingTemplate = await SubscriptionPlanTemplate.findOne({
            slug,
            _id: { $ne: templateId }
          }).session(session)
          count++
        } while (existingTemplate)

        template.slug = slug
        template.name = name
      }

      if (description !== undefined) {
        template.description = description
      }

      if (category) {
        template.category = category
      }

      if (sortOrder !== undefined) {
        template.sortOrder = sortOrder
      }

      if (lastModifiedBy) {
        template.lastModifiedBy = lastModifiedBy
      }

      await template.save({ session })

      req.responseData = {
        message: 'Subscription plan template updated successfully',
        template
      }
    })

    res.status(httpStatus.OK).json(
      buildResponse(httpStatus.OK, req.responseData)
    )
  } catch (err) {
    handleError(res, err)
  } finally {
    await session.endSession()
  }
}

/**
 * Deactivate subscription plan template (soft delete)
 */
export const deactivateTemplateController = async (req, res) => {
  const session = await mongoose.startSession()

  try {
    await session.withTransaction(async () => {
      const validatedData = matchedData(req)
      const { templateId } = validatedData

      const template = await SubscriptionPlanTemplate.findById(templateId).session(session)
      if (!template) {
        throw buildErrorObject(httpStatus.NOT_FOUND, 'Subscription plan template not found')
      }

      if (!template.isActive) {
        throw buildErrorObject(httpStatus.BAD_REQUEST, 'Template is already inactive')
      }

      template.isActive = false
      await template.save({ session })

      // Also mark all versions as deprecated
      await SubscriptionPlanVersion.updateMany(
        { templateId: templateId },
        { 
          isDeprecated: true,
          isCurrent: false,
          deprecationDate: new Date()
        },
        { session }
      )

      req.responseData = {
        message: 'Subscription plan template deactivated successfully (including all versions)'
      }
    })

    res.status(httpStatus.OK).json(
      buildResponse(httpStatus.OK, req.responseData)
    )
  } catch (err) {
    handleError(res, err)
  } finally {
    await session.endSession()
  }
}

/**
 * Activate subscription plan template
 */
export const activateTemplateController = async (req, res) => {
  const session = await mongoose.startSession()

  try {
    await session.withTransaction(async () => {
      const validatedData = matchedData(req)
      const { templateId } = validatedData

      const template = await SubscriptionPlanTemplate.findById(templateId).session(session)
      if (!template) {
        throw buildErrorObject(httpStatus.NOT_FOUND, 'Subscription plan template not found')
      }

      if (template.isActive) {
        throw buildErrorObject(httpStatus.BAD_REQUEST, 'Template is already active')
      }

      template.isActive = true
      await template.save({ session })

      req.responseData = {
        message: 'Subscription plan template activated successfully'
      }
    })

    res.status(httpStatus.OK).json(
      buildResponse(httpStatus.OK, req.responseData)
    )
  } catch (err) {
    handleError(res, err)
  } finally {
    await session.endSession()
  }
}