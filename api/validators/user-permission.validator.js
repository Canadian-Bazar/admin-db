import { check, query, param } from 'express-validator'
import validateRequest from '../utils/validateRequest.js'

export const validateAssignPermissionToUser = [
  check('userId')
    .exists()
    .withMessage('User ID is required')
    .isMongoId()
    .withMessage('User ID must be a valid MongoDB ObjectId'),

  check('permissionId')
    .exists()
    .withMessage('Permission ID is required')
    .isMongoId()
    .withMessage('Permission ID must be a valid MongoDB ObjectId'),

  check('grantedActions')
    .exists()
    .withMessage('Granted actions are required')
    .isArray({ min: 1 })
    .withMessage('Granted actions must be a non-empty array')
    .custom((actions) => {
      const validActions = ['view', 'create', 'edit', 'delete']
      const invalidActions = actions.filter(action => !validActions.includes(action))
      if (invalidActions.length > 0) {
        throw new Error(`Invalid actions: ${invalidActions.join(', ')}. Valid actions are: ${validActions.join(', ')}`)
      }
      // Check for duplicates
      if (new Set(actions).size !== actions.length) {
        throw new Error('Duplicate actions are not allowed')
      }
      return true
    }),

  (req, res, next) => validateRequest(req, res, next)
]

export const validateUpdateUserPermission = [
  check('userId')
    .exists()
    .withMessage('User ID is required')
    .isMongoId()
    .withMessage('User ID must be a valid MongoDB ObjectId'),

  check('permissionId')
    .exists()
    .withMessage('Permission ID is required')
    .isMongoId()
    .withMessage('Permission ID must be a valid MongoDB ObjectId'),

  check('grantedActions')
    .exists()
    .withMessage('Granted actions are required')
    .isArray({ min: 1 })
    .withMessage('Granted actions must be a non-empty array')
    .custom((actions) => {
      const validActions = ['view', 'create', 'edit', 'delete']
      const invalidActions = actions.filter(action => !validActions.includes(action))
      if (invalidActions.length > 0) {
        throw new Error(`Invalid actions: ${invalidActions.join(', ')}. Valid actions are: ${validActions.join(', ')}`)
      }
      // Check for duplicates
      if (new Set(actions).size !== actions.length) {
        throw new Error('Duplicate actions are not allowed')
      }
      return true
    }),

  (req, res, next) => validateRequest(req, res, next)
]

export const validateRemovePermissionFromUser = [
  check('userId')
    .exists()
    .withMessage('User ID is required')
    .isMongoId()
    .withMessage('User ID must be a valid MongoDB ObjectId'),

  check('permissionId')
    .exists()
    .withMessage('Permission ID is required')
    .isMongoId()
    .withMessage('Permission ID must be a valid MongoDB ObjectId'),

  (req, res, next) => validateRequest(req, res, next)
]

export const validateGetUserPermissions = [
  param('userId')
    .isMongoId()
    .withMessage('User ID must be a valid MongoDB ObjectId'),

  query('includeGroups')
    .optional()
    .isBoolean()
    .withMessage('includeGroups must be a boolean'),

  query('module')
    .optional()
    .isString()
    .withMessage('Module must be a string')
    .isLength({ min: 1, max: 50 })
    .withMessage('Module must be between 1 and 50 characters'),

  (req, res, next) => validateRequest(req, res, next)
]

export const validateBulkAssignPermissions = [
  check('userId')
    .exists()
    .withMessage('User ID is required')
    .isMongoId()
    .withMessage('User ID must be a valid MongoDB ObjectId'),

  check('permissions')
    .exists()
    .withMessage('Permissions are required')
    .isArray()
    .withMessage('Permissions must be an array'),

  check('permissions.*.permissionId')
    .if(check('permissions').isArray({ min: 1 }))
    .isMongoId()
    .withMessage('Permission ID must be a valid MongoDB ObjectId'),

  check('permissions.*.grantedActions')
    .if(check('permissions').isArray({ min: 1 }))
    .isArray({ min: 1 })
    .withMessage('Granted actions must be a non-empty array')
    .custom((actions) => {
      const validActions = ['view', 'create', 'edit', 'delete']
      const invalidActions = actions.filter(action => !validActions.includes(action))
      if (invalidActions.length > 0) {
        throw new Error(`Invalid actions: ${invalidActions.join(', ')}. Valid actions are: ${validActions.join(', ')}`)
      }
      return true
    }),

  (req, res, next) => validateRequest(req, res, next)
]