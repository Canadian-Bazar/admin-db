import express from 'express'
import trimRequest from 'trim-request'
import * as sellerController from '../controllers/seller.controller.js'
import * as sellerValidator from '../validators/seller.validator.js'
import { requireAuth } from '../middlewares/auth.middleware.js'

const router = express.Router()

router.use(requireAuth)
router.use(trimRequest.all)

// Get all sellers with filters and pagination
router.get(
    '/',
    sellerValidator.validateGetAllSellers,
    sellerController.getAllSellersController
)

// Get seller statistics
router.get(
    '/stats',
    sellerController.getSellerStatsController
)

// Get sellers by status (pending, approved, rejected)
router.get(
    '/status/:status',
    sellerValidator.validateGetSellersByStatus,
    sellerController.getSellersByStatusController
)

// Get seller by ID
router.get(
    '/:sellerId',
    sellerValidator.validateGetSellerById,
    sellerController.getSellerByIdController
)

// Block seller with reason and email notification
router.patch(
    '/:sellerId/block',
    sellerValidator.validateBlockSeller,
    sellerController.blockSellerController
)

// Unblock seller
router.patch(
    '/:sellerId/unblock',
    sellerValidator.validateUnblockSeller,
    sellerController.unblockSellerController
)

// Approve seller
router.patch(
    '/:sellerId/approve',
    sellerValidator.validateApproveSeller,
    sellerController.approveSellerController
)

// Reject seller with reason and email notification
router.patch(
    '/:sellerId/reject',
    sellerValidator.validateRejectSeller,
    sellerController.rejectSellerController
)

export default router