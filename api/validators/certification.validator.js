import { check, query, param, body } from 'express-validator'
import validateRequest from '../utils/validateRequest.js'

export const validateCreateCertification = [
    check('name')
        .exists()
        .withMessage('Certification name is required')
        .notEmpty()
        .withMessage('Certification name cannot be empty')
        .isString()
        .withMessage('Certification name must be a string')
        .isLength({ min: 2, max: 100 })
        .withMessage('Certification name must be between 2 and 100 characters')
        .trim(),

    (req, res, next) => validateRequest(req, res, next)
]

export const validateGetAllCertifications = [
    query('page')
        .optional()
        .isInt({ min: 1 })
        .withMessage('Page must be a positive integer'),

    query('limit')
        .optional()
        .isInt({ min: 1, max: 100 })
        .withMessage('Limit must be between 1 and 100'),

    query('search')
        .optional()
        .isString()
        .withMessage('Search must be a string')
        .isLength({ min: 1, max: 100 })
        .withMessage('Search term must be between 1 and 100 characters'),

    query('isActive')
        .optional()
        .isIn(['true', 'false', true, false])
        .withMessage('isActive must be true or false'),

    query('includeDeleted')
        .optional()
        .isIn(['true', 'false', true, false])
        .withMessage('includeDeleted must be true or false'),

    query('sortBy')
        .optional()
        .isIn(['createdAt', 'updatedAt', 'name', 'isActive'])
        .withMessage('sortBy must be one of: createdAt, updatedAt, name, isActive'),

    query('sortOrder')
        .optional()
        .isIn(['asc', 'desc'])
        .withMessage('sortOrder must be either asc or desc'),

    (req, res, next) => validateRequest(req, res, next)
]

export const validateGetCertificationById = [
    param('certificationId')
        .exists()
        .withMessage('Certification ID is required')
        .isMongoId()
        .withMessage('Certification ID must be a valid MongoDB ObjectId'),

    (req, res, next) => validateRequest(req, res, next)
]

export const validateUpdateCertification = [
    param('certificationId')
        .exists()
        .withMessage('Certification ID is required')
        .isMongoId()
        .withMessage('Certification ID must be a valid MongoDB ObjectId'),

    check('name')
        .exists()
        .withMessage('Certification name is required')
        .notEmpty()
        .withMessage('Certification name cannot be empty')
        .isString()
        .withMessage('Certification name must be a string')
        .isLength({ min: 2, max: 100 })
        .withMessage('Certification name must be between 2 and 100 characters')
        .trim(),

    (req, res, next) => validateRequest(req, res, next)
]

export const validateCertificationAction = [
    param('certificationId')
        .exists()
        .withMessage('Certification ID is required')
        .isMongoId()
        .withMessage('Certification ID must be a valid MongoDB ObjectId'),

    (req, res, next) => validateRequest(req, res, next)
]

export const validateBulkCertificationOperation = [
    body('certificationIds')
        .exists()
        .withMessage('Certification IDs are required')
        .isArray({ min: 1 })
        .withMessage('Certification IDs must be a non-empty array'),

    body('certificationIds.*')
        .isMongoId()
        .withMessage('Each certification ID must be a valid MongoDB ObjectId'),

    body('operation')
        .exists()
        .withMessage('Operation is required')
        .isIn(['activate', 'deactivate', 'delete'])
        .withMessage('Operation must be one of: activate, deactivate, delete'),

    (req, res, next) => validateRequest(req, res, next)
]