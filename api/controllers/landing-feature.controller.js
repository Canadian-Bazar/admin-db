import { matchedData } from 'express-validator'
import LandingFeature from '../models/landing-feature.schema.js'
import buildResponse from '../utils/buildResponse.js'
import handleError from '../utils/handleError.js'
import httpStatus from 'http-status'

export const createLandingFeatureController = async (req, res) => {
  try {
    const validated = matchedData(req)
    const feature = await LandingFeature.create(validated)

    // Enforce max active items by deactivating the oldest ones
    const MAX_ACTIVE = parseInt(process.env.MAX_ACTIVE_LANDING_FEATURES || '4', 10)
    if (feature?.isActive !== false && MAX_ACTIVE > 0) {
      const actives = await LandingFeature.find({ isActive: true })
        .sort({ order: 1, createdAt: 1 })
        .select('_id')
        .lean()

      if (Array.isArray(actives) && actives.length > MAX_ACTIVE) {
        const overflow = actives.length - MAX_ACTIVE
        const toDeactivateIds = actives.slice(0, overflow).map((d) => d._id)
        if (toDeactivateIds.length > 0) {
          await LandingFeature.updateMany(
            { _id: { $in: toDeactivateIds } },
            { $set: { isActive: false } }
          )
        }
      }
    }

    res.status(httpStatus.CREATED).json(buildResponse(httpStatus.CREATED, feature))
  } catch (err) { handleError(res, err) }
}

export const getLandingFeaturesController = async (req, res) => {
  try {
    const validated = matchedData(req)
    const page = parseInt(validated.page || 1, 10)
    const limit = Math.min(parseInt(validated.limit || 20, 10), 50)
    const skip = (page - 1) * limit

    const filter = {}
    if (validated.search) {
      filter.$or = [
        { title: { $regex: validated.search, $options: 'i' } },
        { description: { $regex: validated.search, $options: 'i' } },
        { icon: { $regex: validated.search, $options: 'i' } },
      ]
    }

    const [docs, totalDocs] = await Promise.all([
      LandingFeature.find(filter).sort({ order: 1, createdAt: 1 }).skip(skip).limit(limit),
      LandingFeature.countDocuments(filter)
    ])

    const totalPages = Math.ceil(totalDocs / limit) || 1
    res.status(httpStatus.OK).json(buildResponse(httpStatus.OK, {
      docs, page, limit, totalDocs, totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1,
    }))
  } catch (err) { handleError(res, err) }
}

export const getLandingFeatureByIdController = async (req, res) => {
  try {
    const { id } = matchedData(req)
    const doc = await LandingFeature.findById(id)
    if (!doc) return res.status(httpStatus.NOT_FOUND).json(buildResponse(httpStatus.NOT_FOUND, 'Not found'))
    res.status(httpStatus.OK).json(buildResponse(httpStatus.OK, doc))
  } catch (err) { handleError(res, err) }
}

export const updateLandingFeatureController = async (req, res) => {
  try {
    const validated = matchedData(req)
    const { id, ...updates } = validated
    await LandingFeature.findByIdAndUpdate(id, updates, { runValidators: true })

    // If this update activates the doc, enforce the max-active rule
    const shouldEnforce = updates?.isActive === true
    if (shouldEnforce) {
      const MAX_ACTIVE = parseInt(process.env.MAX_ACTIVE_LANDING_FEATURES || '4', 10)
      if (MAX_ACTIVE > 0) {
        const actives = await LandingFeature.find({ isActive: true })
          .sort({ order: 1, createdAt: 1 })
          .select('_id')
          .lean()

        if (Array.isArray(actives) && actives.length > MAX_ACTIVE) {
          const overflow = actives.length - MAX_ACTIVE
          const toDeactivateIds = actives.slice(0, overflow).map((d) => d._id)
          if (toDeactivateIds.length > 0) {
            await LandingFeature.updateMany(
              { _id: { $in: toDeactivateIds } },
              { $set: { isActive: false } }
            )
          }
        }
      }
    }
    res.status(httpStatus.OK).json(buildResponse(httpStatus.OK, 'Updated'))
  } catch (err) { handleError(res, err) }
}

export const deleteLandingFeatureController = async (req, res) => {
  try {
    const { id } = matchedData(req)
    await LandingFeature.findByIdAndDelete(id)
    res.status(httpStatus.OK).json(buildResponse(httpStatus.OK, 'Deleted'))
  } catch (err) { handleError(res, err) }
}


