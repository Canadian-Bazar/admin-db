import express from 'express'
import trimRequest from 'trim-request'
import * as serviceController from '../controllers/service.controller.js'
import * as serviceValidator from '../validators/service.validator.js'
import { requireAuth } from '../middlewares/auth.middleware.js'
import { checkPermission } from '../middlewares/permission.middleware.js'
import { PERMISSIONS, ACTIONS } from '../../config/permissions.js'
import multer from 'multer'

const upload = multer({
    dest: 'uploads',
})

const router = express.Router()

router.use(requireAuth)
router.use(trimRequest.all)

// Create service
router.post(
    '/',
    checkPermission(PERMISSIONS.SERVICE, ACTIONS.CREATE),
    upload.array('files', 10),
    serviceValidator.validateCreateService,
    serviceController.createServiceController
)

// Get all services with filters and pagination
router.get(
    '/',
    checkPermission(PERMISSIONS.SERVICE),
    serviceValidator.validateGetServices,
    serviceController.getAllServicesController
)

// Search services
router.get(
    '/search',
    checkPermission(PERMISSIONS.SERVICE),
    serviceValidator.validateSearchServices,
    serviceController.searchServicesController
)

// Get detailed service info
router.get(
    '/:serviceId/info',
    checkPermission(PERMISSIONS.SERVICE),
    serviceValidator.validateGetServiceInfo,
    serviceController.getServiceInfoController
)

// Toggle service status (active/inactive)
router.patch(
    '/:serviceId/status',
    checkPermission(PERMISSIONS.SERVICE, ACTIONS.EDIT),
    serviceValidator.validateToggleServiceStatus,
    serviceController.toggleServiceStatusController
)

export default router
