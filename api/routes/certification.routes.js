import express from 'express'
import trimRequest from 'trim-request'
import * as certificationController from '../controllers/certification.controller.js'
import * as certificationValidator from '../validators/certification.validator.js'
import { requireAuth } from '../middlewares/auth.middleware.js'
import { checkPermission } from '../middlewares/permission.middleware.js'

const router = express.Router()

router.use(requireAuth)
router.use(trimRequest.all)

// Get certification statistics
router.get(
    '/stats',
    checkPermission('certifications', 'view'),
    certificationController.getCertificationStatsController
)

// Get all certifications with filters and pagination
router.get(
    '/',
    checkPermission('certifications', 'view'),
    certificationValidator.validateGetAllCertifications,
    certificationController.getAllCertificationsController
)

// Create a new certification
router.post(
    '/',
    checkPermission('certifications', 'create'),
    certificationValidator.validateCreateCertification,
    certificationController.createCertificationController
)

// Bulk operations on certifications
router.patch(
    '/bulk',
    checkPermission('certifications', 'edit'),
    certificationValidator.validateBulkCertificationOperation,
    certificationController.bulkCertificationOperationController
)

// Get certification by ID
router.get(
    '/:certificationId',
    checkPermission('certifications', 'view'),
    certificationValidator.validateGetCertificationById,
    certificationController.getCertificationByIdController
)

// Update certification
router.put(
    '/:certificationId',
    checkPermission('certifications', 'edit'),
    certificationValidator.validateUpdateCertification,
    certificationController.updateCertificationController
)

// Soft delete certification
router.delete(
    '/:certificationId',
    checkPermission('certifications', 'delete'),
    certificationValidator.validateCertificationAction,
    certificationController.deleteCertificationController
)

// Restore deleted certification
router.patch(
    '/:certificationId/restore',
    checkPermission('certifications', 'edit'),
    certificationValidator.validateCertificationAction,
    certificationController.restoreCertificationController
)

// Activate certification
router.patch(
    '/:certificationId/activate',
    checkPermission('certifications', 'edit'),
    certificationValidator.validateCertificationAction,
    certificationController.activateCertificationController
)

// Deactivate certification
router.patch(
    '/:certificationId/deactivate',
    checkPermission('certifications', 'edit'),
    certificationValidator.validateCertificationAction,
    certificationController.deactivateCertificationController
)

export default router