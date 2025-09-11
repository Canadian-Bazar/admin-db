import { matchedData } from 'express-validator'
import httpStatus from 'http-status'
import mongoose from 'mongoose'

import User from '../models/user.schema.js'
import Roles from '../models/role.schema.js'
import Permission from '../models/permission.schema.js'
import UserPermission from '../models/user-permission.schema.js'
import UserGroup from '../models/user-group.schema.js'
import UserGroupMember from '../models/user-group-member.schema.js'
import buildResponse from '../utils/buildResponse.js'
import buildErrorObject from '../utils/buildErrorObject.js'
import handleError from '../utils/handleError.js'
import getUserEffectivePermissions from '../utils/getUserEffectivePermissions.js'
import { ensureViewAction } from '../utils/permissionChecker.js'

export const createUserWithPermissionsController = async (req, res) => {
  const session = await mongoose.startSession()

  try {
    const validatedData = matchedData(req)
    const { 
      fullName, 
      email, 
      password, 
      permissions = [], 
      groups = [] 
    } = validatedData

    await session.startTransaction()

    // Check if user already exists
    const existingUser = await User.findOne({ email }).session(session)
    if (existingUser) {
      throw buildErrorObject(httpStatus.CONFLICT, 'User already exists with this email')
    }

    // Always assign 'admin' role for all new users
    const adminRole = await Roles.findOne({ role: 'admin' }).session(session)
    if (!adminRole) {
      throw buildErrorObject(httpStatus.INTERNAL_SERVER_ERROR, 'Admin role not found')
    }

    // Create user with admin role
    const user = new User({
      fullName,
      email,
      password,
      roleId: adminRole._id
    })

    await user.save({ session })

    // Handle permissions if provided
    if (permissions.length > 0) {
      // Validate permissions
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

      // Create user permissions
      const userPermissions = permissions.map(({ permissionId, grantedActions }) => ({
        userId: user._id,
        permissionId,
        grantedActions: ensureViewAction(grantedActions)
      }))

      await UserPermission.insertMany(userPermissions, { session })
    }

    // Handle groups if provided
    if (groups.length > 0) {
      // Validate groups
      const validGroups = await UserGroup.find({
        _id: { $in: groups },
        isActive: true
      }).session(session)

      if (validGroups.length !== groups.length) {
        const foundIds = validGroups.map(g => g._id.toString())
        const missingIds = groups.filter(id => !foundIds.includes(id))
        throw buildErrorObject(
          httpStatus.BAD_REQUEST,
          `Invalid or inactive groups: ${missingIds.join(', ')}`
        )
      }

      // Create group memberships
      const groupMemberships = groups.map(groupId => ({
        userId: user._id,
        groupId
      }))

      await UserGroupMember.insertMany(groupMemberships, { session })
    }

    await session.commitTransaction()

    // Get user with populated data (excluding password)
    const createdUser = await User.findById(user._id)
      .select('-password')
      .populate('roleId', 'role label description')

    res.status(httpStatus.CREATED).json(
      buildResponse(httpStatus.CREATED, {
        user: createdUser,
        permissionsAssigned: permissions.length,
        groupsAssigned: groups.length
      })
    )

  } catch (err) {
    await session.abortTransaction()
    handleError(res, err)
  } finally {
    session.endSession()
  }
}

export const updateUserController = async (req, res) => {
  const session = await mongoose.startSession()

  try {
    const validatedData = matchedData(req)
    const { userId } = validatedData
    const updateData = { ...validatedData }
    delete updateData.userId

    await session.startTransaction()

    // Check if user exists
    const user = await User.findById(userId).session(session)
    if (!user) {
      throw buildErrorObject(httpStatus.NOT_FOUND, 'User not found')
    }

    // If email is being updated, check for uniqueness
    if (updateData.email && updateData.email !== user.email) {
      const existingUser = await User.findOne({
        email: updateData.email,
        _id: { $ne: userId }
      }).session(session)

      if (existingUser) {
        throw buildErrorObject(httpStatus.CONFLICT, 'Email already exists')
      }
    }

    // If role is being updated, verify it exists
    if (updateData.roleId) {
      const role = await Roles.findById(updateData.roleId).session(session)
      if (!role) {
        throw buildErrorObject(httpStatus.BAD_REQUEST, 'Invalid role ID')
      }
    }

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      updateData,
      { new: true, session }
    ).select('-password').populate('roleId', 'role label description')

    await session.commitTransaction()

    res.status(httpStatus.OK).json(
      buildResponse(httpStatus.OK, updatedUser)
    )

  } catch (err) {
    await session.abortTransaction()
    handleError(res, err)
  } finally {
    session.endSession()
  }
}

