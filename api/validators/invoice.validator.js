import { query, param } from 'express-validator'
import validateRequest from '../utils/validateRequest.js'

export const validateGetInvoices = [
  query('page').optional().isInt({ min: 1 }).toInt(),
  query('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
  query('status').optional().isIn(['pending', 'accepted', 'rejected', 'expired']),
  (req, res, next) => validateRequest(req, res, next),
]

export const validateGetInvoiceById = [
  param('invoiceId').isMongoId(),
  (req, res, next) => validateRequest(req, res, next),
]


