import { check } from 'express-validator'
import validateRequest from '../utils/validateRequest.js'

export const validateUpsert = [
  check('backgroundImage').optional().isString().trim(),
  check('title').optional().isString().trim(),
  check('subtitle').optional().isString().trim(),
  check('mainHeadingBuy').optional().isString().trim(),
  check('mainHeadingCanadian').optional().isString().trim(),
  check('subHeadingPart1').optional().isString().trim(),
  check('subHeadingPart2').optional().isString().trim(),
  check('isActive').optional().isBoolean(),
  check('order').optional().isInt(),
  (req, res, next) => validateRequest(req, res, next)
]


