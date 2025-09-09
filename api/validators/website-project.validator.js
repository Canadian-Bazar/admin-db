import { check, query, param } from 'express-validator'
import { validatePaginateValidator } from './paginate.validator.js'
import validateRequest from '../utils/validateRequest.js'

export const validateGetWebsiteProjects = [
    ...validatePaginateValidator,

    query('status')
        .optional()
        .isString()
        .withMessage('Status must be a string')
        .isIn(['pending', 'in_progress', 'completed', 'cancelled' , 'payment_completed'])
        .withMessage('Status must be one of: pending, in_progress, completed, cancelled'),



    query('sortBy')
        .optional()
        .isString()
        .withMessage('Sort field must be a string')
        .isIn(['createdAt', 'updatedAt', 'projectStartDate', 'expectedCompletionDate'])
        .withMessage('Sort field must be one of: createdAt, updatedAt, projectStartDate, expectedCompletionDate'),

    query('sortOrder')
        .optional()
        .isString()
        .withMessage('Sort order must be a string')
        .isIn(['asc', 'desc'])
        .withMessage('Sort order must be either asc or desc'),

    (req, res, next) => validateRequest(req, res, next)
]

export const validateProjectId = [
    param('projectId')
        .exists()
        .withMessage('Project ID is required')
        .isMongoId()
        .withMessage('Project ID must be a valid MongoDB ObjectId'),

    (req, res, next) => validateRequest(req, res, next)
]

export const validateUpdateProject = [
    param('projectId')
        .exists()
        .withMessage('Project ID is required')
        .isMongoId()
        .withMessage('Project ID must be a valid MongoDB ObjectId'),

    check('projectStatus')
        .optional()
        .isString()
        .withMessage('Project status must be a string')
        .isIn(['initiated', 'documentation_created', 'plan_selected', 'payment_completed', 'in_progress', 'completed', 'cancelled'])
        .withMessage('Project status must be one of: initiated, documentation_created, plan_selected, payment_completed, in_progress, completed, cancelled'),

    check('projectStartDate')
        .optional()
        .isISO8601()
        .withMessage('Project start date must be a valid ISO8601 date'),

    check('expectedCompletionDate')
        .optional()
        .isISO8601()
        .withMessage('Expected completion date must be a valid ISO8601 date'),

    check('actualCompletionDate')
        .optional()
        .isISO8601()
        .withMessage('Actual completion date must be a valid ISO8601 date'),

    check('percentageCompletion')
        .optional()
        .isInt({ min: 0, max: 100 })
        .withMessage('Percentage completion must be an integer between 0 and 100'),

    check('report')
        .optional()
        .isString()
        .withMessage('Report must be a string')
        .isLength({ max: 5000 })
        .withMessage('Report cannot exceed 5000 characters'),

    check('report2')
        .optional()
        .isString()
        .withMessage('Report2 must be a string')
        .isLength({ max: 5000 })
        .withMessage('Report2 cannot exceed 5000 characters'),





    check('websiteOverviewLink')
        .optional()
        .isURL()
        .withMessage('Website overview link must be a valid URL'),

    check('notes')
        .optional()
        .isString()
        .withMessage('Notes must be a string')
        .isLength({ max: 2000 })
        .withMessage('Notes cannot exceed 2000 characters'),

    check('amountPaid')
        .optional()
        .isNumeric()
        .withMessage('Amount paid must be a number')
        .custom((value) => {
            if (Number(value) < 0) {
                throw new Error('Amount paid must be a positive number');
            }
            return true;
        }),

    check('amountPending')
        .optional()
        .isNumeric()
        .withMessage('Amount pending must be a number')
        .custom((value) => {
            if (Number(value) < 0) {
                throw new Error('Amount pending must be a positive number');
            }
            return true;
        }),

    (req, res, next) => validateRequest(req, res, next)
]

