import { matchedData } from 'express-validator'
import httpStatus from 'http-status'
import mongoose from 'mongoose'

import Permission from '../models/permission.schema.js'
import buildResponse from '../utils/buildResponse.js'
import buildErrorObject from '../utils/buildErrorObject.js'
import handleError from '../utils/handleError.js'

export const createPermissionController = async (req, res) => {
  const session = await mongoose.startSession()
  
  try {
    const validatedData = matchedData(req)
    const { name, route, description, module } = validatedData

    await session.startTransaction()

    // Check if permission already exists
    const existingPermission = await Permission.findOne({ name }).session(session)
    if (existingPermission) {
      throw buildErrorObject(httpStatus.CONFLICT, 'Permission already exists')
    }

    const permission = new Permission({
      name: name.toLowerCase(),
      route,
      description,
      module: module.toLowerCase()
    })

    await permission.save({ session })
    await session.commitTransaction()


  

   return  res.status(httpStatus.CREATED).json(
      buildResponse(httpStatus.CREATED, permission)
    )

  } catch (err) {
    // await session.abortTransaction()
    handleError(res ,err)
  } finally {
    session.endSession()
  }
}

export const updatePermissionController = async (req, res) => {
  const session = await mongoose.startSession()

  try {
    const validatedData = matchedData(req)
    const { permissionId } = validatedData
    const updateData = { ...validatedData }
    delete updateData.permissionId

    await session.startTransaction()

    // Check if permission exists
    const permission = await Permission.findById(permissionId).session(session)
    if (!permission) {
      throw buildErrorObject(httpStatus.NOT_FOUND, 'Permission not found')
    }

    // If name is being updated, check for uniqueness
    if (updateData.name && updateData.name !== permission.name) {
      const existingPermission = await Permission.findOne({ 
        name: updateData.name.toLowerCase(),
        _id: { $ne: permissionId }
      }).session(session)
      
      if (existingPermission) {
        throw buildErrorObject(httpStatus.CONFLICT, 'Permission name already exists')
      }
      updateData.name = updateData.name.toLowerCase()
    }

    // Update module to lowercase
    if (updateData.module) {
      updateData.module = updateData.module.toLowerCase()
    }

    const updatedPermission = await Permission.findByIdAndUpdate(
      permissionId,
      updateData,
      { new: true, session }
    )

    await session.commitTransaction()

    res.status(httpStatus.OK).json(
      buildResponse(httpStatus.OK, updatedPermission)
    )

  } catch (err) {
  if (session.inTransaction()) {
      await session.abortTransaction()
      handleError(res, err)
    }    
  } finally {
    session.endSession()
  }
}

export const getAllPermissionsController = async (req, res) => {
  try {
    const validatedData = matchedData(req)
    const { 
      page = 1, 
      limit = 10, 
      search, 
      module, 
      isActive 
    } = validatedData

    const query = {}
    
    // Build search query
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { route: { $regex: search, $options: 'i' } }
      ]
    }

    if (module) {
      query.module = module.toLowerCase()
    }

    if (typeof isActive === 'boolean') {
      query.isActive = isActive
    }

    const options = {
      page: parseInt(page),
      limit: parseInt(limit),
      sort: { module: 1, name: 1 }
    }

    const permissions = await Permission.paginate(query, options)

    res.status(httpStatus.OK).json(
      buildResponse(httpStatus.OK, permissions)
    )

  } catch (err) {
    handleError(res, err)
  }
}

export const getPermissionByIdController = async (req, res) => {
  try {
    const validatedData = matchedData(req)
    const { permissionId } = validatedData

    const permission = await Permission.findById(permissionId)
    if (!permission) {
      throw buildErrorObject(httpStatus.NOT_FOUND, 'Permission not found')
    }

    res.status(httpStatus.OK).json(
      buildResponse(httpStatus.OK, permission)
    )

  } catch (err) {
    handleError(res, err)
  }
}

export const activatePermissionController = async (req, res) => {
  const session = await mongoose.startSession()

  try {
    const validatedData = matchedData(req)
    const { permissionId } = validatedData

    await session.startTransaction()

    const permission = await Permission.findById(permissionId).session(session)
    if (!permission) {
      throw buildErrorObject(httpStatus.NOT_FOUND, 'Permission not found')
    }

    if (permission.isActive) {
      throw buildErrorObject(httpStatus.BAD_REQUEST, 'Permission is already active')
    }

    permission.isActive = true
    await permission.save({ session })

    await session.commitTransaction()

    res.status(httpStatus.OK).json(
      buildResponse(httpStatus.OK, permission)
    )

  } catch (err) {
    await session.abortTransaction()
    handleError(res, err)
  } finally {
    session.endSession()
  }
}

export const deactivatePermissionController = async (req, res) => {
  const session = await mongoose.startSession()

  try {
    const validatedData = matchedData(req)
    const { permissionId } = validatedData

    await session.startTransaction()

    const permission = await Permission.findById(permissionId).session(session)
    if (!permission) {
      throw buildErrorObject(httpStatus.NOT_FOUND, 'Permission not found')
    }

    if (!permission.isActive) {
      throw buildErrorObject(httpStatus.BAD_REQUEST, 'Permission is already inactive')
    }

    permission.isActive = false
    await permission.save({ session })

    await session.commitTransaction()

    res.status(httpStatus.OK).json(
      buildResponse(httpStatus.OK, permission)
    )

  } catch (err) {
    await session.abortTransaction()
    handleError(res, err)
  } finally {
    session.endSession()
  }
}

export const deletePermissionController = async (req, res) => {
  const session = await mongoose.startSession()

  try {
    const validatedData = matchedData(req)
    const { permissionId } = validatedData

    await session.startTransaction()

    const permission = await Permission.findById(permissionId).session(session)
    if (!permission) {
      throw buildErrorObject(httpStatus.NOT_FOUND, 'Permission not found')
    }

    // Check if permission is being used by users or groups
    const UserPermission = mongoose.model('UserPermission')
    const UserGroup = mongoose.model('UserGroup')
    
    const [userPermissionCount, groupPermissionCount] = await Promise.all([
      UserPermission.countDocuments({ permissionId }).session(session),
      UserGroup.countDocuments({ 'permissions.permissionId': permissionId }).session(session)
    ])

    if (userPermissionCount > 0 || groupPermissionCount > 0) {
      throw buildErrorObject(
        httpStatus.BAD_REQUEST, 
        'Cannot delete permission that is currently assigned to users or groups'
      )
    }

    await Permission.findByIdAndDelete(permissionId).session(session)
    await session.commitTransaction()

    res.status(httpStatus.OK).json(
      buildResponse(httpStatus.OK, { message: 'Permission deleted successfully' })
    )

  } catch (err) {
    await session.abortTransaction()
    handleError(res, err)
  } finally {
    session.endSession()
  }
}