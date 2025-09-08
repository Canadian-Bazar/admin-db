import express from 'express'
import * as quotationsControllers from '../controllers/website-quotation.controller.js'
import * as quotationsValidators from '../validators/website-quotations.validator.js'
import  trimRequest  from 'trim-request';
const router = express.Router()



router.use(trimRequest.all)


router.get(
  '/', 
  quotationsValidators.validateGetWebsiteQuotations , 
  quotationsControllers.getAllWebsiteQuotationsController
)
router.put(
  '/:quotationId/accept',
  quotationsValidators.validateAcceptQuotationStatus,
  quotationsControllers.acceptWebsiteQuotationController
   
)
router.put(
  '/:quotationId/reject', 
  quotationsValidators.validateRejectQuotationStatus , 
quotationsControllers.rejectWebsiteQuotationController)

export default router