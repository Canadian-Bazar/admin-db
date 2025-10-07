import express from 'express'
import trimRequest from 'trim-request'
import * as categoryController from '../controllers/category.controller.js'
import * as categoryValidator from '../validators/category.validator.js'
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

router.post(
    '/',
    checkPermission(PERMISSIONS.CATEGORY, ACTIONS.CREATE),
    upload.array('files', 1),
    categoryValidator.validateCreateCategory,
    categoryController.createCategoryController
)

router.get(
    '/',
    checkPermission(PERMISSIONS.CATEGORY),
    categoryValidator.validateGetCategories,
    categoryController.getAllCategoriesController
)

router.get(
    '/tree',
    checkPermission(PERMISSIONS.CATEGORY),
    categoryValidator.validateGetCategoryTree,
    categoryController.getCategoryTreeController
)

router.get(
    '/main',
    checkPermission(PERMISSIONS.CATEGORY),
    categoryValidator.validateGetMainCategories,
    categoryController.getMainCategoriesController
)

router.get(
    '/:categoryId',
    checkPermission(PERMISSIONS.CATEGORY),
    categoryValidator.validateGetCategoryById,
    categoryController.getCategoryByIdController
)

router.put(
    '/:categoryId',
    checkPermission(PERMISSIONS.CATEGORY, ACTIONS.EDIT),
    upload.array('files' , 1) ,
    categoryValidator.validateUpdateCategory,
    categoryController.updateCategoryController
)

router.patch(
    '/:categoryId/delete',
    checkPermission(PERMISSIONS.CATEGORY, ACTIONS.EDIT),
    categoryValidator.validateCategoryAction,
    categoryController.deactivateCategoryController
)

router.patch(
    '/:categoryId/delete',
    checkPermission(PERMISSIONS.CATEGORY, ACTIONS.EDIT),
    categoryValidator.validateCategoryAction,
    categoryController.activateCategoryController
)


export default router