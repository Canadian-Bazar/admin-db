import { check, query, param } from 'express-validator'
import validateRequest from '../utils/validateRequest.js'

export const validateCreatePermission = [
  check('name')
    .exists()
    .withMessage('Permission name is required')
    .notEmpty()
    .withMessage('Permission name cannot be empty')
    .isString()
    .withMessage('Permission name must be a string')
    .isLength({ min: 2, max: 50 })
    .withMessage('Permission name must be between 2 and 50 characters')
    .matches(/^[a-zA-Z0-9_-]+$/)
    .withMessage('Permission name can only contain letters, numbers, underscores and hyphens'),

  check('route')
    .exists()
    .withMessage('Route is required')
    .notEmpty()
    .withMessage('Route cannot be empty')
    .isString()
    .withMessage('Route must be a string')
    .isLength({ min: 1, max: 200 })
    .withMessage('Route must be between 1 and 200 characters'),

  check('description')
    .optional()
    .isString()
    .withMessage('Description must be a string')
    .isLength({ max: 500 })
    .withMessage('Description cannot exceed 500 characters'),

  check('module')
    .exists()
    .withMessage('Module is required')
    .notEmpty()
    .withMessage('Module cannot be empty')
    .isString()
    .withMessage('Module must be a string')
    .isLength({ min: 2, max: 50 })
    .withMessage('Module name must be between 2 and 50 characters')
    .matches(/^[a-zA-Z0-9_-]+$/)
    .withMessage('Module name can only contain letters, numbers, underscores and hyphens'),

  (req, res, next) => validateRequest(req, res, next)
]

export const validateUpdatePermission = [
  param('permissionId')
    .isMongoId()
    .withMessage('Permission ID must be a valid MongoDB ObjectId'),

  check('name')
    .optional()
    .notEmpty()
    .withMessage('Permission name cannot be empty')
    .isString()
    .withMessage('Permission name must be a string')
    .isLength({ min: 2, max: 50 })
    .withMessage('Permission name must be between 2 and 50 characters')
    .matches(/^[a-zA-Z0-9_-]+$/)
    .withMessage('Permission name can only contain letters, numbers, underscores and hyphens'),

  check('route')
    .optional()
    .notEmpty()
    .withMessage('Route cannot be empty')
    .isString()
    .withMessage('Route must be a string')
    .isLength({ min: 1, max: 200 })
    .withMessage('Route must be between 1 and 200 characters'),

  check('description')
    .optional()
    .isString()
    .withMessage('Description must be a string')
    .isLength({ max: 500 })
    .withMessage('Description cannot exceed 500 characters'),

  check('module')
    .optional()
    .notEmpty()
    .withMessage('Module cannot be empty')
    .isString()
    .withMessage('Module must be a string')
    .isLength({ min: 2, max: 50 })
    .withMessage('Module name must be between 2 and 50 characters')
    .matches(/^[a-zA-Z0-9_-]+$/)
    .withMessage('Module name can only contain letters, numbers, underscores and hyphens'),

  check('isActive')
    .optional()
    .isBoolean()
    .withMessage('isActive must be a boolean'),

  (req, res, next) => validateRequest(req, res, next)
]

export const validateGetPermissions = [
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

  query('module')
    .optional()
    .isString()
    .withMessage('Module must be a string')
    .isLength({ min: 1, max: 50 })
    .withMessage('Module must be between 1 and 50 characters'),

  query('isActive')
    .optional()
    .isBoolean()
    .withMessage('isActive must be a boolean'),

  (req, res, next) => validateRequest(req, res, next)
]

export const validateGetPermissionById = [
  param('permissionId')
    .isMongoId()
    .withMessage('Permission ID must be a valid MongoDB ObjectId'),

  (req, res, next) => validateRequest(req, res, next)
]

export const validatePermissionAction = [
  param('permissionId')
    .isMongoId()
    .withMessage('Permission ID must be a valid MongoDB ObjectId'),

  (req, res, next) => validateRequest(req, res, next)
]