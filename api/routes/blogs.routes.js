import express from 'express'
import { 
    createBlogController,
    getAllBlogsController,
    getBlogByIdController,
    updateBlogController,
    deleteBlogController
} from '../controllers/blogs.controller.js'
import {
    validateCreateBlog,
    validateGetBlogs,
    validateGetBlogById,
    validateUpdateBlog,
    validateDeleteBlog
} from '../validators/blogs.validator.js'
import {requireAuth as authMiddleware} from '../middlewares/auth.middleware.js'
import multer from 'multer'

const storage = multer.memoryStorage()
const upload = multer({
    dest: 'uploads',
})


const router = express.Router()

router.post('/', authMiddleware, upload.array('files', 1), validateCreateBlog, createBlogController)
router.get('/', validateGetBlogs, getAllBlogsController)
router.get('/:blogId', validateGetBlogById, getBlogByIdController)
router.put('/:blogId', authMiddleware, upload.array('coverImage', 1), validateUpdateBlog, updateBlogController)
router.delete('/:blogId', authMiddleware, validateDeleteBlog, deleteBlogController)

export default router