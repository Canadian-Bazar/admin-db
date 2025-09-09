import express from 'express'
import trimRequest from 'trim-request'
import * as userPermissionController from '../controllers/user-permission.controller.js'
import * as userPermissionValidator from '../validators/user-permission.validator.js'
import { requireAuth } from '../middlewares/auth.middleware.js'
import { checkPermission } from '../middlewares/permission.middleware.js'

const router = express.Router()

router.use(requireAuth)
router.use(trimRequest.all)

// Assign permission to user
router.post(
  '/assign',
  checkPermission('user-permissions', 'create'),
  userPermissionValidator.validateAssignPermissionToUser,
  userPermissionController.assignPermissionToUserController
)

// Update user permission
router.put(
  '/update',
  checkPermission('user-permissions', 'edit'),
  userPermissionValidator.validateUpdateUserPermission,
  userPermissionController.updateUserPermissionController
)

// Remove permission from user
router.delete(
  '/remove',
  checkPermission('user-permissions', 'delete'),
  userPermissionValidator.validateRemovePermissionFromUser,
  userPermissionController.removePermissionFromUserController
)

// Get user permissions (individual + group combined)
router.get(
  '/user/:userId',
  checkPermission('user-permissions'),
  userPermissionValidator.validateGetUserPermissions,
  userPermissionController.getUserPermissionsController
)

// Bulk assign permissions to user
router.post(
  '/bulk-assign',
  checkPermission('user-permissions', 'create'),
  userPermissionValidator.validateBulkAssignPermissions,
  userPermissionController.bulkAssignPermissionsController
)

export default router