export const getUsersController = async (req, res) => {
  try {
    const validatedData = matchedData(req)
    const { 
      page = 1, 
      limit = 10, 
      search, 
      roleId,
      includePermissions = false,
      includeGroups = false
    } = validatedData

    const query = {}

    // Build search query
    if (search) {
      query.$or = [
        { fullName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ]
    }

    if (roleId) {
      query.roleId = roleId
    }

    const options = {
      page: parseInt(page),
      limit: parseInt(limit),
      sort: { createdAt: -1 },
      select: '-password',
      populate: {
        path: 'roleId',
        select: 'role label description'
      }
    }

    const users = await User.paginate(query, options)

    // Add permissions and groups if requested
    if (includePermissions || includeGroups) {
      for (let user of users.docs) {
        if (includePermissions) {
          user._doc.effectivePermissions = await getUserEffectivePermissions(user._id)
        }
        
        if (includeGroups) {
          const userGroups = await UserGroupMember.find({ userId: user._id })
            .populate('groupId', 'name description isActive')
          user._doc.groups = userGroups.map(ug => ug.groupId)
        }
      }
    }

    res.status(httpStatus.OK).json(
      buildResponse(httpStatus.OK, users)
    )

  } catch (err) {
    handleError(res, err)
  }
}

export const getUserByIdController = async (req, res) => {
  try {
    const validatedData = matchedData(req)
    const { 
      userId,
      includePermissions = true,
      includeGroups = true
    } = validatedData

    const user = await User.findById(userId)
      .select('-password')
      .populate('roleId', 'role label description')

    if (!user) {
      throw buildErrorObject(httpStatus.NOT_FOUND, 'User not found')
    }

    const response = { ...user._doc }

    if (includePermissions) {
      response.effectivePermissions = await getUserEffectivePermissions(userId)
    }

    if (includeGroups) {
      const userGroups = await UserGroupMember.find({ userId })
        .populate('groupId', 'name description isActive')
        .sort({ assignedAt: -1 })
      response.groups = userGroups.map(ug => ({
        ...ug.groupId._doc,
        assignedAt: ug.assignedAt
      }))
    }

    res.status(httpStatus.OK).json(
      buildResponse(httpStatus.OK, response)
    )

  } catch (err) {
    handleError(res, err)
  }
}

export const deleteUserController = async (req, res) => {
  const session = await mongoose.startSession()

  try {
    const validatedData = matchedData(req)
    const { userId } = validatedData

    await session.startTransaction()

    const user = await User.findById(userId).session(session)
    if (!user) {
      throw buildErrorObject(httpStatus.NOT_FOUND, 'User not found')
    }

    // Remove user's permissions and group memberships
    await Promise.all([
      UserPermission.deleteMany({ userId }).session(session),
      UserGroupMember.deleteMany({ userId }).session(session)
    ])

    // Delete user
    await User.findByIdAndDelete(userId).session(session)

    await session.commitTransaction()

    res.status(httpStatus.OK).json(
      buildResponse(httpStatus.OK, { message: 'User deleted successfully' })
    )

  } catch (err) {
    await session.abortTransaction()
    handleError(res, err)
  } finally {
    session.endSession()
  }
}

export const changeUserPasswordController = async (req, res) => {
  const session = await mongoose.startSession()

  try {
    const validatedData = matchedData(req)
    const { userId, newPassword } = validatedData

    await session.startTransaction()

    const user = await User.findById(userId).session(session)
    if (!user) {
      throw buildErrorObject(httpStatus.NOT_FOUND, 'User not found')
    }

    user.password = newPassword // Will be hashed by pre-save middleware
    await user.save({ session })

    await session.commitTransaction()

    res.status(httpStatus.OK).json(
      buildResponse(httpStatus.OK, { message: 'Password changed successfully' })
    )

  } catch (err) {
    await session.abortTransaction()
    handleError(res, err)
  } finally {
    session.endSession()
  }
}