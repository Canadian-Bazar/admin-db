import { check } from 'express-validator'
import validateRequest from '../utils/validateRequest.js'

export const validateUpsertSeo = [
  check('metaTitle')
    .optional()
    .isString()
    .isLength({ max: 70 })
    .withMessage('metaTitle max length is 70'),

  check('metaDescription')
    .optional()
    .isString()
    .isLength({ max: 320 })
    .withMessage('metaDescription max length is 320'),

  check('metaKeywords')
    .optional()
    .isArray()
    .withMessage('metaKeywords must be an array of strings'),

  check('metaKeywords.*')
    .optional()
    .isString(),

  check('headerHtml')
    .optional()
    .isString(),

  check('isActive')
    .optional()
    .isBoolean(),

  (req, res, next) => validateRequest(req, res, next)
]

export default {
  validateUpsertSeo
}



