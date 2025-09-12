import express from 'express'
import trimRequest from 'trim-request'
import * as websiteDocumentationController from '../controllers/website-documentation.controller.js'
import * as websiteDocumentationValidator from '../validators/website-documentation.validator.js'
import { requireAuth } from '../middlewares/auth.middleware.js'
import { checkPermission } from '../middlewares/permission.middleware.js'

const router = express.Router()

router.use(requireAuth)
router.use(trimRequest.all)

// Get all website documentation
router.get(
  '/', 
  checkPermission('website-documentation', 'view'),
  websiteDocumentationValidator.validateGetWebsiteDocumentation, 
  websiteDocumentationController.getAllWebsiteDocumentationController
)

// Get website documentation by ID
router.get(
  '/:id', 
  checkPermission('website-documentation', 'view'),
  websiteDocumentationValidator.validateGetDocumentationById, 
  websiteDocumentationController.getWebsiteDocumentationByIdController
)

// Update website documentation
router.put(
  '/:id', 
  checkPermission('website-documentation', 'edit'),
  websiteDocumentationValidator.validateUpdateDocumentation, 
  websiteDocumentationController.updateWebsiteDocumentationController
)

export default router 