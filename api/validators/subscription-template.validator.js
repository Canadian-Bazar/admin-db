import { check, query, param } from 'express-validator'
import validateRequest from '../utils/validateRequest.js'

export const validateCreateTemplate = [
    check('name')
        .exists()
        .withMessage('Template name is required')
        .notEmpty()
        .withMessage('Template name cannot be empty')
        .isString()
        .withMessage('Template name must be a string')
        .isLength({ min: 2, max: 100 })
        .withMessage('Template name must be between 2 and 100 characters'),

    check('description')
        .optional()
        .isString()
        .withMessage('Description must be a string')
        .isLength({ max: 500 })
        .withMessage('Description cannot exceed 500 characters'),

    check('category')
        .optional()
        .isIn(['basic', 'premium', 'enterprise'])
        .withMessage('Category must be one of: basic, premium, enterprise'),

    check('sortOrder')
        .optional()
        .isNumeric()
        .withMessage('Sort order must be a number'),

    check('createdBy')
        .exists()
        .withMessage('Created by is required')
        .isMongoId()
        .withMessage('Created by must be a valid MongoDB ObjectId'),

    (req, res, next) => validateRequest(req, res, next)
]

export const validateGetTemplates = [
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

    query('category')
        .optional()
        .isIn(['basic', 'premium', 'enterprise'])
        .withMessage('Category must be one of: basic, premium, enterprise'),

    query('isActive')
        .optional()
        .isIn(['true', 'false', true, false])
        .withMessage('isActive must be true or false'),

    (req, res, next) => validateRequest(req, res, next)
]

export const validateGetTemplateById = [
    param('templateId')
        .exists()
        .withMessage('Template ID is required')
        .isMongoId()
        .withMessage('Template ID must be a valid MongoDB ObjectId'),

    (req, res, next) => validateRequest(req, res, next)
]

export const validateUpdateTemplate = [
    param('templateId')
        .exists()
        .withMessage('Template ID is required')
        .isMongoId()
        .withMessage('Template ID must be a valid MongoDB ObjectId'),

    check('name')
        .optional()
        .isString()
        .withMessage('Template name must be a string')
        .isLength({ min: 2, max: 100 })
        .withMessage('Template name must be between 2 and 100 characters'),

    check('description')
        .optional()
        .isString()
        .withMessage('Description must be a string')
        .isLength({ max: 500 })
        .withMessage('Description cannot exceed 500 characters'),

    check('category')
        .optional()
        .isIn(['basic', 'premium', 'enterprise'])
        .withMessage('Category must be one of: basic, premium, enterprise'),

    check('sortOrder')
        .optional()
        .isNumeric()
        .withMessage('Sort order must be a number'),

    check('lastModifiedBy')
        .optional()
        .isMongoId()
        .withMessage('Last modified by must be a valid MongoDB ObjectId'),

    (req, res, next) => validateRequest(req, res, next)
]

export const validateTemplateAction = [
    param('templateId')
        .exists()
        .withMessage('Template ID is required')
        .isMongoId()
        .withMessage('Template ID must be a valid MongoDB ObjectId'),

    (req, res, next) => validateRequest(req, res, next)
]