import { check } from 'express-validator'
import validateRequest from '../utils/validateRequest.js'

export const validateCreate = [
  check('title').isString().trim().notEmpty(),
  check('description').isString().trim().notEmpty(),
  check('icon').optional().isString().trim().notEmpty(),
  check('order').optional().isInt({ min: 0 }),
  check('isActive').optional().isBoolean(),
  (req, res, next) => validateRequest(req, res, next)
]

export const validateList = [
  check('page').optional().isInt({ min: 1 }),
  check('limit').optional().isInt({ min: 1, max: 50 }),
  check('search').optional().isString(),
  (req, res, next) => validateRequest(req, res, next)
]

export const validateById = [
  check('id').isMongoId(),
  (req, res, next) => validateRequest(req, res, next)
]

export const validateUpdate = [
  check('id').isMongoId(),
  check('title').optional().isString().trim().notEmpty(),
  check('description').optional().isString().trim().notEmpty(),
  check('icon').optional().isString().trim().notEmpty(),
  check('order').optional().isInt({ min: 0 }),
  check('isActive').optional().isBoolean(),
  (req, res, next) => validateRequest(req, res, next)
]

export const validateDelete = [
  check('id').isMongoId(),
  (req, res, next) => validateRequest(req, res, next)
]


