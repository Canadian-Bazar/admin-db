import { matchedData } from 'express-validator'
import httpStatus from 'http-status'
import mongoose from 'mongoose'

import User from '../models/user.schema.js'
import Permission from '../models/permission.schema.js'
import UserGroup from '../models/user-group.schema.js'
import UserGroupMember from '../models/user-group-member.schema.js'
import buildResponse from '../utils/buildResponse.js'
import buildErrorObject from '../utils/buildErrorObject.js'
import handleError from '../utils/handleError.js'
import { ensureViewAction } from '../utils/permissionChecker.js'

export const createUserGroupController = async (req, res) => {
  const session = await mongoose.startSession()

  try {
    const validatedData = matchedData(req)
    const { name, description, permissions = [] } = validatedData

    await session.startTransaction()

    // Check if group name already exists
    const existingGroup = await UserGroup.findOne({ name }).session(session)
    if (existingGroup) {
      throw buildErrorObject(httpStatus.CONFLICT, 'Group name already exists')
    }

    // Validate permissions if provided
    if (permissions.length > 0) {
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

      // Ensure 'view' action is included in all permissions
      permissions.forEach(permission => {
        permission.grantedActions = ensureViewAction(permission.grantedActions)
      })
    }

    const userGroup = new UserGroup({
      name,
      description,
      permissions
    })

    await userGroup.save({ session })
    await session.commitTransaction()

    // Populate permission details
    await userGroup.populate('permissions.permissionId', 'name route description module')

    res.status(httpStatus.CREATED).json(
      buildResponse(httpStatus.CREATED, userGroup)
    )

  } catch (err) {
    await session.abortTransaction()
    handleError(res, err)
  } finally {
    session.endSession()
  }
}

export const updateUserGroupController = async (req, res) => {
  const session = await mongoose.startSession()

  try {
    const validatedData = matchedData(req)
    const { groupId } = validatedData
    const updateData = { ...validatedData }
    delete updateData.groupId

    await session.startTransaction()

    // Check if group exists
    const group = await UserGroup.findById(groupId).session(session)
    if (!group) {
      throw buildErrorObject(httpStatus.NOT_FOUND, 'Group not found')
    }

    // If name is being updated, check for uniqueness
    if (updateData.name && updateData.name !== group.name) {
      const existingGroup = await UserGroup.findOne({
        name: updateData.name,
        _id: { $ne: groupId }
      }).session(session)

      if (existingGroup) {
        throw buildErrorObject(httpStatus.CONFLICT, 'Group name already exists')
      }
    }

    const updatedGroup = await UserGroup.findByIdAndUpdate(
      groupId,
      updateData,
      { new: true, session }
    )

    await session.commitTransaction()

    // Populate permission details
    await updatedGroup.populate('permissions.permissionId', 'name route description module')

    res.status(httpStatus.OK).json(
      buildResponse(httpStatus.OK, updatedGroup)
    )

  } catch (err) {
    await session.abortTransaction()
    handleError(res, err)
  } finally {
    session.endSession()
  }
}

export const getAllUserGroupsController = async (req, res) => {
  try {
    const validatedData = matchedData(req)
    const { 
      page = 1, 
      limit = 10, 
      search, 
      isActive 
    } = validatedData

    const query = {}

    // Build search query
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ]
    }

    if (typeof isActive === 'boolean') {
      query.isActive = isActive
    }

    const options = {
      page: parseInt(page),
      limit: parseInt(limit),
      sort: { name: 1 },
      populate: {
        path: 'permissions.permissionId',
        select: 'name route description module'
      }
    }

    const groups = await UserGroup.paginate(query, options)

    // Add member count to each group
    for (let group of groups.docs) {
      const memberCount = await UserGroupMember.countDocuments({ groupId: group._id })
      group._doc.memberCount = memberCount
    }

    res.status(httpStatus.OK).json(
      buildResponse(httpStatus.OK, groups)
    )

  } catch (err) {
    handleError(res, err)
  }
}

