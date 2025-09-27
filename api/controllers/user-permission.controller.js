import { matchedData } from 'express-validator'
import httpStatus from 'http-status'
import mongoose from 'mongoose'

import User from '../models/user.schema.js'
import Permission from '../models/permission.schema.js'
import UserPermission from '../models/user-permission.schema.js'
import buildResponse from '../utils/buildResponse.js'
import buildErrorObject from '../utils/buildErrorObject.js'
import handleError from '../utils/handleError.js'
import getUserEffectivePermissions from '../utils/getUserEffectivePermissions.js'
import { ensureViewAction } from '../utils/permissionChecker.js'

export const assignPermissionToUserController = async (req, res) => {
  const session = await mongoose.startSession()

  try {
    const validatedData = matchedData(req)
    const { userId, permissionId, grantedActions } = validatedData

    await session.startTransaction()

    // Verify user exists
    const user = await User.findById(userId).session(session)
    if (!user) {
      throw buildErrorObject(httpStatus.NOT_FOUND, 'User not found')
    }

    // Verify permission exists and is active
    const permission = await Permission.findOne({ 
      _id: permissionId, 
      isActive: true 
    }).session(session)
    if (!permission) {
      throw buildErrorObject(httpStatus.NOT_FOUND, 'Permission not found or inactive')
    }

    // Ensure 'view' action is included
    const actionsWithView = ensureViewAction(grantedActions)

    // Check if user already has this permission
    const existingUserPermission = await UserPermission.findOne({
      userId,
      permissionId
    }).session(session)



          console.log("bro")


    let userPermission
    if (existingUserPermission) {
      // Update existing permission
      existingUserPermission.grantedActions = actionsWithView
      userPermission = await existingUserPermission.save({ session })
    } else {
      // Create new permission
      userPermission = new UserPermission({
        userId,
        permissionId,
        grantedActions: actionsWithView
      })
      await userPermission.save({ session })

    }

    await session.commitTransaction()

    // Populate permission details
    await userPermission.populate('permissionId', 'name route description module')



    res.status(httpStatus.CREATED).json(
      buildResponse(httpStatus.CREATED, userPermission)
    )

  } catch (err) {
    await session.abortTransaction()
    handleError(res, err)
  } finally {
    session.endSession()
  }
}

export const updateUserPermissionController = async (req, res) => {
  const session = await mongoose.startSession()

  try {
    const validatedData = matchedData(req)
    const { userId, permissionId, grantedActions } = validatedData

    await session.startTransaction()

    // Find existing user permission
    const userPermission = await UserPermission.findOne({
      userId,
      permissionId
    }).session(session)

    if (!userPermission) {
      throw buildErrorObject(httpStatus.NOT_FOUND, 'User permission not found')
    }

    // Ensure 'view' action is included
    const actionsWithView = ensureViewAction(grantedActions)

    userPermission.grantedActions = actionsWithView
    await userPermission.save({ session })

    await session.commitTransaction()

    // Populate permission details
    await userPermission.populate('permissionId', 'name route description module')

    res.status(httpStatus.OK).json(
      buildResponse(httpStatus.OK, userPermission)
    )

  } catch (err) {
    await session.abortTransaction()
    handleError(res, err)
  } finally {
    session.endSession()
  }
}

export const removePermissionFromUserController = async (req, res) => {
  const session = await mongoose.startSession()

  try {
    const validatedData = matchedData(req)
    const { userId, permissionId } = validatedData

    await session.startTransaction()

    const userPermission = await UserPermission.findOneAndDelete({
      userId,
      permissionId
    }).session(session)

    if (!userPermission) {
      throw buildErrorObject(httpStatus.NOT_FOUND, 'User permission not found')
    }

    await session.commitTransaction()

    res.status(httpStatus.OK).json(
      buildResponse(httpStatus.OK, { message: 'Permission removed from user successfully' })
    )

  } catch (err) {
    await session.abortTransaction()
    handleError(res, err)
  } finally {
    session.endSession()
  }
}

