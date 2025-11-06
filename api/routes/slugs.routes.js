import express from 'express'
import trimRequest from 'trim-request'
import { requireAuth as authMiddleware } from '../middlewares/auth.middleware.js'

import * as slugController from '../controllers/slugs.controller.js'
import * as slugValidator from '../validators/slugs.validator.js'

const router = express.Router()

router.use(trimRequest.all)

router.get(
  '/blogs',
  authMiddleware,
  slugValidator.getBlogsSlugsValidator,
  slugController.getBlogsSlugs
)

router.get(
  '/products',
  authMiddleware,
  slugValidator.getProductsSlugsValidator,
  slugController.getProductsSlugs
)

router.get(
  '/services',
  authMiddleware,
  slugValidator.getServicesSlugsValidator,
  slugController.getServicesSlugs
)

router.get(
  '/categories',
  authMiddleware,
  slugValidator.getCategoriesSlugsValidator,
  slugController.getCategoriesSlugs
)

export default router
