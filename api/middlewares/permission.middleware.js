import httpStatus from 'http-status'
import buildErrorObject from '../utils/buildErrorObject.js'
import handleError from '../utils/handleError.js'
import { checkUserPermission, getActionFromMethod } from '../utils/permissionChecker.js'

/**
 * Permission checking middleware
 * @param {String} permissionName - Name of the permission to check
 * @param {String|null} action - Specific action to check, or null for auto-detection
 * @returns {Function} Express middleware function
 * 
 * Usage examples:
 * - checkPermission('categories') // Auto-detects action from HTTP method
 * - checkPermission('users', 'create') // Explicit action check
 * - checkPermission('reports', 'view') // Explicit view permission
 */
export const checkPermission = (permissionName, action = null) => {
  return async (req, res, next) => {
    try {
      // Check if user is authenticated
      if (!req.user || !req.user._id) {
        throw buildErrorObject(httpStatus.UNAUTHORIZED, 'User not authenticated')
      }

      console.log(req.user)


      if(req.user.role==='super_admin'){
        next()
        return
      }

      const userId = req.user._id

      // Determine required action
      const requiredAction = action || getActionFromMethod(req.method)

      // Check if user has the required permission and action
      const hasPermission = await checkUserPermission(userId, permissionName, requiredAction)

      if (!hasPermission) {
        throw buildErrorObject(
          httpStatus.FORBIDDEN, 
          `Access denied. Required permission: ${permissionName}:${requiredAction}`
        )
      }

      // Add permission info to request for potential use in controllers
      req.permission = {
        name: permissionName,
        action: requiredAction,
        granted: true
      }

      next()

    } catch (err) {
      handleError(res, err)
    }
  }
}

/**
 * Check multiple permissions (user must have ALL permissions)
 * @param {Array} permissionChecks - Array of {name, action} objects
 * @returns {Function} Express middleware function
 * 
 * Usage example:
 * checkMultiplePermissions([
 *   { name: 'users', action: 'view' },
 *   { name: 'reports', action: 'create' }
 * ])
 */
export const checkMultiplePermissions = (permissionChecks) => {
  return async (req, res, next) => {
    try {
      // Check if user is authenticated
      if (!req.user || !req.user._id) {
        throw buildErrorObject(httpStatus.UNAUTHORIZED, 'User not authenticated')
      }

      const userId = req.user._id
      const failedChecks = []

      // Check each permission
      for (const { name, action } of permissionChecks) {
        const requiredAction = action || getActionFromMethod(req.method)
        const hasPermission = await checkUserPermission(userId, name, requiredAction)
        
        if (!hasPermission) {
          failedChecks.push(`${name}:${requiredAction}`)
        }
      }

      if (failedChecks.length > 0) {
        throw buildErrorObject(
          httpStatus.FORBIDDEN, 
          `Access denied. Missing permissions: ${failedChecks.join(', ')}`
        )
      }

      // Add permission info to request
      req.permissions = permissionChecks.map(check => ({
        name: check.name,
        action: check.action || getActionFromMethod(req.method),
        granted: true
      }))

      next()

    } catch (err) {
      handleError(res, err)
    }
  }
}

/**
 * Check if user has ANY of the specified permissions (OR logic)
 * @param {Array} permissionChecks - Array of {name, action} objects
 * @returns {Function} Express middleware function
 * 
 * Usage example:
 * checkAnyPermission([
 *   { name: 'admin', action: 'view' },
 *   { name: 'manager', action: 'view' }
 * ])
 */
export const checkAnyPermission = (permissionChecks) => {
  return async (req, res, next) => {
    try {
      // Check if user is authenticated
      if (!req.user || !req.user._id) {
        throw buildErrorObject(httpStatus.UNAUTHORIZED, 'User not authenticated')
      }

      const userId = req.user._id
      let hasAnyPermission = false
      const checkedPermissions = []

      // Check each permission until one is found
      for (const { name, action } of permissionChecks) {
        const requiredAction = action || getActionFromMethod(req.method)
        const hasPermission = await checkUserPermission(userId, name, requiredAction)
        
        checkedPermissions.push({
          name,
          action: requiredAction,
          granted: hasPermission
        })

        if (hasPermission) {
          hasAnyPermission = true
          break // Stop checking once we find a valid permission
        }
      }

      if (!hasAnyPermission) {
        const requiredPerms = permissionChecks.map(check => 
          `${check.name}:${check.action || getActionFromMethod(req.method)}`
        ).join(' OR ')
        
        throw buildErrorObject(
          httpStatus.FORBIDDEN, 
          `Access denied. Required permissions (any): ${requiredPerms}`
        )
      }

      // Add permission info to request
      req.permissions = checkedPermissions
      req.grantedPermission = checkedPermissions.find(p => p.granted)

      next()

    } catch (err) {
      handleError(res, err)
    }
  }
}

/**
 * Check permission only if condition is met
 * @param {Function} condition - Function that returns boolean based on req
 * @param {String} permissionName - Permission name to check
 * @param {String|null} action - Action to check
 * @returns {Function} Express middleware function
 * 
 * Usage example:
 * checkPermissionIf(
 *   (req) => req.params.userId !== req.user._id, // Only check if user is accessing another user's data
 *   'users',
 *   'view'
 * )
 */
export const checkPermissionIf = (condition, permissionName, action = null) => {
  return async (req, res, next) => {
    try {
      // Check if user is authenticated
      if (!req.user || !req.user._id) {
        throw buildErrorObject(httpStatus.UNAUTHORIZED, 'User not authenticated')
      }

      // Check if condition is met
      const shouldCheck = await Promise.resolve(condition(req))
      
      if (!shouldCheck) {
        // Condition not met, skip permission check
        next()
        return
      }

      // Condition met, check permission
      const userId = req.user._id
      const requiredAction = action || getActionFromMethod(req.method)
      const hasPermission = await checkUserPermission(userId, permissionName, requiredAction)

      if (!hasPermission) {
        throw buildErrorObject(
          httpStatus.FORBIDDEN, 
          `Access denied. Required permission: ${permissionName}:${requiredAction}`
        )
      }

      // Add permission info to request
      req.permission = {
        name: permissionName,
        action: requiredAction,
        granted: true,
        conditional: true
      }

      next()

    } catch (err) {
      handleError(res, err)
    }
  }
}

export default {
  checkPermission,
  checkMultiplePermissions,
  checkAnyPermission,
  checkPermissionIf
}