import { matchedData } from 'express-validator'
import httpStatus from 'http-status'
import mongoose from 'mongoose'
import SubscriptionPlanTemplate from '../models/subsciption-plan-template.schema.js'
import SubscriptionPlanVersion from '../models/subscription-plan-version.schema.js'
import buildResponse from '../utils/buildResponse.js'
import buildErrorObject from '../utils/buildErrorObject.js'
import handleError from '../utils/handleError.js'

/**
 * Create a new subscription plan version
 */
export const createVersionController = async (req, res) => {
  const session = await mongoose.startSession()

  try {
    const validatedData = matchedData(req)
    const { templateId, versionNumber, pricing, discountPercentage, features, isCurrent, effectiveDate } = validatedData

    await session.startTransaction()

    // Check if template exists and is active
    const template = await SubscriptionPlanTemplate.findById(templateId).session(session)
    if (!template) {
      throw buildErrorObject(httpStatus.BAD_REQUEST, 'Subscription plan template not found')
    }
    if (!template.isActive) {
      throw buildErrorObject(httpStatus.BAD_REQUEST, 'Cannot create version for inactive template')
    }

    // Check if version number already exists for this template
    const existingVersion = await SubscriptionPlanVersion.findOne({
      templateId,
      versionNumber
    }).session(session)

    if (existingVersion) {
      throw buildErrorObject(httpStatus.BAD_REQUEST, `Version ${versionNumber} already exists for this template`)
    }

    // If this version is set as current, mark other versions as not current
    if (isCurrent) {
      await SubscriptionPlanVersion.updateMany(
        { templateId: templateId, isCurrent: true },
        { isCurrent: false },
        { session }
      )
    }

    const [newVersion] = await SubscriptionPlanVersion.create(
      [{
        templateId,
        versionNumber,
        pricing: pricing || {},
        discountPercentage: discountPercentage || 0,
        features: features || {},
        isCurrent: isCurrent || false,
        isDeprecated: false,
        effectiveDate: effectiveDate || new Date()
      }],
      { session }
    )

    await session.commitTransaction()

    return res.status(httpStatus.CREATED).json(
      buildResponse(httpStatus.CREATED, {
        message: 'Subscription plan version created successfully',
        version: newVersion
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
 * Get all subscription plan versions with pagination and filtering
 */
export const getAllVersionsController = async (req, res) => {
  try {
    const validatedData = matchedData(req)
    let { page = 1, limit = 10, templateId, isCurrent, isDeprecated } = validatedData

    limit = Math.min(Number(limit), 50)
    page = Number(page)

    const filter = {}

    if (templateId) {
      filter.templateId = templateId
    }

    if (isCurrent !== undefined) {
      filter.isCurrent = isCurrent === 'true' || isCurrent === true
    }

    if (isDeprecated !== undefined) {
      filter.isDeprecated = isDeprecated === 'true' || isDeprecated === true
    }

    const versions = await SubscriptionPlanVersion.find(filter)
      .populate('templateId', 'name slug category isActive')
      .sort({ createdAt: -1, versionNumber: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)

    const total = await SubscriptionPlanVersion.countDocuments(filter)

    res.status(httpStatus.OK).json(
      buildResponse(httpStatus.OK, {
        versions,
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
 * Get subscription plan version by ID
 */
export const getVersionByIdController = async (req, res) => {
  try {
    const validatedData = matchedData(req)
    const { versionId } = validatedData

    const version = await SubscriptionPlanVersion.findById(versionId)
      .populate('templateId', 'name slug description category isActive')

    if (!version) {
      throw buildErrorObject(httpStatus.NOT_FOUND, 'Subscription plan version not found')
    }

    res.status(httpStatus.OK).json(buildResponse(httpStatus.OK, version))
  } catch (err) {
    handleError(res, err)
  }
}

/**
 * Get all versions for a specific template
 */
export const getVersionsByTemplateController = async (req, res) => {
  try {
    const validatedData = matchedData(req)
    let { templateId, page = 1, limit = 10, isCurrent, isDeprecated } = validatedData

    limit = Math.min(Number(limit), 50)
    page = Number(page)

    // Check if template exists
    const template = await SubscriptionPlanTemplate.findById(templateId)
    if (!template) {
      throw buildErrorObject(httpStatus.NOT_FOUND, 'Subscription plan template not found')
    }

    const filter = { templateId }

    if (isCurrent !== undefined) {
      filter.isCurrent = isCurrent === 'true' || isCurrent === true
    }

    if (isDeprecated !== undefined) {
      filter.isDeprecated = isDeprecated === 'true' || isDeprecated === true
    }

    const versions = await SubscriptionPlanVersion.find(filter)
      .sort({ versionNumber: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)

    const total = await SubscriptionPlanVersion.countDocuments(filter)

    res.status(httpStatus.OK).json(
      buildResponse(httpStatus.OK, {
        template: {
          _id: template._id,
          name: template.name,
          slug: template.slug,
          category: template.category
        },
        versions,
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
 * Update subscription plan version
 */
export const updateVersionController = async (req, res) => {
  const session = await mongoose.startSession()

  try {
    await session.withTransaction(async () => {
      const validatedData = matchedData(req)
      const { versionId, pricing, discountPercentage, features, isCurrent, effectiveDate } = validatedData

      const version = await SubscriptionPlanVersion.findById(versionId).session(session)
      if (!version) {
        throw buildErrorObject(httpStatus.NOT_FOUND, 'Subscription plan version not found')
      }

      if (version.isDeprecated) {
        throw buildErrorObject(httpStatus.BAD_REQUEST, 'Cannot update deprecated version')
      }

      // Check if template is still active
      const template = await SubscriptionPlanTemplate.findById(version.templateId).session(session)
      if (!template || !template.isActive) {
        throw buildErrorObject(httpStatus.BAD_REQUEST, 'Cannot update version of inactive template')
      }

      // If this version is being set as current, mark other versions as not current
      if (isCurrent === true && !version.isCurrent) {
        await SubscriptionPlanVersion.updateMany(
          { templateId: version.templateId, isCurrent: true },
          { isCurrent: false },
          { session }
        )
      }

      if (pricing) {
        version.pricing = { ...version.pricing, ...pricing }
      }

      if (discountPercentage !== undefined) {
        version.discountPercentage = discountPercentage
      }

      if (features) {
        version.features = { ...version.features, ...features }
      }

      if (isCurrent !== undefined) {
        version.isCurrent = isCurrent
      }

      if (effectiveDate) {
        version.effectiveDate = new Date(effectiveDate)
      }

      await version.save({ session })

      req.responseData = {
        message: 'Subscription plan version updated successfully',
        version
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
 * Deprecate subscription plan version (soft delete)
 */
export const deprecateVersionController = async (req, res) => {
  const session = await mongoose.startSession()

  try {
    await session.withTransaction(async () => {
      const validatedData = matchedData(req)
      const { versionId } = validatedData

      const version = await SubscriptionPlanVersion.findById(versionId).session(session)
      if (!version) {
        throw buildErrorObject(httpStatus.NOT_FOUND, 'Subscription plan version not found')
      }

      if (version.isDeprecated) {
        throw buildErrorObject(httpStatus.BAD_REQUEST, 'Version is already deprecated')
      }

      version.isDeprecated = true
      version.isCurrent = false
      version.deprecationDate = new Date()
      await version.save({ session })

      req.responseData = {
        message: 'Subscription plan version deprecated successfully'
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
 * Activate subscription plan version (undeprecate)
 */
export const activateVersionController = async (req, res) => {
  const session = await mongoose.startSession()

  try {
    await session.withTransaction(async () => {
      const validatedData = matchedData(req)
      const { versionId } = validatedData

      const version = await SubscriptionPlanVersion.findById(versionId).session(session)
      if (!version) {
        throw buildErrorObject(httpStatus.NOT_FOUND, 'Subscription plan version not found')
      }

      if (!version.isDeprecated) {
        throw buildErrorObject(httpStatus.BAD_REQUEST, 'Version is already active')
      }

      // Check if template is still active
      const template = await SubscriptionPlanTemplate.findById(version.templateId).session(session)
      if (!template || !template.isActive) {
        throw buildErrorObject(httpStatus.BAD_REQUEST, 'Cannot activate version of inactive template')
      }

      version.isDeprecated = false
      version.deprecationDate = undefined
      await version.save({ session })

      req.responseData = {
        message: 'Subscription plan version activated successfully'
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
 * Set version as current
 */
export const setCurrentVersionController = async (req, res) => {
  const session = await mongoose.startSession()

  try {
    await session.withTransaction(async () => {
      const validatedData = matchedData(req)
      const { versionId } = validatedData

      const version = await SubscriptionPlanVersion.findById(versionId).session(session)
      if (!version) {
        throw buildErrorObject(httpStatus.NOT_FOUND, 'Subscription plan version not found')
      }

      if (version.isDeprecated) {
        throw buildErrorObject(httpStatus.BAD_REQUEST, 'Cannot set deprecated version as current')
      }

      if (version.isCurrent) {
        throw buildErrorObject(httpStatus.BAD_REQUEST, 'Version is already current')
      }

      // Check if template is still active
      const template = await SubscriptionPlanTemplate.findById(version.templateId).session(session)
      if (!template || !template.isActive) {
        throw buildErrorObject(httpStatus.BAD_REQUEST, 'Cannot set current version for inactive template')
      }

      // Mark other versions as not current
      await SubscriptionPlanVersion.updateMany(
        { templateId: version.templateId, isCurrent: true },
        { isCurrent: false },
        { session }
      )

      version.isCurrent = true
      await version.save({ session })

      req.responseData = {
        message: 'Subscription plan version set as current successfully'
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