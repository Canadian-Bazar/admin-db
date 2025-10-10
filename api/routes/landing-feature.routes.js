import express from 'express'
import trimRequest from 'trim-request'
import { requireAuth } from '../middlewares/auth.middleware.js'
import { checkPermission } from '../middlewares/permission.middleware.js'
import { PERMISSIONS, ACTIONS } from '../../config/permissions.js'
import * as controller from '../controllers/landing-feature.controller.js'
import * as validator from '../validators/landing-feature.validator.js'

const router = express.Router()

router.use(requireAuth)
router.use(trimRequest.all)

router.post('/', checkPermission(PERMISSIONS.LANDING_FEATURES, ACTIONS.CREATE), validator.validateCreate, controller.createLandingFeatureController)
router.get('/', checkPermission(PERMISSIONS.LANDING_FEATURES, ACTIONS.READ), validator.validateList, controller.getLandingFeaturesController)
router.get('/:id', checkPermission(PERMISSIONS.LANDING_FEATURES, ACTIONS.READ), validator.validateById, controller.getLandingFeatureByIdController)
router.put('/:id', checkPermission(PERMISSIONS.LANDING_FEATURES, ACTIONS.EDIT), validator.validateUpdate, controller.updateLandingFeatureController)
router.delete('/:id', checkPermission(PERMISSIONS.LANDING_FEATURES, ACTIONS.DELETE), validator.validateDelete, controller.deleteLandingFeatureController)

export default router


