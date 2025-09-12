import { body, param, query } from 'express-validator'
import { validationResult } from 'express-validator'
import buildErrorObject from '../utils/buildErrorObject.js'
import httpStatus from 'http-status'

/**
 * Validation middleware to handle validation results
 */
const handleValidationResult = (req, res, next) => {
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    return res.status(httpStatus.BAD_REQUEST).json(
      buildErrorObject(httpStatus.BAD_REQUEST, 'Validation failed', errors.array())
    )
  }
  next()
}

/**
 * Validate get all website documentation
 */
export const validateGetWebsiteDocumentation = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
  
  query('status')
    .optional()
    .isIn(['pending', 'approved', 'rejected'])
    .withMessage('Status must be pending, approved, or rejected'),
  
  query('sortBy')
    .optional()
    .isString()
    .withMessage('Sort by must be a string'),
  
  query('sortOrder')
    .optional()
    .isIn(['asc', 'desc'])
    .withMessage('Sort order must be asc or desc'),
  
  handleValidationResult
]

/**
 * Validate get documentation by ID
 */
export const validateGetDocumentationById = [
  param('id')
    .isMongoId()
    .withMessage('Invalid documentation ID'),
  
  handleValidationResult
]

/**
 * Validate update documentation
 */
export const validateUpdateDocumentation = [
  param('id')
    .isMongoId()
    .withMessage('Invalid documentation ID'),
  
  body('documentation')
    .optional()
    .isString()
    .withMessage('Documentation must be a string')
    .isLength({ min: 1, max: 10000 })
    .withMessage('Documentation must be between 1 and 10000 characters'),
  
  body('status')
    .optional()
    .isIn(['pending', 'approved', 'rejected'])
    .withMessage('Status must be pending, approved, or rejected'),
  
  body('pricingPlans')
    .optional()
    .isArray()
    .withMessage('Pricing plans must be an array'),
  
  body('pricingPlans.*.planName')
    .optional()
    .isString()
    .withMessage('Plan name must be a string')
    .isLength({ min: 1, max: 100 })
    .withMessage('Plan name must be between 1 and 100 characters'),
  
  body('pricingPlans.*.sitePrice')
    .optional()
    .isNumeric()
    .withMessage('Site price must be a number')
    .custom(value => value >= 0)
    .withMessage('Site price must be non-negative'),
  
  body('pricingPlans.*.subscriptionPrice')
    .optional()
    .isNumeric()
    .withMessage('Subscription price must be a number')
    .custom(value => value >= 0)
    .withMessage('Subscription price must be non-negative'),
  
  body('pricingPlans.*.totalPrice')
    .optional()
    .isNumeric()
    .withMessage('Total price must be a number')
    .custom(value => value >= 0)
    .withMessage('Total price must be non-negative'),
  
  handleValidationResult
] 