import UserPermission from '../models/user-permission.schema.js'
import UserGroupMember from '../models/user-group-member.schema.js'
import UserGroup from '../models/user-group.schema.js'

/**
 * Get user's effective permissions (individual + group permissions combined)
 * @param {String} userId - User ID
 * @param {String} permissionName - Optional specific permission to check
 * @returns {Object} Combined permissions with actions
 */
const getUserEffectivePermissions = async (userId, permissionName = null) => {
  try {
    const pipeline = []


    console.log("userId" , userId , permissionName)

    // Match user's individual permissions
    const userPermissions = await UserPermission.aggregate([
      {
        $match: { userId: userId }
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
          ...(permissionName && { 'permission.name': permissionName })
        }
      },
      {
        $project: {
          permissionName: '$permission.name',
          permissionId: '$permissionId',
          route: '$permission.route',
          module: '$permission.module',
          grantedActions: 1,
          source: { $literal: 'individual' }
        }
      }
    ])

    // Get user's group permissions
    const groupPermissions = await UserGroupMember.aggregate([
      {
        $match: { userId: userId }
      },
      {
        $lookup: {
          from: 'UserGroups',
          localField: 'groupId',
          foreignField: '_id',
          as: 'group'
        }
      },
      {
        $unwind: '$group'
      },
      {
        $match: {
          'group.isActive': true
        }
      },
      {
        $unwind: '$group.permissions'
      },
      {
        $lookup: {
          from: 'Permissions',
          localField: 'group.permissions.permissionId',
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
          ...(permissionName && { 'permission.name': permissionName })
        }
      },
      {
        $project: {
          permissionName: '$permission.name',
          permissionId: '$group.permissions.permissionId',
          route: '$permission.route',
          module: '$permission.module',
          grantedActions: '$group.permissions.grantedActions',
          source: { $literal: 'group' },
          groupName: '$group.name'
        }
      }
    ])

    // Combine and merge permissions
    const allPermissions = [...userPermissions, ...groupPermissions]
    const mergedPermissions = {}

    allPermissions.forEach(perm => {
      const key = perm.permissionName
      
      if (!mergedPermissions[key]) {
        mergedPermissions[key] = {
          permissionId: perm.permissionId,
          permissionName: perm.permissionName,
          route: perm.route,
          module: perm.module,
          grantedActions: new Set(perm.grantedActions),
          sources: []
        }
      } else {
        // Merge actions (union of all granted actions)
        perm.grantedActions.forEach(action => {
          mergedPermissions[key].grantedActions.add(action)
        })
      }

      // Track sources
      mergedPermissions[key].sources.push({
        type: perm.source,
        actions: perm.grantedActions,
        ...(perm.groupName && { groupName: perm.groupName })
      })
    })

    // Convert Set back to Array and format response
    const effectivePermissions = Object.values(mergedPermissions).map(perm => ({
      ...perm,
      grantedActions: Array.from(perm.grantedActions).sort()
    }))

    // If checking specific permission, return just that permission's actions
    if (permissionName) {
      const specificPermission = effectivePermissions.find(p => p.permissionName === permissionName)
      return specificPermission ? specificPermission.grantedActions : []
    }

    return effectivePermissions

  } catch (error) {
    console.error('Error getting user effective permissions:', error)
    throw error
  }
}

export default getUserEffectivePermissions