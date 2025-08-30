import express from 'express'
import trimRequest from 'trim-request'
import * as categoryController from '../controllers/category.controller.js'
import * as categoryValidator from '../validators/category.validator.js'
import { requireAuth } from '../middlewares/auth.middleware.js'
import multer from 'multer'

const upload = multer({
    dest: 'uploads',
})

const router = express.Router()

router.use(requireAuth)
router.use(trimRequest.all)

router.post(
    '/',
    upload.array('files', 1),
    categoryValidator.validateCreateCategory,
    categoryController.createCategoryController
)

router.get(
    '/',
    categoryValidator.validateGetCategories,
    categoryController.getAllCategoriesController
)

router.get(
    '/tree',
    categoryValidator.validateGetCategoryTree,
    categoryController.getCategoryTreeController
)

router.get(
    '/:categoryId',
    categoryValidator.validateGetCategoryById,
    categoryController.getCategoryByIdController
)

router.put(
    '/:categoryId',
    upload.array('files' , 1) ,
    categoryValidator.validateUpdateCategory,
    categoryController.updateCategoryController
)

router.patch(
    '/:categoryId/deactivate',
    categoryValidator.validateCategoryAction,
    categoryController.deactivateCategoryController
)

router.patch(
    '/:categoryId/activate',
    categoryValidator.validateCategoryAction,
    categoryController.activateCategoryController
)


export default router