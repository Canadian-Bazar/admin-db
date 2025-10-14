import { matchedData } from 'express-validator'
import httpStatus from 'http-status'
import HomeSettings from '../models/home-settings.schema.js'
import buildResponse from '../utils/buildResponse.js'
import handleError from '../utils/handleError.js'
import { uploadFile } from '../helpers/aws-s3.js'

export const getHomeSettingsController = async (_req, res) => {
  try {
    const settings = await HomeSettings.findOne({}).sort({ updatedAt: -1 }).lean()
    return res.status(httpStatus.OK).json(buildResponse(httpStatus.OK, settings || {}))
  } catch (err) {
    handleError(res, err)
  }
}

export const upsertHomeSettingsController = async (req, res) => {
  try {
    const payload = matchedData(req)

    // If a new background image file is uploaded, upload to S3 and use its key
    let uploadedBackgroundImage
    if (req.files && req.files.length > 0) {
      const [key] = await uploadFile(req.files)
      uploadedBackgroundImage = key
    }
    const update = {
      ...(uploadedBackgroundImage !== undefined
        ? { backgroundImage: uploadedBackgroundImage }
        : (payload.backgroundImage !== undefined ? { backgroundImage: payload.backgroundImage } : {})),
      ...(payload.title !== undefined ? { title: payload.title } : {}),
      ...(payload.subtitle !== undefined ? { subtitle: payload.subtitle } : {}),
      ...(payload.mainHeadingBuy !== undefined ? { mainHeadingBuy: payload.mainHeadingBuy } : {}),
      ...(payload.mainHeadingCanadian !== undefined ? { mainHeadingCanadian: payload.mainHeadingCanadian } : {}),
      ...(payload.subHeadingPart1 !== undefined ? { subHeadingPart1: payload.subHeadingPart1 } : {}),
      ...(payload.subHeadingPart2 !== undefined ? { subHeadingPart2: payload.subHeadingPart2 } : {}),
      ...(payload.isActive !== undefined ? { isActive: payload.isActive } : {}),
    }

    const updated = await HomeSettings.findOneAndUpdate({}, { $set: update }, { upsert: true, new: true })
    return res.status(httpStatus.OK).json(buildResponse(httpStatus.OK, updated))
  } catch (err) {
    handleError(res, err)
  }
}

// New: list up to 4 home settings
export const listHomeSettingsController = async (_req, res) => {
  try {
    const docs = await HomeSettings.find({}).sort({ createdAt: 1 }).limit(4).lean()
    return res.status(httpStatus.OK).json(buildResponse(httpStatus.OK, { docs }))
  } catch (err) {
    handleError(res, err)
  }
}

// New: create a home setting with a max of 4 documents
export const createHomeSettingController = async (req, res) => {
  try {
    const count = await HomeSettings.countDocuments({})
    if (count >= 4) {
      return res.status(httpStatus.BAD_REQUEST).json(buildResponse(httpStatus.BAD_REQUEST, 'Maximum of 4 home settings allowed'))
    }
    const payload = matchedData(req)

    // Optional file upload support
    let backgroundImage = payload.backgroundImage || ''
    if (req.files && req.files.length > 0) {
      const [key] = await uploadFile(req.files)
      backgroundImage = key
    }
    const created = await HomeSettings.create({
      backgroundImage,
      title: payload.title || '',
      subtitle: payload.subtitle || '',
      mainHeadingBuy: payload.mainHeadingBuy || '',
      mainHeadingCanadian: payload.mainHeadingCanadian || '',
      subHeadingPart1: payload.subHeadingPart1 || '',
      subHeadingPart2: payload.subHeadingPart2 || '',
      isActive: payload.isActive !== undefined ? payload.isActive : true,
    })
    return res.status(httpStatus.OK).json(buildResponse(httpStatus.OK, created))
  } catch (err) {
    handleError(res, err)
  }
}

// New: update by id
export const updateHomeSettingByIdController = async (req, res) => {
  try {
    const id = req.params.id
    const payload = matchedData(req)

    // Optional file upload support
    let uploadedBackgroundImage
    if (req.files && req.files.length > 0) {
      const [key] = await uploadFile(req.files)
      uploadedBackgroundImage = key
    }
    const update = {
      ...(uploadedBackgroundImage !== undefined
        ? { backgroundImage: uploadedBackgroundImage }
        : (payload.backgroundImage !== undefined ? { backgroundImage: payload.backgroundImage } : {})),
      ...(payload.title !== undefined ? { title: payload.title } : {}),
      ...(payload.subtitle !== undefined ? { subtitle: payload.subtitle } : {}),
      ...(payload.isActive !== undefined ? { isActive: payload.isActive } : {}),
      ...(payload.mainHeadingBuy !== undefined ? { mainHeadingBuy: payload.mainHeadingBuy } : {}),
      ...(payload.mainHeadingCanadian !== undefined ? { mainHeadingCanadian: payload.mainHeadingCanadian } : {}),
      ...(payload.subHeadingPart1 !== undefined ? { subHeadingPart1: payload.subHeadingPart1 } : {}),
      ...(payload.subHeadingPart2 !== undefined ? { subHeadingPart2: payload.subHeadingPart2 } : {}),
    }
    const updated = await HomeSettings.findByIdAndUpdate(id, { $set: update }, { new: true })
    return res.status(httpStatus.OK).json(buildResponse(httpStatus.OK, updated))
  } catch (err) {
    handleError(res, err)
  }
}

// New: delete by id
export const deleteHomeSettingByIdController = async (req, res) => {
  try {
    const id = req.params.id
    await HomeSettings.findByIdAndDelete(id)
    return res.status(httpStatus.OK).json(buildResponse(httpStatus.OK, { deleted: true }))
  } catch (err) {
    handleError(res, err)
  }
}


