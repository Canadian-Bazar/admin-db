import express from 'express'
import trimRequest from 'trim-request'
import * as categoryController from '../controllers/category.controller.js'
import * as categoryValidator from '../validators/category.validator.js'
import { requireAuth } from '../middlewares/auth.middleware.js'
import { checkPermission } from '../middlewares/permission.middleware.js'
import multer from 'multer'

const upload = multer({
    dest: 'uploads',
})

const router = express.Router()

router.use(requireAuth)
router.use(trimRequest.all)

router.post(
    '/',
    checkPermission('category', 'create'),
    upload.array('files', 1),
    categoryValidator.validateCreateCategory,
    categoryController.createCategoryController
)

router.get(
    '/',
    checkPermission('category'),
    categoryValidator.validateGetCategories,
    categoryController.getAllCategoriesController
)

router.get(
    '/tree',
    checkPermission('category'),
    categoryValidator.validateGetCategoryTree,
    categoryController.getCategoryTreeController
)

router.get(
    '/:categoryId',
    checkPermission('category'),
    categoryValidator.validateGetCategoryById,
    categoryController.getCategoryByIdController
)

router.put(
    '/:categoryId',
    checkPermission('category', 'edit'),
    upload.array('files' , 1) ,
    categoryValidator.validateUpdateCategory,
    categoryController.updateCategoryController
)

router.patch(
    '/:categoryId/deactivate',
    checkPermission('category', 'edit'),
    categoryValidator.validateCategoryAction,
    categoryController.deactivateCategoryController
)

router.patch(
    '/:categoryId/activate',
    checkPermission('category', 'edit'),
    categoryValidator.validateCategoryAction,
    categoryController.activateCategoryController
)


export default router