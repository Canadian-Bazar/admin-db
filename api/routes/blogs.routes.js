import express from 'express'
import trimRequest from 'trim-request'
import * as blogsController from '../controllers/blogs.controller.js'
import * as blogsValidator from '../validators/blogs.validator.js'
import {requireAuth as authMiddleware} from '../middlewares/auth.middleware.js'
import { checkPermission } from '../middlewares/permission.middleware.js'
import multer from 'multer'

const upload = multer({
    dest: 'uploads',
})


const router = express.Router()

router.use(trimRequest.all)

router.post('/', authMiddleware, checkPermission('blogs', 'create'), upload.array('files', 1), blogsValidator.validateCreateBlog, blogsController.createBlogController)
router.get('/', authMiddleware, checkPermission('blogs', 'view'), blogsValidator.validateGetBlogs, blogsController.getAllBlogsController)
router.get('/:blogId', authMiddleware, checkPermission('blogs', 'view'), blogsValidator.validateGetBlogById, blogsController.getBlogByIdController)
router.put('/:blogId', authMiddleware, checkPermission('blogs', 'edit'), upload.array('coverImage', 1), blogsValidator.validateUpdateBlog, blogsController.updateBlogController)
router.delete('/:blogId', authMiddleware, checkPermission('blogs', 'delete'), blogsValidator.validateDeleteBlog, blogsController.deleteBlogController)

export default router