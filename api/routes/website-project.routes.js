import express from 'express'
import trimRequest from 'trim-request'
import * as websiteProjectController from '../controllers/website-project.controller.js'
import * as websiteProjectValidator from '../validators/website-project.validator.js'

const router = express.Router()

router.use(trimRequest.all)



router.get('/', websiteProjectValidator.validateGetWebsiteProjects, websiteProjectController.getAllWebsiteProjectsController)
router.get('/:id', websiteProjectValidator.validateGetProjectById, websiteProjectController.getProjectByIdController)

router.put('/:projectId', websiteProjectValidator.validateUpdateProject, websiteProjectController.updateWebsiteProjectController)
router.post('/:projectId/complete-and-generate-payment', websiteProjectValidator.validateCompleteProjectAndGeneratePayment, websiteProjectController.completeProjectAndGeneratePaymentLinkController)
router.post('/create-from-documentation', websiteProjectValidator.validateCreateProjectFromDocumentation, websiteProjectController.createProjectFromDocumentationController)

export default router