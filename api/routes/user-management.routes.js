import express from 'express'
import trimRequest from 'trim-request'
import * as userManagementController from '../controllers/user-management.controller.js'
import * as userManagementValidator from '../validators/user-management.validator.js'
import { requireAuth } from '../middlewares/auth.middleware.js'
import { checkPermission } from '../middlewares/permission.middleware.js'

const router = express.Router()

router.use(requireAuth)
router.use(trimRequest.all)

// Create user with permissions
router.post(
  '/',
  checkPermission('users', 'create'),
  userManagementValidator.validateCreateUserWithPermissions,
  userManagementController.createUserWithPermissionsController
)

// Get all users
router.get(
  '/',
  checkPermission('users'),
  userManagementValidator.validateGetUsers,
  userManagementController.getUsersController
)

// Get user by ID
router.get(
  '/:userId',
  checkPermission('users'),
  userManagementValidator.validateGetUserById,
  userManagementController.getUserByIdController
)

// Update user
router.put(
  '/:userId',
  checkPermission('users', 'edit'),
  userManagementValidator.validateUpdateUser,
  userManagementController.updateUserController
)

// Change user password
router.patch(
  '/:userId/password',
  checkPermission('users', 'edit'),
  userManagementValidator.validateChangeUserPassword,
  userManagementController.changeUserPasswordController
)

// Delete user
router.delete(
  '/:userId',
  checkPermission('users', 'delete'),
  userManagementValidator.validateDeleteUser,
  userManagementController.deleteUserController
)

export default router