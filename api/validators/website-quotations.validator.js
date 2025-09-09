import {check , query , param} from 'express-validator'
import { validatePaginateValidator } from './paginate.validator.js'
import validateRequest from '../utils/validateRequest.js'



export const validateGetWebsiteQuotations =[

    ...validatePaginateValidator ,

    query('status')
     .optional()
     .isString()
     .withMessage('Status must be a string') ,



     (req , res  , next) => validateRequest(req , res, next)
]




export const validateAcceptQuotationStatus = [
    check('documentation')
       .exists()
       .notEmpty()
       .withMessage('Documentation is required')
       .isString()
       .withMessage('Documentation must be a string') ,

    param('websiteQuotationId')
        .exists({ checkFalsy: true })
        .withMessage('Website quotation ID is required')
        .isMongoId()
        .withMessage('Website quotation ID must be a valid MongoDB ObjectId'),

    check('pricingPlans')
        .exists({ checkFalsy: true })
        .withMessage('Pricing plans are required')
        .custom((value) => {
            if (!value) return false;
            
            try {
                const parsed = typeof value === 'string' ? JSON.parse(value) : value;
                if (!Array.isArray(parsed) || parsed.length === 0) {
                    throw new Error('Pricing plans must be a non-empty array');
                }
                return true;
            } catch (e) {
                throw new Error('Pricing plans must be valid JSON array');
            }
        }),

    check('pricingPlans')
        .customSanitizer((value) => {
            if (!value) return undefined;
            try {
                return typeof value === 'string' ? JSON.parse(value) : value;
            } catch (e) {
                return undefined;
            }
        }),

    check('pricingPlans.*.planName')
        .exists({ checkFalsy: true })
        .withMessage('Plan name is required')
        .isString()
        .withMessage('Plan name must be a string')
        .trim()
        .isLength({ min: 1, max: 100 })
        .withMessage('Plan name must be between 1 and 100 characters'),
check('pricingPlans.*.subscriptionPlanVersionId')
  .optional({ nullable: true }) 
  .isMongoId()
  .withMessage('Subscription plan version ID must be a valid MongoDB ObjectId'),


    check('pricingPlans.*.sitePrice')
        .exists({ checkFalsy: true })
        .withMessage('Site price is required')
        .isNumeric()
        .withMessage('Site price must be a number')
        .custom(value => {
            if (value < 0) {
                throw new Error('Site price cannot be negative');
            }
            return true;
        }),

    check('pricingPlans')
        .custom((pricingPlans) => {
            if (!pricingPlans || pricingPlans.length === 0) return true;

            const planNames = pricingPlans.map(plan => plan.planName?.trim().toLowerCase()).filter(Boolean);

            console.log("planNames" , planNames)
            const uniquePlanNames = [...new Set(planNames)];
            console.log(uniquePlanNames)

            
            if (planNames.length !== uniquePlanNames.length) {
                throw new Error('Duplicate plan names are not allowed');
            }

            return true;
        }),

    (req, res, next) => validateRequest(req, res, next)
];





export const validateRejectQuotationStatus = [

        param('quotationId')
            .exists()
            .withMessage('Quotation ID is required')
            .notEmpty()
            .withMessage('Quotation ID cannot be empty')
            .isMongoId()
            .withMessage('Invalid Mongo ID') ,


       check('rejectionReason')
            .exists()
            .withMessage('Rejection reason is required')
            .notEmpty()
            .withMessage('Rejection reason cannot be empty')
            .isString()
            .withMessage('Rejection reason must be a string') ,






   


    


    (req , res, next) => validateRequest(req , res, next)]
