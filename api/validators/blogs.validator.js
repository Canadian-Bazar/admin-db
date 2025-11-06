import { check, query, param } from 'express-validator'
import validateRequest from '../utils/validateRequest.js'

export const validateCreateBlog = [
    check('title')
        .exists()
        .withMessage('Blog title is required')
        .notEmpty()
        .withMessage('Blog title cannot be empty')
        .isString()
        .withMessage('Blog title must be a string')
        .isLength({ min: 2, max: 200 })
        .withMessage('Blog title must be between 2 and 200 characters'),

    check('author')
        .exists()
        .withMessage('Author is required')
        .notEmpty()
        .withMessage('Author cannot be empty')
        .isString()
        .withMessage('Author must be a string')
        .isLength({ min: 2, max: 100 })
        .withMessage('Author must be between 2 and 100 characters'),

    check('content')
        .exists()
        .withMessage('Content is required')
        .notEmpty()
        .withMessage('Content cannot be empty')
        .isString()
        .withMessage('Content must be a string'),

    check('description')
        .exists()
        .withMessage('Description is required')
        .notEmpty()
        .withMessage('Description cannot be empty')
        .isString()
        .withMessage('Description must be a string')
        .isLength({ min: 10, max: 500 })
        .withMessage('Description must be between 10 and 500 characters'),

    // Optional client-provided slug (validated if present)
    check('slug')
        .optional()
        .isString().withMessage('Slug must be a string')
        .isSlug().withMessage('Slug must be a valid slug format'),

    // Optional cover image alt text
    check('coverImageAlt')
        .optional()
        .isString().withMessage('Cover image alt must be a string')
        .isLength({ max: 200 }).withMessage('Cover image alt must be at most 200 characters'),

    (req, res, next) => validateRequest(req, res, next)
]

export const validateGetBlogs = [
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
        .withMessage('Search must be a string') ,
        
    (req, res, next) => validateRequest(req, res, next)
]

export const validateGetBlogById = [
    param('blogId')
        .exists()
        .withMessage('Blog ID is required')
        .isMongoId()
        .withMessage('Blog ID must be a valid MongoDB ObjectId'),

    (req, res, next) => validateRequest(req, res, next)
]

export const validateUpdateBlog = [
    param('blogId')
        .exists()
        .withMessage('Blog ID is required')
        .isMongoId()
        .withMessage('Blog ID must be a valid MongoDB ObjectId'),

    check('title')
        .optional()
        .isString()
        .withMessage('Blog title must be a string')
        .isLength({ min: 2, max: 200 })
        .withMessage('Blog title must be between 2 and 200 characters'),

    check('author')
        .optional()
        .isString()
        .withMessage('Author must be a string')
        .isLength({ min: 2, max: 100 })
        .withMessage('Author must be between 2 and 100 characters'),

    check('content')
        .optional()
        .isString()
        .withMessage('Content must be a string'),

    check('description')
        .optional()
        .isString()
        .withMessage('Description must be a string')
        .isLength({ min: 10, max: 500 })
        .withMessage('Description must be between 10 and 500 characters'),

    // Optional cover image alt text
    check('coverImageAlt')
        .optional()
        .isString().withMessage('Cover image alt must be a string')
        .isLength({ max: 200 }).withMessage('Cover image alt must be at most 200 characters'),

    (req, res, next) => validateRequest(req, res, next)
]

export const validateDeleteBlog = [
    param('blogId')
        .exists()
        .withMessage('Blog ID is required')
        .isMongoId()
        .withMessage('Blog ID must be a valid MongoDB ObjectId'),

    (req, res, next) => validateRequest(req, res, next)
]