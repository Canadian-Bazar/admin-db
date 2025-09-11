import express from 'express'
import trimRequest from 'trim-request'
import * as userGroupController from '../controllers/user-group.controller.js'
import * as userGroupValidator from '../validators/user-group.validator.js'
import { requireAuth } from '../middlewares/auth.middleware.js'
import { checkPermission } from '../middlewares/permission.middleware.js'

const router = express.Router()

router.use(requireAuth)
router.use(trimRequest.all)

// Create user group
router.post(
  '/',
  checkPermission('user-groups', 'create'),
  userGroupValidator.validateCreateUserGroup,
  userGroupController.createUserGroupController
)

// Get all user groups
router.get(
  '/',
  checkPermission('user-groups'),
  userGroupValidator.validateGetUserGroups,
  userGroupController.getAllUserGroupsController
)

// Get user group by ID
router.get(
  '/:groupId',
  checkPermission('user-groups'),
  userGroupValidator.validateGetUserGroupById,
  userGroupController.getUserGroupByIdController
)

// Get user's group memberships
router.get(
  '/user/:userId/memberships',
  checkPermission('user-groups'),
  userGroupController.getUserGroupMembershipsController
)

// Update user group
router.put(
  '/:groupId',
  checkPermission('user-groups', 'edit'),
  userGroupValidator.validateUpdateUserGroup,
  userGroupController.updateUserGroupController
)

// Get group members
router.get(
  '/:groupId/members',
  checkPermission('user-groups'),
  userGroupValidator.validateGetGroupMembers,
  userGroupController.getGroupMembersController
)

// Assign user to group
router.post(
  '/:groupId/members',
  checkPermission('user-groups', 'edit'),
  userGroupValidator.validateAssignUserToGroup,
  userGroupController.assignUserToGroupController
)

// Remove user from group
router.delete(
  '/:groupId/members/:userId',
  checkPermission('user-groups', 'edit'),
  userGroupValidator.validateRemoveUserFromGroup,
  userGroupController.removeUserFromGroupController
)

// Update group permissions
router.put(
  '/:groupId/permissions',
  checkPermission('user-groups', 'edit'),
  userGroupValidator.validateUpdateGroupPermissions,
  userGroupController.updateGroupPermissionsController
)

// Activate user group
router.patch(
  '/:groupId/activate',
  checkPermission('user-groups', 'edit'),
  userGroupValidator.validateGroupAction,
  userGroupController.activateUserGroupController
)

// Deactivate user group
router.patch(
  '/:groupId/deactivate',
  checkPermission('user-groups', 'edit'),
  userGroupValidator.validateGroupAction,
  userGroupController.deactivateUserGroupController
)

// Delete user group
router.delete(
  '/:groupId',
  checkPermission('user-groups', 'delete'),
  userGroupValidator.validateDeleteUserGroup,
  userGroupController.deleteUserGroupController
)

export default router