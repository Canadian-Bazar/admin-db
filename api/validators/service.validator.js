import { check, query, param } from 'express-validator'
import validateRequest from '../utils/validateRequest.js'

export const validateCreateService = [
    check('name')
        .exists()
        .withMessage('Service name is required')
        .notEmpty()
        .withMessage('Service name cannot be empty')
        .isString()
        .withMessage('Service name must be a string')
        .isLength({ min: 2, max: 100 })
        .withMessage('Service name must be between 2 and 100 characters'),

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
        .exists()
        .withMessage('Price is required')
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

    check('duration.value')
        .exists()
        .withMessage('Duration value is required')
        .isInt({ min: 1 })
        .withMessage('Duration value must be a positive integer'),

    check('duration.unit')
        .exists()
        .withMessage('Duration unit is required')
        .isIn(['minutes', 'hours', 'days', 'weeks', 'months'])
        .withMessage('Duration unit must be minutes, hours, days, weeks, or months'),

    check('serviceType')
        .optional()
        .isIn(['one-time', 'recurring', 'subscription'])
        .withMessage('Service type must be one-time, recurring, or subscription'),

    check('recurringInterval')
        .optional()
        .isIn(['daily', 'weekly', 'monthly', 'yearly'])
        .withMessage('Recurring interval must be daily, weekly, monthly, or yearly'),

    check('maxBookings')
        .optional()
        .isInt({ min: 1 })
        .withMessage('Max bookings must be a positive integer'),

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

    check('requirements')
        .optional()
        .isArray()
        .withMessage('Requirements must be an array'),

    check('requirements.*')
        .optional()
        .isString()
        .withMessage('Each requirement must be a string')
        .isLength({ min: 1, max: 200 })
        .withMessage('Each requirement must be between 1 and 200 characters'),

    check('deliverables')
        .optional()
        .isArray()
        .withMessage('Deliverables must be an array'),

    check('deliverables.*')
        .optional()
        .isString()
        .withMessage('Each deliverable must be a string')
        .isLength({ min: 1, max: 200 })
        .withMessage('Each deliverable must be between 1 and 200 characters'),

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

    check('isFeatured')
        .optional()
        .isBoolean()
        .withMessage('isFeatured must be a boolean'),

    check('seller')
        .optional()
        .isMongoId()
        .withMessage('Seller must be a valid MongoDB ObjectId'),

    check('availability.monday.start')
        .optional()
        .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
        .withMessage('Monday start time must be in HH:MM format'),

    check('availability.monday.end')
        .optional()
        .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
        .withMessage('Monday end time must be in HH:MM format'),

    check('availability.tuesday.start')
        .optional()
        .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
        .withMessage('Tuesday start time must be in HH:MM format'),

    check('availability.tuesday.end')
        .optional()
        .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
        .withMessage('Tuesday end time must be in HH:MM format'),

    check('availability.wednesday.start')
        .optional()
        .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
        .withMessage('Wednesday start time must be in HH:MM format'),

    check('availability.wednesday.end')
        .optional()
        .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
        .withMessage('Wednesday end time must be in HH:MM format'),

    check('availability.thursday.start')
        .optional()
        .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
        .withMessage('Thursday start time must be in HH:MM format'),

    check('availability.thursday.end')
        .optional()
        .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
        .withMessage('Thursday end time must be in HH:MM format'),

    check('availability.friday.start')
        .optional()
        .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
        .withMessage('Friday start time must be in HH:MM format'),

    check('availability.friday.end')
        .optional()
        .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
        .withMessage('Friday end time must be in HH:MM format'),

    check('availability.saturday.start')
        .optional()
        .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
        .withMessage('Saturday start time must be in HH:MM format'),

    check('availability.saturday.end')
        .optional()
        .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
        .withMessage('Saturday end time must be in HH:MM format'),

    check('availability.sunday.start')
        .optional()
        .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
        .withMessage('Sunday start time must be in HH:MM format'),

    check('availability.sunday.end')
        .optional()
        .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
        .withMessage('Sunday end time must be in HH:MM format'),

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

export const validateGetServices = [
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

    query('isAvailable')
        .optional()
        .isIn(['true', 'false', true, false])
        .withMessage('isAvailable must be true or false'),

    query('serviceType')
        .optional()
        .isIn(['one-time', 'recurring', 'subscription'])
        .withMessage('Service type must be one-time, recurring, or subscription'),

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

export const validateToggleServiceStatus = [
    param('serviceId')
        .exists()
        .withMessage('Service ID is required')
        .isMongoId()
        .withMessage('Service ID must be a valid MongoDB ObjectId'),

    check('isActive')
        .exists()
        .withMessage('isActive status is required')
        .isBoolean()
        .withMessage('isActive must be a boolean value'),

    (req, res, next) => validateRequest(req, res, next)
]

export const validateGetServiceInfo = [
    param('serviceId')
        .exists()
        .withMessage('Service ID is required')
        .isMongoId()
        .withMessage('Service ID must be a valid MongoDB ObjectId'),

    (req, res, next) => validateRequest(req, res, next)
]

export const validateSearchServices = [
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

    query('serviceType')
        .optional()
        .isIn(['one-time', 'recurring', 'subscription'])
        .withMessage('Service type must be one-time, recurring, or subscription'),

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