export const getUserGroupByIdController = async (req, res) => {
  try {
    const validatedData = matchedData(req)
    const { groupId } = validatedData

    const group = await UserGroup.findById(groupId)
      .populate('permissions.permissionId', 'name route description module')

    if (!group) {
      throw buildErrorObject(httpStatus.NOT_FOUND, 'Group not found')
    }

    // Get member count and recent members
    const [memberCount, recentMembers] = await Promise.all([
      UserGroupMember.countDocuments({ groupId }),
      UserGroupMember.find({ groupId })
        .sort({ assignedAt: -1 })
        .limit(5)
        .populate('userId', 'fullName email')
    ])

    const response = {
      ...group._doc,
      memberCount,
      recentMembers
    }

    res.status(httpStatus.OK).json(
      buildResponse(httpStatus.OK, response)
    )

  } catch (err) {
    handleError(res, err)
  }
}

export const assignUserToGroupController = async (req, res) => {
  const session = await mongoose.startSession()

  try {
    const validatedData = matchedData(req)
    const { groupId, userId } = validatedData

    await session.startTransaction()

    // Verify group exists and is active
    const group = await UserGroup.findOne({ 
      _id: groupId, 
      isActive: true 
    }).session(session)
    if (!group) {
      throw buildErrorObject(httpStatus.NOT_FOUND, 'Group not found or inactive')
    }

    // Verify user exists
    const user = await User.findById(userId).session(session)
    if (!user) {
      throw buildErrorObject(httpStatus.NOT_FOUND, 'User not found')
    }

    // Check if user is already in the group
    const existingMembership = await UserGroupMember.findOne({
      userId,
      groupId
    }).session(session)

    if (existingMembership) {
      // User is already in the group, return success instead of error
      await session.commitTransaction()
      
      // Populate existing membership details
      await existingMembership.populate([
        { path: 'userId', select: 'fullName email' },
        { path: 'groupId', select: 'name description' }
      ])

      return res.status(httpStatus.OK).json(
        buildResponse(httpStatus.OK, existingMembership, 'User is already a member of this group')
      )
    }

    const groupMember = new UserGroupMember({
      userId,
      groupId
    })

    await groupMember.save({ session })
    await session.commitTransaction()

    // Populate user and group details
    await groupMember.populate([
      { path: 'userId', select: 'fullName email' },
      { path: 'groupId', select: 'name description' }
    ])

    res.status(httpStatus.CREATED).json(
      buildResponse(httpStatus.CREATED, groupMember)
    )

  } catch (err) {
    await session.abortTransaction()
    handleError(res, err)
  } finally {
    session.endSession()
  }
}

export const removeUserFromGroupController = async (req, res) => {
  const session = await mongoose.startSession()

  try {
    const validatedData = matchedData(req)
    const { groupId, userId } = validatedData

    await session.startTransaction()

    const groupMember = await UserGroupMember.findOneAndDelete({
      userId,
      groupId
    }).session(session)

    if (!groupMember) {
      // User was not in the group, but that's okay - return success
      await session.commitTransaction()
      return res.status(httpStatus.OK).json(
        buildResponse(httpStatus.OK, { message: 'User was not a member of this group (already removed)' })
      )
    }

    await session.commitTransaction()

    res.status(httpStatus.OK).json(
      buildResponse(httpStatus.OK, { message: 'User removed from group successfully' })
    )

  } catch (err) {
    await session.abortTransaction()
    handleError(res, err)
  } finally {
    session.endSession()
  }
}

export const updateGroupPermissionsController = async (req, res) => {
  const session = await mongoose.startSession()

  try {
    const validatedData = matchedData(req)
    const { groupId, permissions } = validatedData

    await session.startTransaction()

    // Check if group exists
    const group = await UserGroup.findById(groupId).session(session)
    if (!group) {
      throw buildErrorObject(httpStatus.NOT_FOUND, 'Group not found')
    }

    // Validate permissions if any are provided
    if (permissions && permissions.length > 0) {
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

      // Ensure 'view' action is included in all permissions
      permissions.forEach(permission => {
        permission.grantedActions = ensureViewAction(permission.grantedActions)
      })
    }

    group.permissions = permissions || []
    await group.save({ session })

    await session.commitTransaction()

    // Populate permission details
    await group.populate('permissions.permissionId', 'name route description module')

    res.status(httpStatus.OK).json(
      buildResponse(httpStatus.OK, group)
    )

  } catch (err) {
    await session.abortTransaction()
    handleError(res, err)
  } finally {
    session.endSession()
  }
}

