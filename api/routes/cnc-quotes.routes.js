import express from 'express'
import trimRequest from 'trim-request'
import * as cncQuotesController from '../controllers/cnc-quotes.controller.js'
import * as cncQuotesValidator from '../validators/cnc-quotes.validator.js'
import { requireAuth } from '../middlewares/auth.middleware.js'
import { checkPermission } from '../middlewares/permission.middleware.js'
import { PERMISSIONS } from '../../config/permissions.js'

const router = express.Router()

router.use(requireAuth)
router.use(trimRequest.all)

router.get(
    '/',
    checkPermission(PERMISSIONS.ADMIN),
    cncQuotesValidator.validateGetCNCQuotes,
    cncQuotesController.getAllCNCQuotesController
)

router.get(
    '/:quoteId',
    checkPermission(PERMISSIONS.ADMIN),
    cncQuotesValidator.validateGetCNCQuoteById,
    cncQuotesController.getCNCQuoteByIdController
)

export default router