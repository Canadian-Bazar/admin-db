import express from 'express'
import trimRequest from 'trim-request'
import * as templateController from '../controllers/subscription-templates.controller.js'
import * as templateValidator from '../validators/subscription-template.validator.js'
import { requireAuth } from '../middlewares/auth.middleware.js'

const router = express.Router()

router.use(requireAuth)
router.use(trimRequest.all)

// Create subscription plan template
router.post(
  '/',
  templateValidator.validateCreateTemplate,
  templateController.createTemplateController
)

// Get all subscription plan templates with pagination and filtering
router.get(
  '/',
  templateValidator.validateGetTemplates,
  templateController.getAllTemplatesController
)

// Get all active subscription plan templates with current versions (for pricing)
router.get(
  '/active',
  templateController.getAllActiveSubscriptionTemplatesController
)

// Get subscription plan template by ID
router.get(
  '/:templateId',
  templateValidator.validateGetTemplateById,
  templateController.getTemplateByIdController
)

// Update subscription plan template
router.put(
  '/:templateId',
  templateValidator.validateUpdateTemplate,
  templateController.updateTemplateController
)

// Deactivate subscription plan template (soft delete)
router.patch(
  '/:templateId/deactivate',
  templateValidator.validateTemplateAction,
  templateController.deactivateTemplateController
)

// Activate subscription plan template
router.patch(
  '/:templateId/activate',
  templateValidator.validateTemplateAction,
  templateController.activateTemplateController
)

export default router