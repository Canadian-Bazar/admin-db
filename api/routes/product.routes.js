import express from 'express'
import trimRequest from 'trim-request'
import * as productController from '../controllers/product.controller.js'
import * as productValidator from '../validators/product.validator.js'
import { requireAuth } from '../middlewares/auth.middleware.js'
import { checkPermission } from '../middlewares/permission.middleware.js'
import { PERMISSIONS, ACTIONS } from '../../config/permissions.js'
import multer from 'multer'

const upload = multer({
    dest: 'uploads',
})

const router = express.Router()

router.use(requireAuth)
router.use(trimRequest.all)

// Create product
router.post(
    '/',
    checkPermission(PERMISSIONS.PRODUCT, ACTIONS.CREATE),
    upload.array('files', 10),
    productValidator.validateCreateProduct,
    productController.createProductController
)

// Get all products with filters and pagination
router.get(
    '/',
    checkPermission(PERMISSIONS.PRODUCT),
    productValidator.validateGetProducts,
    productController.getAllProductsController
)

// Search products
router.get(
    '/search',
    checkPermission(PERMISSIONS.PRODUCT),
    productValidator.validateSearchProducts,
    productController.searchProductsController
)

// Get detailed product info
router.get(
    '/:productId/info',
    checkPermission(PERMISSIONS.PRODUCT),
    productValidator.validateGetProductInfo,
    productController.getProductInfoController
)

// Fix product categories (admin only)
router.post(
    '/fix-categories',
    checkPermission(PERMISSIONS.PRODUCT, ACTIONS.EDIT),
    productController.fixProductCategoriesController
)

// Toggle product status (active/inactive)
router.patch(
    '/:productId/status',
    checkPermission(PERMISSIONS.PRODUCT, ACTIONS.EDIT),
    productValidator.validateToggleProductStatus,
    productController.toggleProductStatusController
)

export default router
