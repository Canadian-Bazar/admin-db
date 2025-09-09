import { check, query, param } from 'express-validator'
import validateRequest from '../utils/validateRequest.js'

export const validateCreateUserWithPermissions = [
  check('fullName')
    .exists()
    .withMessage('Full Name is required')
    .notEmpty()
    .withMessage('Full Name cannot be empty')
    .isString()
    .withMessage('Full Name must be a string')
    .isLength({ min: 2, max: 100 })
    .withMessage('Full Name must be between 2 and 100 characters'),

  check('email')
    .exists()
    .withMessage('Email is required')
    .notEmpty()
    .withMessage('Email cannot be empty')
    .isEmail()
    .withMessage('Email is invalid')
    .normalizeEmail(),

  check('password')
    .exists()
    .withMessage('Password is required')
    .isLength({ min: 8, max: 128 })
    .withMessage('Password must be between 8 and 128 characters')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .withMessage('Password must contain at least one lowercase letter, one uppercase letter, one number, and one special character'),

  check('roleId')
    .optional()
    .isMongoId()
    .withMessage('Role ID must be a valid MongoDB ObjectId'),

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

  check('groups')
    .optional()
    .isArray()
    .withMessage('Groups must be an array'),

  check('groups.*')
    .if(check('groups').exists())
    .isMongoId()
    .withMessage('Group ID must be a valid MongoDB ObjectId'),

  (req, res, next) => validateRequest(req, res, next)
]

export const validateUpdateUser = [
  param('userId')
    .isMongoId()
    .withMessage('User ID must be a valid MongoDB ObjectId'),

  check('fullName')
    .optional()
    .notEmpty()
    .withMessage('Full Name cannot be empty')
    .isString()
    .withMessage('Full Name must be a string')
    .isLength({ min: 2, max: 100 })
    .withMessage('Full Name must be between 2 and 100 characters'),

  check('email')
    .optional()
    .notEmpty()
    .withMessage('Email cannot be empty')
    .isEmail()
    .withMessage('Email is invalid')
    .normalizeEmail(),

  check('roleId')
    .optional()
    .isMongoId()
    .withMessage('Role ID must be a valid MongoDB ObjectId'),

  (req, res, next) => validateRequest(req, res, next)
]

export const validateGetUsers = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),

  query('limit')
    .optional()
    .isInt({ min: 1, max: 50 })
    .withMessage('Limit must be between 1 and 50'),

  query('search')
    .optional()
    .isString()
    .withMessage('Search must be a string')
    .isLength({ min: 1, max: 100 })
    .withMessage('Search term must be between 1 and 100 characters'),

  query('roleId')
    .optional()
    .isMongoId()
    .withMessage('Role ID must be a valid MongoDB ObjectId'),

  query('includePermissions')
    .optional()
    .isBoolean()
    .withMessage('includePermissions must be a boolean'),

  query('includeGroups')
    .optional()
    .isBoolean()
    .withMessage('includeGroups must be a boolean'),

  (req, res, next) => validateRequest(req, res, next)
]

export const validateGetUserById = [
  param('userId')
    .isMongoId()
    .withMessage('User ID must be a valid MongoDB ObjectId'),

  query('includePermissions')
    .optional()
    .isBoolean()
    .withMessage('includePermissions must be a boolean'),

  query('includeGroups')
    .optional()
    .isBoolean()
    .withMessage('includeGroups must be a boolean'),

  (req, res, next) => validateRequest(req, res, next)
]

export const validateDeleteUser = [
  param('userId')
    .isMongoId()
    .withMessage('User ID must be a valid MongoDB ObjectId'),

  (req, res, next) => validateRequest(req, res, next)
]

export const validateChangeUserPassword = [
  param('userId')
    .isMongoId()
    .withMessage('User ID must be a valid MongoDB ObjectId'),

  check('newPassword')
    .exists()
    .withMessage('New password is required')
    .isLength({ min: 8, max: 128 })
    .withMessage('Password must be between 8 and 128 characters')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .withMessage('Password must contain at least one lowercase letter, one uppercase letter, one number, and one special character'),

  (req, res, next) => validateRequest(req, res, next)
]