export const getGroupMembersController = async (req, res) => {
  try {
    const validatedData = matchedData(req)
    const { 
      groupId, 
      page = 1, 
      limit = 10 
    } = validatedData

    const query = { groupId }
    const options = {
      page: parseInt(page),
      limit: parseInt(limit),
      sort: { assignedAt: -1 },
      populate: {
        path: 'userId',
        select: 'fullName email createdAt'
      }
    }

    const members = await UserGroupMember.paginate(query, options)

    res.status(httpStatus.OK).json(
      buildResponse(httpStatus.OK, members)
    )

  } catch (err) {
    handleError(res, err)
  }
}

export const activateUserGroupController = async (req, res) => {
  const session = await mongoose.startSession()

  try {
    const validatedData = matchedData(req)
    const { groupId } = validatedData

    await session.startTransaction()

    const group = await UserGroup.findById(groupId).session(session)
    if (!group) {
      throw buildErrorObject(httpStatus.NOT_FOUND, 'Group not found')
    }

    if (group.isActive) {
      throw buildErrorObject(httpStatus.BAD_REQUEST, 'Group is already active')
    }

    group.isActive = true
    await group.save({ session })

    await session.commitTransaction()

    res.status(httpStatus.OK).json(
      buildResponse(httpStatus.OK, group)
    )

  } catch (err) {
    await session.abortTransaction()
    handleError(res, err)
  } finally {
    session.endSession()
  }
}

export const deactivateUserGroupController = async (req, res) => {
  const session = await mongoose.startSession()

  try {
    const validatedData = matchedData(req)
    const { groupId } = validatedData

    await session.startTransaction()

    const group = await UserGroup.findById(groupId).session(session)
    if (!group) {
      throw buildErrorObject(httpStatus.NOT_FOUND, 'Group not found')
    }

    if (!group.isActive) {
      throw buildErrorObject(httpStatus.BAD_REQUEST, 'Group is already inactive')
    }

    group.isActive = false
    await group.save({ session })

    await session.commitTransaction()

    res.status(httpStatus.OK).json(
      buildResponse(httpStatus.OK, group)
    )

  } catch (err) {
    await session.abortTransaction()
    handleError(res, err)
  } finally {
    session.endSession()
  }
}

export const getUserGroupMembershipsController = async (req, res) => {
  try {
    const { userId } = req.params

    // Verify user exists
    const User = (await import('../models/user.schema.js')).default
    const user = await User.findById(userId)
    if (!user) {
      throw buildErrorObject(httpStatus.NOT_FOUND, 'User not found')
    }

    // Get user's group memberships
    const memberships = await UserGroupMember.find({ userId })
      .populate({
        path: 'groupId',
        select: 'name description isActive',
        match: { isActive: true }
      })
      .sort({ assignedAt: -1 })

    // Filter out memberships where group was not found (inactive groups)
    const activeMemberships = memberships.filter(m => m.groupId)

    const response = activeMemberships.map(membership => ({
      _id: membership._id,
      groupId: membership.groupId._id,
      groupName: membership.groupId.name,
      groupDescription: membership.groupId.description,
      assignedAt: membership.assignedAt
    }))

    res.status(httpStatus.OK).json(
      buildResponse(httpStatus.OK, response)
    )

  } catch (err) {
    handleError(res, err)
  }
}

export const deleteUserGroupController = async (req, res) => {
  const session = await mongoose.startSession()

  try {
    const validatedData = matchedData(req)
    const { groupId } = validatedData

    await session.startTransaction()

    const group = await UserGroup.findById(groupId).session(session)
    if (!group) {
      throw buildErrorObject(httpStatus.NOT_FOUND, 'Group not found')
    }

    // Check if group has any members
    const memberCount = await UserGroupMember.countDocuments({ groupId }).session(session)
    if (memberCount > 0) {
      throw buildErrorObject(
        httpStatus.BAD_REQUEST, 
        'Cannot delete group with active members. Remove all members first.'
      )
    }

    // Delete the group
    await UserGroup.findByIdAndDelete(groupId).session(session)
    
    await session.commitTransaction()

    res.status(httpStatus.OK).json(
      buildResponse(httpStatus.OK, { message: 'Group deleted successfully' })
    )

  } catch (err) {
    await session.abortTransaction()
    handleError(res, err)
  } finally {
    session.endSession()
  }
}