export const validateUpdateProjectStatus = [
    param('projectId')
        .exists()
        .withMessage('Project ID is required')
        .isMongoId()
        .withMessage('Project ID must be a valid MongoDB ObjectId'),

    check('status')
        .exists()
        .withMessage('Status is required')
        .isString()
        .withMessage('Status must be a string')
        .isIn(['pending', 'in_progress', 'completed', 'cancelled'])
        .withMessage('Status must be one of: pending, in_progress, completed, cancelled'),

    check('notes')
        .optional()
        .isString()
        .withMessage('Notes must be a string')
        .isLength({ max: 1000 })
        .withMessage('Notes cannot exceed 1000 characters'),

    (req, res, next) => validateRequest(req, res, next)
]

export const validateUpdateProjectProgress = [
    param('projectId')
        .exists()
        .withMessage('Project ID is required')
        .isMongoId()
        .withMessage('Project ID must be a valid MongoDB ObjectId'),

    check('percentageCompletion')
        .exists()
        .withMessage('Percentage completion is required')
        .isInt({ min: 0, max: 100 })
        .withMessage('Percentage completion must be an integer between 0 and 100'),

    check('report')
        .optional()
        .isString()
        .withMessage('Report must be a string')
        .isLength({ max: 5000 })
        .withMessage('Report cannot exceed 5000 characters'),

    check('report2')
        .optional()
        .isString()
        .withMessage('Report2 must be a string')
        .isLength({ max: 5000 })
        .withMessage('Report2 cannot exceed 5000 characters'),

    check('websiteOverviewLink')
        .optional()
        .isURL()
        .withMessage('Website overview link must be a valid URL'),

    (req, res, next) => validateRequest(req, res, next)
]

export const validateCreateProjectFromDocumentation = [
    check('documentationId')
        .exists()
        .withMessage('Documentation ID is required')
        .isMongoId()
        .withMessage('Documentation ID must be a valid MongoDB ObjectId'),

    check('selectedPlan')
        .exists()
        .withMessage('Selected plan is required')
        .isObject()
        .withMessage('Selected plan must be an object'),

    check('selectedPlan.planName')
        .exists()
        .withMessage('Plan name is required')
        .isString()
        .withMessage('Plan name must be a string')
        .isLength({ min: 2, max: 100 })
        .withMessage('Plan name must be between 2 and 100 characters'),

    check('selectedPlan.totalPrice')
        .exists()
        .withMessage('Total price is required')
        .isNumeric()
        .withMessage('Total price must be a number')
        .custom((value) => {
            if (Number(value) < 0) {
                throw new Error('Total price must be a positive number');
            }
            return true;
        }),

    check('expectedCompletionDate')
        .optional()
        .isISO8601()
        .withMessage('Expected completion date must be a valid ISO8601 date'),

    check('notes')
        .optional()
        .isString()
        .withMessage('Notes must be a string')
        .isLength({ max: 1000 })
        .withMessage('Notes cannot exceed 1000 characters'),

    (req, res, next) => validateRequest(req, res, next)
]

export const validateCompleteProjectAndGeneratePayment = [
    param('projectId')
        .exists()
        .withMessage('Project ID is required')
        .isMongoId()
        .withMessage('Project ID must be a valid MongoDB ObjectId'),

    check('completionReport')
        .optional()
        .isString()
        .withMessage('Completion report must be a string')
        .isLength({ max: 5000 })
        .withMessage('Completion report cannot exceed 5000 characters'),

    check('websiteOverviewLink')
        .optional()
        .isURL()
        .withMessage('Website overview link must be a valid URL'),

    (req, res, next) => validateRequest(req, res, next)
]



export const validateGetProjectById=[
    param('id')

    .exists()
    .withMessage('Project ID is required')
    .notEmpty()
    .withMessage('Project ID cannot be empty')
    .isMongoId()
    .withMessage('Project ID must be a valid MongoDB ObjectId'),

    (req, res, next) => validateRequest(req, res, next)

]