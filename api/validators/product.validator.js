import { check, query, param } from 'express-validator'
import validateRequest from '../utils/validateRequest.js'

export const validateCreateProduct = [
    check('name')
        .exists()
        .withMessage('Product name is required')
        .notEmpty()
        .withMessage('Product name cannot be empty')
        .isString()
        .withMessage('Product name must be a string')
        .isLength({ min: 2, max: 100 })
        .withMessage('Product name must be between 2 and 100 characters'),

    check('description')
        .optional()
        .isString()
        .withMessage('Description must be a string')
        .isLength({ max: 2000 })
        .withMessage('Description cannot exceed 2000 characters'),

    check('shortDescription')
        .optional()
        .isString()
        .withMessage('Short description must be a string')
        .isLength({ max: 200 })
        .withMessage('Short description cannot exceed 200 characters'),

    check('price')
        .optional()
        .isNumeric()
        .withMessage('Price must be a number')
        .isFloat({ min: 0 })
        .withMessage('Price must be greater than or equal to 0'),

    check('originalPrice')
        .optional()
        .isNumeric()
        .withMessage('Original price must be a number')
        .isFloat({ min: 0 })
        .withMessage('Original price must be greater than or equal to 0'),

    check('category')
        .optional()
        .isMongoId()
        .withMessage('Category must be a valid MongoDB ObjectId'),

    check('categoryName')
        .optional()
        .isString()
        .withMessage('Category name must be a string')
        .isLength({ min: 2, max: 100 })
        .withMessage('Category name must be between 2 and 100 characters'),

    check('subcategory')
        .optional()
        .isMongoId()
        .withMessage('Subcategory must be a valid MongoDB ObjectId'),

    check('subcategoryName')
        .optional()
        .isString()
        .withMessage('Subcategory name must be a string')
        .isLength({ min: 2, max: 100 })
        .withMessage('Subcategory name must be between 2 and 100 characters'),

    check('sku')
        .optional()
        .isString()
        .withMessage('SKU must be a string')
        .isLength({ min: 3, max: 50 })
        .withMessage('SKU must be between 3 and 50 characters'),

    check('stock')
        .optional()
        .isInt({ min: 0 })
        .withMessage('Stock must be a non-negative integer'),

    check('weight')
        .optional()
        .isNumeric()
        .withMessage('Weight must be a number')
        .isFloat({ min: 0 })
        .withMessage('Weight must be greater than or equal to 0'),

    check('dimensions.length')
        .optional()
        .isNumeric()
        .withMessage('Length must be a number')
        .isFloat({ min: 0 })
        .withMessage('Length must be greater than or equal to 0'),

    check('dimensions.width')
        .optional()
        .isNumeric()
        .withMessage('Width must be a number')
        .isFloat({ min: 0 })
        .withMessage('Width must be greater than or equal to 0'),

    check('dimensions.height')
        .optional()
        .isNumeric()
        .withMessage('Height must be a number')
        .isFloat({ min: 0 })
        .withMessage('Height must be greater than or equal to 0'),

    check('tags')
        .optional()
        .isArray()
        .withMessage('Tags must be an array'),

    check('tags.*')
        .optional()
        .isString()
        .withMessage('Each tag must be a string')
        .isLength({ min: 1, max: 50 })
        .withMessage('Each tag must be between 1 and 50 characters'),

    check('features')
        .optional()
        .isArray()
        .withMessage('Features must be an array'),

    check('features.*')
        .optional()
        .isString()
        .withMessage('Each feature must be a string')
        .isLength({ min: 1, max: 200 })
        .withMessage('Each feature must be between 1 and 200 characters'),

    check('specifications')
        .optional()
        .isArray()
        .withMessage('Specifications must be an array'),

    check('specifications.*.name')
        .optional()
        .isString()
        .withMessage('Specification name must be a string')
        .isLength({ min: 1, max: 100 })
        .withMessage('Specification name must be between 1 and 100 characters'),

    check('specifications.*.value')
        .optional()
        .isString()
        .withMessage('Specification value must be a string')
        .isLength({ min: 1, max: 200 })
        .withMessage('Specification value must be between 1 and 200 characters'),

    check('isFeatured')
        .optional()
        .isBoolean()
        .withMessage('isFeatured must be a boolean'),

    check('seller')
        .optional()
        .isMongoId()
        .withMessage('Seller must be a valid MongoDB ObjectId'),

    check('seoTitle')
        .optional()
        .isString()
        .withMessage('SEO title must be a string')
        .isLength({ max: 60 })
        .withMessage('SEO title cannot exceed 60 characters'),

    check('seoDescription')
        .optional()
        .isString()
        .withMessage('SEO description must be a string')
        .isLength({ max: 160 })
        .withMessage('SEO description cannot exceed 160 characters'),

    check('seoKeywords')
        .optional()
        .isArray()
        .withMessage('SEO keywords must be an array'),

    check('seoKeywords.*')
        .optional()
        .isString()
        .withMessage('Each SEO keyword must be a string'),

    check('city')
        .optional()
        .isString()
        .withMessage('City must be a string')
        .isLength({ min: 2, max: 100 })
        .withMessage('City must be between 2 and 100 characters'),

    check('status')
        .optional()
        .isIn(['draft', 'published', 'archived'])
        .withMessage('Status must be draft, published, or archived'),

    (req, res, next) => validateRequest(req, res, next)
]

