import { check, query, param } from 'express-validator'
import validateRequest from '../utils/validateRequest.js'
import { validatePaginateValidator } from './paginate.validator.js'

export const validateCreateUserGroup = [
  check('name')
    .exists()
    .withMessage('Group name is required')
    .notEmpty()
    .withMessage('Group name cannot be empty')
    .isString()
    .withMessage('Group name must be a string')
    .isLength({ min: 2, max: 100 })
    .withMessage('Group name must be between 2 and 100 characters'),

  check('description')
    .optional()
    .isString()
    .withMessage('Description must be a string')
    .isLength({ max: 500 })
    .withMessage('Description cannot exceed 500 characters'),

  check('permissions')
    .optional()
    .isArray()
    .withMessage('Permissions must be an array'),

  check('permissions.*.permissionId')
    .if(check('permissions').exists())
    .isMongoId()
    .withMessage('Permission ID must be a valid MongoDB ObjectId'),

  check('permissions.*.grantedActions')
    .if(check('permissions').exists())
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

export const validateUpdateUserGroup = [
  param('groupId')
    .isMongoId()
    .withMessage('Group ID must be a valid MongoDB ObjectId'),

  check('name')
    .optional()
    .notEmpty()
    .withMessage('Group name cannot be empty')
    .isString()
    .withMessage('Group name must be a string')
    .isLength({ min: 2, max: 100 })
    .withMessage('Group name must be between 2 and 100 characters'),

  check('description')
    .optional()
    .isString()
    .withMessage('Description must be a string')
    .isLength({ max: 500 })
    .withMessage('Description cannot exceed 500 characters'),

  check('isActive')
    .optional()
    .isBoolean()
    .withMessage('isActive must be a boolean'),

  (req, res, next) => validateRequest(req, res, next)
]

export const validateGetUserGroups = [
  validatePaginateValidator ,

  query('isActive')
    .optional()
    .isBoolean()
    .withMessage('isActive must be a boolean'),

  (req, res, next) => validateRequest(req, res, next)
]

export const validateGetUserGroupById = [
  param('groupId')
    .isMongoId()
    .withMessage('Group ID must be a valid MongoDB ObjectId'),

  (req, res, next) => validateRequest(req, res, next)
]

export const validateAssignUserToGroup = [
  param('groupId')
    .isMongoId()
    .withMessage('Group ID must be a valid MongoDB ObjectId'),

  check('userId')
    .exists()
    .withMessage('User ID is required')
    .isMongoId()
    .withMessage('User ID must be a valid MongoDB ObjectId'),

  (req, res, next) => validateRequest(req, res, next)
]

export const validateRemoveUserFromGroup = [
  param('groupId')
    .isMongoId()
    .withMessage('Group ID must be a valid MongoDB ObjectId'),

  param('userId')
    .isMongoId()
    .withMessage('User ID must be a valid MongoDB ObjectId'),

  (req, res, next) => validateRequest(req, res, next)
]

export const validateUpdateGroupPermissions = [
  param('groupId')
    .isMongoId()
    .withMessage('Group ID must be a valid MongoDB ObjectId'),

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

export const validateGetGroupMembers = [
  param('groupId')
    .isMongoId()
    .withMessage('Group ID must be a valid MongoDB ObjectId'),

  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),

  query('limit')
    .optional()
    .isInt({ min: 1, max: 50 })
    .withMessage('Limit must be between 1 and 50'),

  (req, res, next) => validateRequest(req, res, next)
]

export const validateGroupAction = [
  param('groupId')
    .isMongoId()
    .withMessage('Group ID must be a valid MongoDB ObjectId'),

  (req, res, next) => validateRequest(req, res, next)
]

export const validateDeleteUserGroup = [
  param('groupId')
    .isMongoId()
    .withMessage('Group ID must be a valid MongoDB ObjectId'),

  (req, res, next) => validateRequest(req, res, next)
]