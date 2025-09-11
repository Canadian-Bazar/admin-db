import {check , query} from 'express-validator'



export const validatePaginateValidator=[
    query('page')
    .optional()
    .isInt({min:1})
    .withMessage('Page must be a positive integer')
    .toInt(),

    query('limit')
    .optional()
    .isInt({min:1})
    .withMessage('Limit must be a positive integer') 
    .toInt() ,


  query('search')
    .optional({nullable:true})
    .isString()
    .withMessage('Search must be a string')

]