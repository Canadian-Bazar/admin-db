import express from 'express'
import trimRequest from 'trim-request'
import * as versionController from '../controllers/subscription-versions.controller.js'
import * as versionValidator from '../validators/subscription-version.validator.js'
import { requireAuth } from '../middlewares/auth.middleware.js'

const router = express.Router()

router.use(requireAuth)
router.use(trimRequest.all)

// Create subscription plan version
router.post(
  '/',
  versionValidator.validateCreateVersion,
  versionController.createVersionController
)

// Get all subscription plan versions with pagination and filtering
router.get(
  '/',
  versionValidator.validateGetVersions,
  versionController.getAllVersionsController
)

// Get subscription plan version by ID
router.get(
  '/:versionId',
  versionValidator.validateGetVersionById,
  versionController.getVersionByIdController
)

// Update subscription plan version
router.put(
  '/:versionId',
  versionValidator.validateUpdateVersion,
  versionController.updateVersionController
)

// Deprecate subscription plan version (soft delete)
router.patch(
  '/:versionId/deprecate',
  versionValidator.validateVersionAction,
  versionController.deprecateVersionController
)

// Activate subscription plan version (undeprecate)
router.patch(
  '/:versionId/activate',
  versionValidator.validateVersionAction,
  versionController.activateVersionController
)

// Set version as current
router.patch(
  '/:versionId/set-current',
  versionValidator.validateVersionAction,
  versionController.setCurrentVersionController
)

// Get all versions for a specific template
router.get(
  '/template/:templateId',
  versionValidator.validateGetVersionsByTemplate,
  versionController.getVersionsByTemplateController
)

export default router