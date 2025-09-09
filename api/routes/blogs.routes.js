import express from 'express'
import trimRequest from 'trim-request'
import * as blogsController from '../controllers/blogs.controller.js'
import * as blogsValidator from '../validators/blogs.validator.js'
import {requireAuth as authMiddleware} from '../middlewares/auth.middleware.js'
import multer from 'multer'

const upload = multer({
    dest: 'uploads',
})


const router = express.Router()

router.use(trimRequest.all)

router.post('/', authMiddleware, upload.array('files', 1), blogsValidator.validateCreateBlog, blogsController.createBlogController)
router.get('/', blogsValidator.validateGetBlogs, blogsController.getAllBlogsController)
router.get('/:blogId', blogsValidator.validateGetBlogById, blogsController.getBlogByIdController)
router.put('/:blogId', authMiddleware, upload.array('coverImage', 1), blogsValidator.validateUpdateBlog, blogsController.updateBlogController)
router.delete('/:blogId', authMiddleware, blogsValidator.validateDeleteBlog, blogsController.deleteBlogController)

export default router