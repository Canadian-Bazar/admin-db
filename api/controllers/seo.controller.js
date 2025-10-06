import { matchedData } from 'express-validator'
import httpStatus from 'http-status'
import SeoSettings from '../models/seo-settings.schema.js'
import buildResponse from '../utils/buildResponse.js'
import buildErrorObject from '../utils/buildErrorObject.js'
import handleError from '../utils/handleError.js'
import mongoose from 'mongoose'

// GET /api/v1/seo?path=/some/path
export const getSeoHeadController = async (req, res) => {
  try {
    const pathParam = (req.query.path || '/').toString().trim().toLowerCase()

    if (!pathParam) {
      return res
        .status(httpStatus.BAD_REQUEST)
        .json(buildErrorObject(httpStatus.BAD_REQUEST, 'PATH_REQUIRED'))
    }

    const seo = await SeoSettings.findOne({ path: pathParam })
    const code = seo?.code || ''

    // Response includes raw HTML snippet intended to be injected into <head>
    return res.status(httpStatus.OK).json(
      buildResponse(httpStatus.OK, { path: pathParam, code }),
    )
  } catch (error) {
    handleError(res, error)
  }
}

// POST /api/v1/seo  { path: '/some/path', code: '<meta ... />' }
export const setSeoHeadController = async (req, res) => {
  try {
    const body = req.body || {}
    const pathBody = (body.path || '/').toString().trim().toLowerCase()
    const codeBody = (body.code || '').toString()

    if (!pathBody) {
      return res
        .status(httpStatus.BAD_REQUEST)
        .json(buildErrorObject(httpStatus.BAD_REQUEST, 'PATH_REQUIRED'))
    }

    const updated = await SeoSettings.findOneAndUpdate(
      { path: pathBody },
      { $set: { code: codeBody } },
      { new: true, upsert: true }
    )

    return res.status(httpStatus.OK).json(
      buildResponse(httpStatus.OK, { path: updated.path, code: updated.code }),
    )
  } catch (error) {
    // Handle duplicate key error cleanly
    if (error?.code === 11000) {
      return res
        .status(httpStatus.CONFLICT)
        .json(buildErrorObject(httpStatus.CONFLICT, 'DUPLICATE_PATH'))
    }
    handleError(res, error)
  }
}


// GET /api/v1/seo
// Supports pagination and search
// Query: page, limit, search
export const listSeoSettingsController = async (req, res) => {
  try {
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1)
    const limit = Math.min(parseInt(req.query.limit, 10) || 10, 50)
    const search = (req.query.search || '').toString().trim()

    const filter = {}
    if (search) {
      filter.$or = [
        { path: { $regex: search, $options: 'i' } },
        { code: { $regex: search, $options: 'i' } },
      ]
    }

    const totalDocs = await SeoSettings.countDocuments(filter)
    const docs = await SeoSettings.find(filter)
      .sort({ updatedAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean()

    const totalPages = Math.max(Math.ceil(totalDocs / limit), 1)
    const response = {
      docs,
      totalDocs,
      limit,
      page,
      totalPages,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1,
      nextPage: page < totalPages ? page + 1 : null,
      prevPage: page > 1 ? page - 1 : null,
      pagingCounter: (page - 1) * limit + 1,
    }

    return res.status(httpStatus.OK).json(buildResponse(httpStatus.OK, response))
  } catch (error) {
    handleError(res, error)
  }
}

// PUT /api/v1/seo/:id
// Update path/code by id with basic validation and duplicate path guard
export const updateSeoByIdController = async (req, res) => {
  try {
    const id = req.params.id
    if (!id || !mongoose.isValidObjectId(id)) {
      return res
        .status(httpStatus.BAD_REQUEST)
        .json(buildErrorObject(httpStatus.BAD_REQUEST, 'INVALID_ID'))
    }

    const body = req.body || {}
    const nextPath = typeof body.path === 'string' ? body.path.trim().toLowerCase() : undefined
    const nextCode = typeof body.code === 'string' ? body.code : undefined

    const updates = {}
    if (typeof nextPath === 'string') updates.path = nextPath
    if (typeof nextCode === 'string') updates.code = nextCode

    if (Object.keys(updates).length === 0) {
      return res
        .status(httpStatus.BAD_REQUEST)
        .json(buildErrorObject(httpStatus.BAD_REQUEST, 'NO_UPDATES'))
    }

    if (updates.path) {
      const duplicate = await SeoSettings.findOne({ path: updates.path, _id: { $ne: id } })
      if (duplicate) {
        return res
          .status(httpStatus.CONFLICT)
          .json(buildErrorObject(httpStatus.CONFLICT, 'DUPLICATE_PATH'))
      }
    }

    const updated = await SeoSettings.findByIdAndUpdate(
      id,
      { $set: updates },
      { new: true }
    )

    if (!updated) {
      return res
        .status(httpStatus.NOT_FOUND)
        .json(buildErrorObject(httpStatus.NOT_FOUND, 'NOT_FOUND'))
    }

    return res
      .status(httpStatus.OK)
      .json(buildResponse(httpStatus.OK, updated))
  } catch (error) {
    handleError(res, error)
  }
}

export const deleteSeoByIdController = async (req, res) => {
  try {
    const id = req.params.id
    if (!id || !mongoose.isValidObjectId(id)) {
      return res
        .status(httpStatus.BAD_REQUEST)
        .json(buildErrorObject(httpStatus.BAD_REQUEST, 'INVALID_ID'))
    }
    const deleted = await SeoSettings.findByIdAndDelete(id)
    if (!deleted) {
      return res
        .status(httpStatus.NOT_FOUND)
        .json(buildErrorObject(httpStatus.NOT_FOUND, 'NOT_FOUND'))
    }

    return res.status(httpStatus.OK).json(buildResponse(httpStatus.OK, deleted))
  } catch (error) {
    handleError(res, error)
  }
} 