import express from 'express'
import * as quotationsControllers from '../controllers/website-quotation.controller.js'
import * as quotationsValidators from '../validators/website-quotations.validator.js'
import trimRequest from 'trim-request'
import { requireAuth } from '../middlewares/auth.middleware.js'
import { checkPermission } from '../middlewares/permission.middleware.js'

const router = express.Router()

router.use(requireAuth)
router.use(trimRequest.all)

router.get(
  '/', 
  checkPermission('website-quotations', 'view'),
  quotationsValidators.validateGetWebsiteQuotations , 
  quotationsControllers.getAllWebsiteQuotationsController
)
router.put(
  '/:websiteQuotationId/accept',
  checkPermission('website-quotations', 'edit'),
  quotationsValidators.validateAcceptQuotationStatus,
  quotationsControllers.acceptWebsiteQuotationController
   
)
router.put(
  '/:quotationId/reject', 
  checkPermission('website-quotations', 'edit'),
  quotationsValidators.validateRejectQuotationStatus , 
  quotationsControllers.rejectWebsiteQuotationController
)

export default router