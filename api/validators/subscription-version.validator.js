import { check, query, param } from 'express-validator'
import validateRequest from '../utils/validateRequest.js'

export const validateCreateVersion = [
    check('templateId')
        .exists()
        .withMessage('Template ID is required')
        .isMongoId()
        .withMessage('Template ID must be a valid MongoDB ObjectId'),

    check('versionNumber')
        .exists()
        .withMessage('Version number is required')
        .isInt({ min: 1 })
        .withMessage('Version number must be a positive integer'),

    check('pricing.monthly')
        .optional()
        .isNumeric({ min: 0 })
        .withMessage('Monthly pricing must be a positive number'),

    check('pricing.quarterly')
        .optional()
        .isNumeric({ min: 0 })
        .withMessage('Quarterly pricing must be a positive number'),

    check('pricing.yearly')
        .optional()
        .isNumeric({ min: 0 })
        .withMessage('Yearly pricing must be a positive number'),

    check('discountPercentage')
        .optional()
        .isNumeric({ min: 0, max: 100 })
        .withMessage('Discount percentage must be between 0 and 100'),

    check('features.productListingPerMonth')
        .optional()
        .isInt({ min: -1 })
        .withMessage('Product listing per month must be -1 (unlimited) or positive integer'),

    check('features.serviceListingPerMonth')
        .optional()
        .isInt({ min: -1 })
        .withMessage('Service listing per month must be -1 (unlimited) or positive integer'),

    check('features.videoPerProduct')
        .optional()
        .isInt({ min: -1 })
        .withMessage('Video per product must be -1 (unlimited) or positive integer'),

    check('features.featuredListingDaysPerMonth')
        .optional()
        .isInt({ min: 0 })
        .withMessage('Featured listing days per month must be a positive integer'),

    check('features.incomingInquiryLimit')
        .optional()
        .isInt({ min: -1 })
        .withMessage('Incoming inquiry limit must be -1 (unlimited) or positive integer'),

    check('features.unlimitedSearch')
        .optional()
        .isBoolean()
        .withMessage('Unlimited search must be a boolean'),

    check('features.dashboardAnalytics')
        .optional()
        .isBoolean()
        .withMessage('Dashboard analytics must be a boolean'),

    check('features.securePayment')
        .optional()
        .isBoolean()
        .withMessage('Secure payment must be a boolean'),

    check('features.newsLetterAndIndustryInsights')
        .optional()
        .isBoolean()
        .withMessage('Newsletter and industry insights must be a boolean'),

    check('features.essentialSEOSupport')
        .optional()
        .isBoolean()
        .withMessage('Essential SEO support must be a boolean'),

    check('features.verifiedBadge')
        .optional()
        .isBoolean()
        .withMessage('Verified badge must be a boolean'),

    check('features.prioritySupport')
        .optional()
        .isBoolean()
        .withMessage('Priority support must be a boolean'),

    check('features.accessToRFQ')
        .optional()
        .isBoolean()
        .withMessage('Access to RFQ must be a boolean'),

    check('isCurrent')
        .optional()
        .isBoolean()
        .withMessage('Is current must be a boolean'),

    check('effectiveDate')
        .optional()
        .isISO8601()
        .withMessage('Effective date must be a valid date'),

    (req, res, next) => validateRequest(req, res, next)
]

export const validateGetVersions = [
    query('page')
        .optional()
        .isInt({ min: 1 })
        .withMessage('Page must be a positive integer'),

    query('limit')
        .optional()
        .isInt({ min: 1, max: 50 })
        .withMessage('Limit must be between 1 and 50'),

    query('templateId')
        .optional()
        .isMongoId()
        .withMessage('Template ID must be a valid MongoDB ObjectId'),

    query('isCurrent')
        .optional()
        .isIn(['true', 'false', true, false])
        .withMessage('isCurrent must be true or false'),

    query('isDeprecated')
        .optional()
        .isIn(['true', 'false', true, false])
        .withMessage('isDeprecated must be true or false'),

    (req, res, next) => validateRequest(req, res, next)
]

export const validateGetVersionById = [
    param('versionId')
        .exists()
        .withMessage('Version ID is required')
        .isMongoId()
        .withMessage('Version ID must be a valid MongoDB ObjectId'),

    (req, res, next) => validateRequest(req, res, next)
]

