import { check, query, param } from 'express-validator'
import validateRequest from '../utils/validateRequest.js'

export const validateGetAllSellers = [
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

    query('email')
        .optional()
        .isString()
        .withMessage('Email filter must be a string')
        .isLength({ min: 1, max: 100 })
        .withMessage('Email filter must be between 1 and 100 characters'),

    query('phoneNumber')
        .optional()
        .isString()
        .withMessage('Phone number filter must be a string')
        .isLength({ min: 1, max: 20 })
        .withMessage('Phone number filter must be between 1 and 20 characters'),

    query('businessNumber')
        .optional()
        .isString()
        .withMessage('Business number filter must be a string')
        .isLength({ min: 1, max: 50 })
        .withMessage('Business number filter must be between 1 and 50 characters'),

    query('isVerified')
        .optional()
        .isIn(['true', 'false', true, false])
        .withMessage('isVerified must be true or false'),

    query('isBlocked')
        .optional()
        .isIn(['true', 'false', true, false])
        .withMessage('isBlocked must be true or false'),

    query('approvalStatus')
        .optional()
        .isIn(['all', 'pending', 'submitted', 'approved', 'rejected'])
        .withMessage('approvalStatus must be one of: all, pending, submitted, approved, rejected'),

    query('city')
        .optional()
        .isString()
        .withMessage('City filter must be a string')
        .isLength({ min: 1, max: 50 })
        .withMessage('City filter must be between 1 and 50 characters'),

    query('state')
        .optional()
        .isString()
        .withMessage('State filter must be a string')
        .isLength({ min: 1, max: 50 })
        .withMessage('State filter must be between 1 and 50 characters'),

    query('sortBy')
        .optional()
        .isIn(['createdAt', 'updatedAt', 'companyName', 'email', 'approvalStatus', 'isVerified', 'isBlocked'])
        .withMessage('sortBy must be one of: createdAt, updatedAt, companyName, email, approvalStatus, isVerified, isBlocked'),

    query('sortOrder')
        .optional()
        .isIn(['asc', 'desc'])
        .withMessage('sortOrder must be either asc or desc'),

    (req, res, next) => validateRequest(req, res, next)
]

export const validateGetSellerById = [
    param('sellerId')
        .exists()
        .withMessage('Seller ID is required')
        .isMongoId()
        .withMessage('Seller ID must be a valid MongoDB ObjectId'),

    (req, res, next) => validateRequest(req, res, next)
]

export const validateBlockSeller = [
    param('sellerId')
        .exists()
        .withMessage('Seller ID is required')
        .isMongoId()
        .withMessage('Seller ID must be a valid MongoDB ObjectId'),

    check('blockReason')
        .exists()
        .withMessage('Block reason is required')
        .notEmpty()
        .withMessage('Block reason cannot be empty')
        .isString()
        .withMessage('Block reason must be a string')
        .isLength({ min: 10, max: 500 })
        .withMessage('Block reason must be between 10 and 500 characters'),

    (req, res, next) => validateRequest(req, res, next)
]

export const validateUnblockSeller = [
    param('sellerId')
        .exists()
        .withMessage('Seller ID is required')
        .isMongoId()
        .withMessage('Seller ID must be a valid MongoDB ObjectId'),

    (req, res, next) => validateRequest(req, res, next)
]

export const validateApproveSeller = [
    param('sellerId')
        .exists()
        .withMessage('Seller ID is required')
        .isMongoId()
        .withMessage('Seller ID must be a valid MongoDB ObjectId'),

    (req, res, next) => validateRequest(req, res, next)
]

export const validateRejectSeller = [
    param('sellerId')
        .exists()
        .withMessage('Seller ID is required')
        .isMongoId()
        .withMessage('Seller ID must be a valid MongoDB ObjectId'),

    check('rejectionReason')
        .exists()
        .withMessage('Rejection reason is required')
        .notEmpty()
        .withMessage('Rejection reason cannot be empty')
        .isString()
        .withMessage('Rejection reason must be a string')
        .isLength({ min: 10, max: 500 })
        .withMessage('Rejection reason must be between 10 and 500 characters'),

    (req, res, next) => validateRequest(req, res, next)
]

export const validateGetSellersByStatus = [
    param('status')
        .exists()
        .withMessage('Status is required')
        .isIn(['pending', 'submitted', 'approved', 'rejected'])
        .withMessage('Status must be one of: pending, submitted, approved, rejected'),

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

    query('sortBy')
        .optional()
        .isIn(['createdAt', 'updatedAt', 'companyName', 'email'])
        .withMessage('sortBy must be one of: createdAt, updatedAt, companyName, email'),

    query('sortOrder')
        .optional()
        .isIn(['asc', 'desc'])
        .withMessage('sortOrder must be either asc or desc'),

    (req, res, next) => validateRequest(req, res, next)
]