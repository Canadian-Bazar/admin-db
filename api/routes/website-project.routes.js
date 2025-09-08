import express from 'express'
import {
  getAllWebsiteProjectsController,
  // getSellerWebsiteProjectsController, // REMOVED: Admin-db should not have seller routes
  updateWebsiteProjectController,
  updateProjectStatusController,
  updateProjectProgressController,
  createProjectFromDocumentationController,
  completeProjectAndGeneratePaymentLinkController
} from '../controllers/website-project.controller.js'

const router = express.Router()

// REMOVED: Seller routes should be in seller-db, not admin-db
// router.get('/seller', getSellerWebsiteProjectsController)

router.get('/', getAllWebsiteProjectsController)
router.put('/:projectId', updateWebsiteProjectController)
router.patch('/:projectId/status', updateProjectStatusController)
router.patch('/:projectId/progress', updateProjectProgressController)
router.post('/:projectId/complete-and-generate-payment', completeProjectAndGeneratePaymentLinkController)
router.post('/create-from-documentation', createProjectFromDocumentationController)

export default router