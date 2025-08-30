import express from 'express'
import trimRequest from 'trim-request'
import * as certificationController from '../controllers/certification.controller.js'
import * as certificationValidator from '../validators/certification.validator.js'
import { requireAuth } from '../middlewares/auth.middleware.js'

const router = express.Router()

router.use(requireAuth)
router.use(trimRequest.all)

// Get certification statistics
router.get(
    '/stats',
    certificationController.getCertificationStatsController
)

// Get all certifications with filters and pagination
router.get(
    '/',
    certificationValidator.validateGetAllCertifications,
    certificationController.getAllCertificationsController
)

// Create a new certification
router.post(
    '/',
    certificationValidator.validateCreateCertification,
    certificationController.createCertificationController
)

// Bulk operations on certifications
router.patch(
    '/bulk',
    certificationValidator.validateBulkCertificationOperation,
    certificationController.bulkCertificationOperationController
)

// Get certification by ID
router.get(
    '/:certificationId',
    certificationValidator.validateGetCertificationById,
    certificationController.getCertificationByIdController
)

// Update certification
router.put(
    '/:certificationId',
    certificationValidator.validateUpdateCertification,
    certificationController.updateCertificationController
)

// Soft delete certification
router.delete(
    '/:certificationId',
    certificationValidator.validateCertificationAction,
    certificationController.deleteCertificationController
)

// Restore deleted certification
router.patch(
    '/:certificationId/restore',
    certificationValidator.validateCertificationAction,
    certificationController.restoreCertificationController
)

// Activate certification
router.patch(
    '/:certificationId/activate',
    certificationValidator.validateCertificationAction,
    certificationController.activateCertificationController
)

// Deactivate certification
router.patch(
    '/:certificationId/deactivate',
    certificationValidator.validateCertificationAction,
    certificationController.deactivateCertificationController
)

export default router