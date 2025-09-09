import mongoose from 'mongoose'
import getUserEffectivePermissions from './getUserEffectivePermissions.js'

/**
 * Check if user has specific permission and action
 * @param {String} userId - User ID  
 * @param {String} permissionName - Permission name to check
 * @param {String} requiredAction - Action to check (view, create, edit, delete)
 * @returns {Boolean} - True if user has permission
 */
export const  checkUserPermission = async (userId, permissionName, requiredAction) => {
  try {
    // Convert string ID to ObjectId if needed
    const userObjectId = mongoose.Types.ObjectId.isValid(userId) 
      ? new mongoose.Types.ObjectId(userId) 
      : userId

    const userActions = await getUserEffectivePermissions(userObjectId, permissionName)
    
    return userActions.includes(requiredAction)
  } catch (error) {
    console.error('Error checking user permission:', error)
    return false
  }
}

/**
 * Check multiple permissions at once
 * @param {String} userId - User ID
 * @param {Array} permissionChecks - Array of {permissionName, action} objects
 * @returns {Object} - Object with permission results
 */
export const checkMultiplePermissions = async (userId, permissionChecks) => {
  try {
    const userObjectId = mongoose.Types.ObjectId.isValid(userId) 
      ? new mongoose.Types.ObjectId(userId) 
      : userId

    const allPermissions = await getUserEffectivePermissions(userObjectId)
    const results = {}

    permissionChecks.forEach(({ permissionName, action }) => {
      const permission = allPermissions.find(p => p.permissionName === permissionName)
      const key = `${permissionName}:${action}`
      results[key] = permission ? permission.grantedActions.includes(action) : false
    })

    return results
  } catch (error) {
    console.error('Error checking multiple permissions:', error)
    return {}
  }
}

/**
 * Get user permissions for a specific module
 * @param {String} userId - User ID
 * @param {String} moduleName - Module name
 * @returns {Array} - Array of permissions for the module
 */
export const getUserPermissionsByModule = async (userId, moduleName) => {
  try {
    const userObjectId = mongoose.Types.ObjectId.isValid(userId) 
      ? new mongoose.Types.ObjectId(userId) 
      : userId

    const allPermissions = await getUserEffectivePermissions(userObjectId)
    
    return allPermissions.filter(permission => permission.module === moduleName)
  } catch (error) {
    console.error('Error getting user permissions by module:', error)
    return []
  }
}

/**
 * Auto-detect required action from HTTP method
 * @param {String} method - HTTP method (GET, POST, PUT, PATCH, DELETE)
 * @returns {String} - Required action
 */
export const getActionFromMethod = (method) => {
  const methodActionMap = {
    'GET': 'view',
    'POST': 'create',
    'PUT': 'edit',
    'PATCH': 'edit',
    'DELETE': 'delete'
  }
  
  return methodActionMap[method.toUpperCase()] || 'view'
}

/**
 * Validate if actions array is valid
 * @param {Array} actions - Array of actions
 * @returns {Object} - {isValid, invalidActions}
 */
export const validateActions = (actions) => {
  const validActions = ['view', 'create', 'edit', 'delete']
  const invalidActions = actions.filter(action => !validActions.includes(action))
  
  return {
    isValid: invalidActions.length === 0,
    invalidActions,
    validActions
  }
}

/**
 * Ensure 'view' action is always included
 * @param {Array} actions - Array of actions
 * @returns {Array} - Actions with 'view' included
 */
export const ensureViewAction = (actions) => {
  const actionsSet = new Set(actions)
  actionsSet.add('view')
  return Array.from(actionsSet).sort()
}

export default {
  checkUserPermission,
  checkMultiplePermissions,
  getUserPermissionsByModule,
  getActionFromMethod,
  validateActions,
  ensureViewAction
}