export const validateUpdateVersion = [
    param('versionId')
        .exists()
        .withMessage('Version ID is required')
        .isMongoId()
        .withMessage('Version ID must be a valid MongoDB ObjectId'),

    check('pricing.monthly')
        .optional()
        .isNumeric({ min: 0 })
        .withMessage('Monthly pricing must be a positive number'),

    check('pricing.quarterly')
        .optional()
        .isNumeric({ min: 0 })
        .withMessage('Quarterly pricing must be a positive number'),

    check('pricing.yearly')
        .optional()
        .isNumeric({ min: 0 })
        .withMessage('Yearly pricing must be a positive number'),

    check('discountPercentage')
        .optional()
        .isNumeric({ min: 0, max: 100 })
        .withMessage('Discount percentage must be between 0 and 100'),

    check('features.productListingPerMonth')
        .optional()
        .isInt({ min: -1 })
        .withMessage('Product listing per month must be -1 (unlimited) or positive integer'),

    check('features.serviceListingPerMonth')
        .optional()
        .isInt({ min: -1 })
        .withMessage('Service listing per month must be -1 (unlimited) or positive integer'),

    check('features.videoPerProduct')
        .optional()
        .isInt({ min: -1 })
        .withMessage('Video per product must be -1 (unlimited) or positive integer'),

    check('features.featuredListingDaysPerMonth')
        .optional()
        .isInt({ min: 0 })
        .withMessage('Featured listing days per month must be a positive integer'),

    check('features.incomingInquiryLimit')
        .optional()
        .isInt({ min: -1 })
        .withMessage('Incoming inquiry limit must be -1 (unlimited) or positive integer'),

    check('features.unlimitedSearch')
        .optional()
        .isBoolean()
        .withMessage('Unlimited search must be a boolean'),

    check('features.dashboardAnalytics')
        .optional()
        .isBoolean()
        .withMessage('Dashboard analytics must be a boolean'),

    check('features.securePayment')
        .optional()
        .isBoolean()
        .withMessage('Secure payment must be a boolean'),

    check('features.newsLetterAndIndustryInsights')
        .optional()
        .isBoolean()
        .withMessage('Newsletter and industry insights must be a boolean'),

    check('features.essentialSEOSupport')
        .optional()
        .isBoolean()
        .withMessage('Essential SEO support must be a boolean'),

    check('features.verifiedBadge')
        .optional()
        .isBoolean()
        .withMessage('Verified badge must be a boolean'),

    check('features.prioritySupport')
        .optional()
        .isBoolean()
        .withMessage('Priority support must be a boolean'),

    check('features.accessToRFQ')
        .optional()
        .isBoolean()
        .withMessage('Access to RFQ must be a boolean'),

    check('isCurrent')
        .optional()
        .isBoolean()
        .withMessage('Is current must be a boolean'),

    check('effectiveDate')
        .optional()
        .isISO8601()
        .withMessage('Effective date must be a valid date'),

    (req, res, next) => validateRequest(req, res, next)
]

export const validateVersionAction = [
    param('versionId')
        .exists()
        .withMessage('Version ID is required')
        .isMongoId()
        .withMessage('Version ID must be a valid MongoDB ObjectId'),

    (req, res, next) => validateRequest(req, res, next)
]

export const validateGetVersionsByTemplate = [
    param('templateId')
        .exists()
        .withMessage('Template ID is required')
        .isMongoId()
        .withMessage('Template ID must be a valid MongoDB ObjectId'),

    query('page')
        .optional()
        .isInt({ min: 1 })
        .withMessage('Page must be a positive integer'),

    query('limit')
        .optional()
        .isInt({ min: 1, max: 50 })
        .withMessage('Limit must be between 1 and 50'),

    query('isCurrent')
        .optional()
        .isIn(['true', 'false', true, false])
        .withMessage('isCurrent must be true or false'),

    query('isDeprecated')
        .optional()
        .isIn(['true', 'false', true, false])
        .withMessage('isDeprecated must be true or false'),

    (req, res, next) => validateRequest(req, res, next)
]