export const getUserPermissionsController = async (req, res) => {
  try {
    const validatedData = matchedData(req)

    
    const { userId, includeGroups = false, module } = validatedData

    console.log("includeGroups" , includeGroups)




    // Verify user exists
    const user = await User.findById(userId).select('fullName email')
    if (!user) {
      throw buildErrorObject(httpStatus.NOT_FOUND, 'User not found')
    }

    let effectivePermissions
    
    if (includeGroups) {
      // Get combined individual + group permissions
      effectivePermissions = await getUserEffectivePermissions(userId)


      console.log("effectivePermissions" , effectivePermissions)

    
      
      // Filter by module if specified
      if (module) {
        effectivePermissions = effectivePermissions.filter(perm => perm.module === module.toLowerCase())
      }
    } else {
      // Get only individual permissions
      const pipeline = [
        {
          $match: { userId: new mongoose.Types.ObjectId(userId) }
        },
        {
          $lookup: {
            from: 'Permissions',
            localField: 'permissionId',
            foreignField: '_id',
            as: 'permission'
          }
        },
        {
          $unwind: '$permission'
        },
        {
          $match: {
            'permission.isActive': true,
            ...(module && { 'permission.module': module.toLowerCase() })
          }
        },
        {
          $project: {
            permissionName: '$permission.name',
            permissionId: 1,
            route: '$permission.route',
            module: '$permission.module',
            grantedActions: 1,
            sources: [{ type: 'individual', actions: '$grantedActions' }]
          }
        }
      ]

      effectivePermissions = await UserPermission.aggregate(pipeline)
    }

    console.log("effectivePermission" , effectivePermissions)

    const response = {
      user: {
        _id: user._id,
        fullName: user.fullName,
        email: user.email
      },
      permissions: effectivePermissions,
      totalPermissions: effectivePermissions.length,
      includesGroupPermissions: includeGroups
    }

    // ✅ CONSISTENT RESPONSE FORMAT - return permissions directly at response level
    res.status(httpStatus.OK).json(
      buildResponse(httpStatus.OK, effectivePermissions, `User permissions retrieved successfully`)
    )

  } catch (err) {
    handleError(res, err)
  }
}

export const bulkAssignPermissionsController = async (req, res) => {
  const session = await mongoose.startSession()

  try {
    const validatedData = matchedData(req)
    const { userId, permissions } = validatedData


    console.log("permissions" , permissions)

    await session.startTransaction()

    // Verify user exists
    const user = await User.findById(userId).session(session)
    if (!user) {
      throw buildErrorObject(httpStatus.NOT_FOUND, 'User not found')
    }

    // Verify all permissions exist and are active
    const permissionIds = permissions.map(p => p.permissionId)
    const validPermissions = await Permission.find({
      _id: { $in: permissionIds },
      isActive: true
    }).session(session)

    if (validPermissions.length !== permissionIds.length) {
      const foundIds = validPermissions.map(p => p._id.toString())
      const missingIds = permissionIds.filter(id => !foundIds.includes(id))
      throw buildErrorObject(
        httpStatus.BAD_REQUEST, 
        `Invalid or inactive permissions: ${missingIds.join(', ')}`
      )
    }

    // Remove existing permissions for this user
    await UserPermission.deleteMany({ userId }).session(session)

    // Create new permissions
    const userPermissions = permissions.map(({ permissionId, grantedActions }) => ({
      userId,
      permissionId,
      grantedActions: ensureViewAction(grantedActions)
    }))

    const createdPermissions = await UserPermission.insertMany(userPermissions, { session })
    await session.commitTransaction()

    // Populate permission details
    const populatedPermissions = await UserPermission.find({ userId })
      .populate('permissionId', 'name route description module')

    res.status(httpStatus.CREATED).json(
      buildResponse(httpStatus.CREATED, {
        message: 'Permissions assigned successfully',
        permissions: populatedPermissions,
        totalAssigned: populatedPermissions.length
      })
    )

  } catch (err) {
    await session.abortTransaction()
    handleError(res, err)
  } finally {
    session.endSession()
  }
}