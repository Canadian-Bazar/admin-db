import httpStatus from 'http-status'
import GlobalParagraph from '../models/global-paragraph.schema.js'
import buildResponse from '../utils/buildResponse.js'
import buildErrorObject from '../utils/buildErrorObject.js'
import handleError from '../utils/handleError.js'
import mongoose from 'mongoose'

// GET /api/v1/global-paragraph?path=/some/path
export const getGlobalParagraphController = async (req, res) => {
  try {
    const pathParam = (req.query.path || '/').toString().trim().toLowerCase()

    if (!pathParam) {
      return res
        .status(httpStatus.BAD_REQUEST)
        .json(buildErrorObject(httpStatus.BAD_REQUEST, 'PATH_REQUIRED'))
    }

    const paragraph = await GlobalParagraph.findOne({ path: pathParam, isActive: true })
    const content = paragraph?.content || ''

    return res.status(httpStatus.OK).json(
      buildResponse(httpStatus.OK, { path: pathParam, content }),
    )
  } catch (error) {
    handleError(res, error)
  }
}

// POST /api/v1/global-paragraph  { path: '/some/path', content: 'Some text', isActive: true }
export const setGlobalParagraphController = async (req, res) => {
  try {
    const body = req.body || {}
    const pathBody = (body.path || '/').toString().trim().toLowerCase()
    const contentBody = (body.content || '').toString()
    const isActive = typeof body.isActive === 'boolean' ? body.isActive : true

    if (!pathBody) {
      return res
        .status(httpStatus.BAD_REQUEST)
        .json(buildErrorObject(httpStatus.BAD_REQUEST, 'PATH_REQUIRED'))
    }

    const updated = await GlobalParagraph.findOneAndUpdate(
      { path: pathBody },
      { $set: { content: contentBody, isActive } },
      { new: true, upsert: true }
    )

    return res.status(httpStatus.OK).json(
      buildResponse(httpStatus.OK, { 
        path: updated.path, 
        content: updated.content,
        isActive: updated.isActive 
      }),
    )
  } catch (error) {
    if (error?.code === 11000) {
      return res
        .status(httpStatus.CONFLICT)
        .json(buildErrorObject(httpStatus.CONFLICT, 'DUPLICATE_PATH'))
    }
    handleError(res, error)
  }
}

// GET /api/v1/global-paragraph/list
// Supports pagination and search
export const listGlobalParagraphsController = async (req, res) => {
  try {
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1)
    const limit = Math.min(parseInt(req.query.limit, 10) || 10, 50)
    const search = (req.query.search || '').toString().trim()

    const filter = {}
    if (search) {
      filter.$or = [
        { path: { $regex: search, $options: 'i' } },
        { content: { $regex: search, $options: 'i' } },
      ]
    }

    const totalDocs = await GlobalParagraph.countDocuments(filter)
    const docs = await GlobalParagraph.find(filter)
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

// PUT /api/v1/global-paragraph/:id
export const updateGlobalParagraphByIdController = async (req, res) => {
  try {
    const id = req.params.id
    if (!id || !mongoose.isValidObjectId(id)) {
      return res
        .status(httpStatus.BAD_REQUEST)
        .json(buildErrorObject(httpStatus.BAD_REQUEST, 'INVALID_ID'))
    }

    const body = req.body || {}
    const nextPath = typeof body.path === 'string' ? body.path.trim().toLowerCase() : undefined
    const nextContent = typeof body.content === 'string' ? body.content : undefined
    const nextIsActive = typeof body.isActive === 'boolean' ? body.isActive : undefined

    const updates = {}
    if (typeof nextPath === 'string') updates.path = nextPath
    if (typeof nextContent === 'string') updates.content = nextContent
    if (typeof nextIsActive === 'boolean') updates.isActive = nextIsActive

    if (Object.keys(updates).length === 0) {
      return res
        .status(httpStatus.BAD_REQUEST)
        .json(buildErrorObject(httpStatus.BAD_REQUEST, 'NO_UPDATES'))
    }

    if (updates.path) {
      const duplicate = await GlobalParagraph.findOne({ path: updates.path, _id: { $ne: id } })
      if (duplicate) {
        return res
          .status(httpStatus.CONFLICT)
          .json(buildErrorObject(httpStatus.CONFLICT, 'DUPLICATE_PATH'))
      }
    }

    const updated = await GlobalParagraph.findByIdAndUpdate(
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

// DELETE /api/v1/global-paragraph/:id
export const deleteGlobalParagraphByIdController = async (req, res) => {
  try {
    const id = req.params.id
    if (!id || !mongoose.isValidObjectId(id)) {
      return res
        .status(httpStatus.BAD_REQUEST)
        .json(buildErrorObject(httpStatus.BAD_REQUEST, 'INVALID_ID'))
    }
    
    const deleted = await GlobalParagraph.findByIdAndDelete(id)
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

