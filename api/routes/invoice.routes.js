import express from 'express'
import trimRequest from 'trim-request'
import { requireAuth } from '../middlewares/auth.middleware.js'
import { checkPermission } from '../middlewares/permission.middleware.js'
import { PERMISSIONS } from '../../config/permissions.js'
import * as invoiceController from '../controllers/invoice.controller.js'
import * as invoiceValidator from '../validators/invoice.validator.js'

const router = express.Router()

router.use(requireAuth)
router.use(trimRequest.all)

router.get(
  '/',
  checkPermission(PERMISSIONS.INVOICES),
  invoiceValidator.validateGetInvoices,
  invoiceController.getInvoicesController
)

router.get(
  '/:invoiceId',
  checkPermission(PERMISSIONS.INVOICES),
  invoiceValidator.validateGetInvoiceById,
  invoiceController.getInvoiceByIdController
)

export default router


