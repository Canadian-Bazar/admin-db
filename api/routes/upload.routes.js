import express from 'express'
import multer from 'multer'
import trimRequest from 'trim-request'

import * as uploadController from '../controllers/upload.controller.js'
import { requireAuth } from '../middlewares/auth.middleware.js'
import { checkPermission } from '../middlewares/permission.middleware.js'
import * as uploadValidator from '../validators/upload.validator.js'

const router = express.Router()

router.use(trimRequest.all)

const upload = multer({
  dest: 'upload/', 
})

router.post(
  '/',
  upload.array('files', 10),
  requireAuth,
  checkPermission('uploads', 'create'),
  uploadValidator.uploadvalidator,
  uploadController.uploadController
)

export default router
