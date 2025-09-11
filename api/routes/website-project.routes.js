import express from 'express'
import trimRequest from 'trim-request'
import * as websiteProjectController from '../controllers/website-project.controller.js'
import * as websiteProjectValidator from '../validators/website-project.validator.js'
import { requireAuth } from '../middlewares/auth.middleware.js'
import { checkPermission } from '../middlewares/permission.middleware.js'

const router = express.Router()

router.use(requireAuth)
router.use(trimRequest.all)

router.get('/', checkPermission('website-projects', 'view'), websiteProjectValidator.validateGetWebsiteProjects, websiteProjectController.getAllWebsiteProjectsController)
router.get('/:id', checkPermission('website-projects', 'view'), websiteProjectValidator.validateGetProjectById, websiteProjectController.getProjectByIdController)

router.put('/:projectId', checkPermission('website-projects', 'edit'), websiteProjectValidator.validateUpdateProject, websiteProjectController.updateWebsiteProjectController)
router.post('/:projectId/complete-and-generate-payment', checkPermission('website-projects', 'edit'), websiteProjectValidator.validateCompleteProjectAndGeneratePayment, websiteProjectController.completeProjectAndGeneratePaymentLinkController)
router.post('/create-from-documentation', checkPermission('website-projects', 'create'), websiteProjectValidator.validateCreateProjectFromDocumentation, websiteProjectController.createProjectFromDocumentationController)

export default router