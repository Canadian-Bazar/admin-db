import { query } from "express-validator";
import validateRequest from "../utils/validateRequest.js";
import { validatePaginateValidator } from "./paginate.validator.js";




export const getBlogsSlugsValidator = [
    ...validatePaginateValidator,
    (req , res , next)=>validateRequest(req , res , next)
];


export const getProductsSlugsValidator = [
    ...validatePaginateValidator,
    (req , res , next)=>validateRequest(req , res , next)
];


export const getServicesSlugsValidator = [
    ...validatePaginateValidator,
    (req , res , next)=>validateRequest(req , res , next)
];


export const getCategoriesSlugsValidator = [
    query('slug')
    .optional()
    .isSlug()
    .withMessage('Invalid category ID') ,
    ...validatePaginateValidator,
    (req , res , next)=>validateRequest(req , res , next)

    
];