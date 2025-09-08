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




export const  validateAcceptQuotationStatus =[
    param('quotationId')
    .exists()
    .withMessage('Quotation ID is required')
    .notEmpty()
    .withMessage('Quotation ID cannot be empty')
    .isMongoId()
    .withMessage('Invalid Mongo ID') ,


   


    


    (req , res, next) => validateRequest(req , res, next)

    
    

]




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
