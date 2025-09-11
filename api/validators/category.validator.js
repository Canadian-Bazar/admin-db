import { check, query, param } from 'express-validator'
import validateRequest from '../utils/validateRequest.js'

export const validateCreateCategory = [
    check('name')
        .exists()
        .withMessage('Category name is required')
        .notEmpty()
        .withMessage('Category name cannot be empty')
        .isString()
        .withMessage('Category name must be a string')
        .isLength({ min: 2, max: 100 })
        .withMessage('Category name must be between 2 and 100 characters'),

    check('description')
        .optional()
        .isString()
        .withMessage('Description must be a string')
        .isLength({ max: 500 })
        .withMessage('Description cannot exceed 500 characters'),

    check('parentCategory')
        .optional()
        .isMongoId()
        .withMessage('Parent category must be a valid MongoDB ObjectId'),

    check('city')
        .optional()
        .isString()
        .withMessage('City must be a string')
        .isLength({ min: 2, max: 100 })
        .withMessage('City must be between 2 and 100 characters'),

    (req, res, next) => validateRequest(req, res, next)
]

export const validateGetCategories = [
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
        ,

    query('isActive')
        .optional()
        .isIn(['true', 'false', true, false])
        .withMessage('isActive must be true or false'),

    query('parentCategory')
        .optional()
        .custom((value) => {
            if (value === 'null' || value === 'all') {
                return true;
            }
            if (!value.match(/^[0-9a-fA-F]{24}$/)) {
                throw new Error('Parent category must be a valid MongoDB ObjectId, "null", or "all"');
            }
            return true;
        }),

    query('city')
        .optional()
        .isString()
        .withMessage('City must be a string')
        .isLength({ min: 1, max: 100 })
        .withMessage('City must be between 1 and 100 characters'),

    (req, res, next) => validateRequest(req, res, next)
]

export const validateGetCategoryById = [
    param('categoryId')
        .exists()
        .withMessage('Category ID is required')
        .isMongoId()
        .withMessage('Category ID must be a valid MongoDB ObjectId'),

    (req, res, next) => validateRequest(req, res, next)
]

export const validateUpdateCategory = [
    param('categoryId')
        .exists()
        .withMessage('Category ID is required')
        .isMongoId()
        .withMessage('Category ID must be a valid MongoDB ObjectId'),

    check('name')
        .optional()
        .isString()
        .withMessage('Category name must be a string')
        .isLength({ min: 2, max: 100 })
        .withMessage('Category name must be between 2 and 100 characters'),

    check('description')
        .optional()
        .isString()
        .withMessage('Description must be a string')
        .isLength({ max: 500 })
        .withMessage('Description cannot exceed 500 characters'),

    check('parentCategory')
        .optional()
        .custom((value) => {
            if (value === null) {
                return true;
            }
            if (!value.match(/^[0-9a-fA-F]{24}$/)) {
                throw new Error('Parent category must be a valid MongoDB ObjectId or null');
            }
            return true;
        }),

    check('image')
        .optional()
        .isString()
        .withMessage('Image must be a string'),

    check('city')
        .optional()
        .isString()
        .withMessage('City must be a string')
        .isLength({ min: 2, max: 100 })
        .withMessage('City must be between 2 and 100 characters'),

    (req, res, next) => validateRequest(req, res, next)
]

export const validateCategoryAction = [
    param('categoryId')
        .exists()
        .withMessage('Category ID is required')
        .isMongoId()
        .withMessage('Category ID must be a valid MongoDB ObjectId'),

    (req, res, next) => validateRequest(req, res, next)
]

export const validateGetCategoryTree = [
    query('includeInactive')
        .optional()
        .isIn(['true', 'false', true, false])
        .withMessage('includeInactive must be true or false'),

    (req, res, next) => validateRequest(req, res, next)
]