import express from 'express'
import trimRequest from 'trim-request'
import { requireAuth } from '../middlewares/auth.middleware.js'
import { checkPermission } from '../middlewares/permission.middleware.js'
import { PERMISSIONS, ACTIONS } from '../../config/permissions.js'
import { getHomeSettingsController, upsertHomeSettingsController, listHomeSettingsController, createHomeSettingController, updateHomeSettingByIdController, deleteHomeSettingByIdController } from '../controllers/home-settings.controller.js'
import { validateUpsert } from '../validators/home-settings.validator.js'
import multer from 'multer'

const router = express.Router()

router.use(requireAuth)
router.use(trimRequest.all)

// Align with blog image upload: accept file field 'backgroundImage'
const upload = multer({ dest: 'uploads' })

router.get('/', checkPermission(PERMISSIONS.LANDING_FEATURES, ACTIONS.READ), getHomeSettingsController)
router.get('/list', checkPermission(PERMISSIONS.LANDING_FEATURES, ACTIONS.READ), listHomeSettingsController)
router.post('/', checkPermission(PERMISSIONS.LANDING_FEATURES, ACTIONS.EDIT), upload.array('backgroundImage', 1), validateUpsert, createHomeSettingController)
router.put('/', checkPermission(PERMISSIONS.LANDING_FEATURES, ACTIONS.EDIT), upload.array('backgroundImage', 1), validateUpsert, upsertHomeSettingsController)
router.put('/:id', checkPermission(PERMISSIONS.LANDING_FEATURES, ACTIONS.EDIT), upload.array('backgroundImage', 1), validateUpsert, updateHomeSettingByIdController)
router.delete('/:id', checkPermission(PERMISSIONS.LANDING_FEATURES, ACTIONS.DELETE), deleteHomeSettingByIdController)

export default router


