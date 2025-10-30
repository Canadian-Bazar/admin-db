import express from 'express'
import trimRequest from 'trim-request'
import {
  getGlobalParagraphController,
  setGlobalParagraphController,
  listGlobalParagraphsController,
  updateGlobalParagraphByIdController,
  deleteGlobalParagraphByIdController,
} from '../controllers/global-paragraph.controller.js'
import { requireAuth } from '../middlewares/auth.middleware.js'
import { checkPermission } from '../middlewares/permission.middleware.js'

const router = express.Router()
router.use(trimRequest.all)

// Public route - no authentication needed (for buyer frontend)
router.get('/', getGlobalParagraphController)

// Protected admin routes
router.post(
  '/',
  requireAuth,
  checkPermission('manage-global-paragraph', 'create'),
  setGlobalParagraphController
)

router.get(
  '/list',
  requireAuth,
  checkPermission('manage-global-paragraph', 'view'),
  listGlobalParagraphsController
)

router.put(
  '/:id',
  requireAuth,
  checkPermission('manage-global-paragraph', 'edit'),
  updateGlobalParagraphByIdController
)

router.delete(
  '/:id',
  requireAuth,
  checkPermission('manage-global-paragraph', 'delete'),
  deleteGlobalParagraphByIdController
)

export default router