export const validateGetProducts = [
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
        .withMessage('Search must be a string'),

    query('isActive')
        .optional()
        .isIn(['true', 'false', true, false])
        .withMessage('isActive must be true or false'),

    query('isFeatured')
        .optional()
        .isIn(['true', 'false', true, false])
        .withMessage('isFeatured must be true or false'),

    query('isInStock')
        .optional()
        .isIn(['true', 'false', true, false])
        .withMessage('isInStock must be true or false'),

    query('category')
        .optional()
        .custom((value) => {
            if (value === 'all') {
                return true
            }
            if (!value.match(/^[0-9a-fA-F]{24}$/)) {
                throw new Error('Category must be a valid MongoDB ObjectId or "all"')
            }
            return true
        }),

    query('subcategory')
        .optional()
        .custom((value) => {
            if (value === 'all') {
                return true
            }
            if (!value.match(/^[0-9a-fA-F]{24}$/)) {
                throw new Error('Subcategory must be a valid MongoDB ObjectId or "all"')
            }
            return true
        }),

    query('minPrice')
        .optional()
        .isNumeric()
        .withMessage('minPrice must be a number')
        .isFloat({ min: 0 })
        .withMessage('minPrice must be greater than or equal to 0'),

    query('maxPrice')
        .optional()
        .isNumeric()
        .withMessage('maxPrice must be a number')
        .isFloat({ min: 0 })
        .withMessage('maxPrice must be greater than or equal to 0'),

    query('city')
        .optional()
        .isString()
        .withMessage('City must be a string')
        .isLength({ min: 1, max: 100 })
        .withMessage('City must be between 1 and 100 characters'),

    query('sortBy')
        .optional()
        .isIn(['name', 'price', 'rating', 'createdAt'])
        .withMessage('sortBy must be name, price, rating, or createdAt'),

    query('sortOrder')
        .optional()
        .isIn(['asc', 'desc'])
        .withMessage('sortOrder must be asc or desc'),

    (req, res, next) => validateRequest(req, res, next)
]

export const validateToggleProductStatus = [
    param('productId')
        .exists()
        .withMessage('Product ID is required')
        .isMongoId()
        .withMessage('Product ID must be a valid MongoDB ObjectId'),

    check('isActive')
        .exists()
        .withMessage('isActive status is required')
        .isBoolean()
        .withMessage('isActive must be a boolean value'),

    (req, res, next) => validateRequest(req, res, next)
]

export const validateGetProductInfo = [
    param('productId')
        .exists()
        .withMessage('Product ID is required')
        .isMongoId()
        .withMessage('Product ID must be a valid MongoDB ObjectId'),

    (req, res, next) => validateRequest(req, res, next)
]

export const validateSearchProducts = [
    query('q')
        .exists()
        .withMessage('Search query is required')
        .isString()
        .withMessage('Search query must be a string')
        .isLength({ min: 1, max: 100 })
        .withMessage('Search query must be between 1 and 100 characters'),

    query('category')
        .optional()
        .isMongoId()
        .withMessage('Category must be a valid MongoDB ObjectId'),

    query('minPrice')
        .optional()
        .isNumeric()
        .withMessage('minPrice must be a number')
        .isFloat({ min: 0 })
        .withMessage('minPrice must be greater than or equal to 0'),

    query('maxPrice')
        .optional()
        .isNumeric()
        .withMessage('maxPrice must be a number')
        .isFloat({ min: 0 })
        .withMessage('maxPrice must be greater than or equal to 0'),

    query('limit')
        .optional()
        .isInt({ min: 1, max: 50 })
        .withMessage('Limit must be between 1 and 50'),

    (req, res, next) => validateRequest(req, res, next)
]
