import express from 'express'
import trimRequest from 'trim-request'
import * as permissionController from '../controllers/permission.controller.js'
import * as permissionValidator from '../validators/permission.validator.js'
import { requireAuth } from '../middlewares/auth.middleware.js'
import { checkPermission } from '../middlewares/permission.middleware.js'

const router = express.Router()

router.use(requireAuth)
router.use(trimRequest.all)

// Create permission
router.post(
  '/',
  checkPermission('permissions', 'create'),
  permissionValidator.validateCreatePermission,
  permissionController.createPermissionController
)

// Get all permissions
router.get(
  '/',
  checkPermission('permissions'),
  permissionValidator.validateGetPermissions,
  permissionController.getAllPermissionsController
)

// Get permission by ID
router.get(
  '/:permissionId',
  checkPermission('permissions'),
  permissionValidator.validateGetPermissionById,
  permissionController.getPermissionByIdController
)

// Update permission
router.put(
  '/:permissionId',
  checkPermission('permissions', 'edit'),
  permissionValidator.validateUpdatePermission,
  permissionController.updatePermissionController
)

// Activate permission
router.patch(
  '/:permissionId/activate',
  checkPermission('permissions', 'edit'),
  permissionValidator.validatePermissionAction,
  permissionController.activatePermissionController
)

// Deactivate permission
router.patch(
  '/:permissionId/deactivate',
  checkPermission('permissions', 'edit'),
  permissionValidator.validatePermissionAction,
  permissionController.deactivatePermissionController
)

// Delete permission
router.delete(
  '/:permissionId',
  checkPermission('permissions', 'delete'),
  permissionValidator.validatePermissionAction,
  permissionController.deletePermissionController
)

export default router