import { query, param } from 'express-validator'
import validateRequest from '../utils/validateRequest.js'

export const validateGetCNCQuotes = [
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
        .withMessage('Search must be between 1 and 100 characters'),

    query('name')
        .optional()
        .isString()
        .withMessage('Name must be a string')
        .isLength({ min: 1, max: 100 })
        .withMessage('Name must be between 1 and 100 characters'),

    query('email')
        .optional()
        .isString()
        .withMessage('Email must be a string'),

    query('city')
        .optional()
        .isString()
        .withMessage('City must be a string')
        .isLength({ min: 1, max: 100 })
        .withMessage('City must be between 1 and 100 characters'),

    query('workType')
        .optional()
        .isString()
        .withMessage('Work type must be a string')
        .isLength({ min: 1, max: 100 })
        .withMessage('Work type must be between 1 and 100 characters'),

    query('budget')
        .optional()
        .isString()
        .withMessage('Budget must be a string'),

    query('timeline')
        .optional()
        .isString()
        .withMessage('Timeline must be a string'),

    query('sortBy')
        .optional()
        .isIn(['name', 'contact', 'city', 'workType', 'budget', 'timeline', 'createdAt', 'updatedAt'])
        .withMessage('sortBy must be one of: name, contact, city, workType, budget, timeline, createdAt, updatedAt'),

    query('sortOrder')
        .optional()
        .isIn(['asc', 'desc'])
        .withMessage('sortOrder must be either asc or desc'),

    (req, res, next) => validateRequest(req, res, next)
]

export const validateGetCNCQuoteById = [
    param('quoteId')
        .exists()
        .withMessage('Quote ID is required')
        .isMongoId()
        .withMessage('Quote ID must be a valid MongoDB ObjectId'),

    (req, res, next) => validateRequest(req, res, next)
]