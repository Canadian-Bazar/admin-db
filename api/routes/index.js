import express from 'express'

import authRoutes from '../routes/auth.routes.js'
import uploadRoutes from '../routes/upload.routes.js'
import categoryRoutes from '../routes/category.routes.js'
import sellerRoutes from '../routes/seller.routes.js'
import certificationRoutes from '../routes/certification.routes.js'
import blogsRoutes from '../routes/blogs.routes.js'

const v1Routes = express.Router()
const router = express.Router()

v1Routes.use('/auth', authRoutes)
v1Routes.use('/upload', uploadRoutes)
v1Routes.use('/category', categoryRoutes)
v1Routes.use('/seller', sellerRoutes)
v1Routes.use('/certification', certificationRoutes)
v1Routes.use('/blogs', blogsRoutes)

router.use('/api/v1', v1Routes)

export default router
