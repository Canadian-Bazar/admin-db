import express from 'express'

import authRoutes from '../routes/auth.routes.js'
import uploadRoutes from '../routes/upload.routes.js'
import categoryRoutes from '../routes/category.routes.js'
// import sellerRoutes from '../routes/seller.routes.js' // REMOVED: Admin-db should not have seller routes
import certificationRoutes from '../routes/certification.routes.js'
import blogsRoutes from '../routes/blogs.routes.js'
import websiteQuotationRoutes from '../routes/website-quotation.routes.js'
import websiteProjectRoutes from '../routes/website-project.routes.js'
import websiteDocumentationRoutes from '../routes/website-documentation.routes.js'
import subscriptionTemplatesRoutes from '../routes/subscription-templates.routes.js'
import subscriptionVersionsRoutes from '../routes/subscription-versions.routes.js'
import sellerRoutes from '../routes/seller.routes.js'
// Permission Management Routes
import permissionRoutes from '../routes/permission.routes.js'
import userPermissionRoutes from '../routes/user-permission.routes.js'
import userGroupRoutes from '../routes/user-group.routes.js'
import userManagementRoutes from '../routes/user-management.routes.js'


//cnc-quotes


import cncQuotesRoutes from '../routes/cnc-quotes.routes.js'

const v1Routes = express.Router()
const router = express.Router()

v1Routes.use('/auth', authRoutes)
v1Routes.use('/upload', uploadRoutes)
v1Routes.use('/category', categoryRoutes)
v1Routes.use('/seller', sellerRoutes) // REMOVED: Admin-db should not have seller routes
v1Routes.use('/certification', certificationRoutes)
v1Routes.use('/blogs', blogsRoutes)
v1Routes.use('/quotations', websiteQuotationRoutes)
v1Routes.use('/website-projects', websiteProjectRoutes)
v1Routes.use('/website-documentation', websiteDocumentationRoutes)
v1Routes.use('/subscription-templates', subscriptionTemplatesRoutes)
v1Routes.use('/subscription-versions', subscriptionVersionsRoutes)

// Permission Management Routes
v1Routes.use('/permissions', permissionRoutes)
v1Routes.use('/user-permissions', userPermissionRoutes)
v1Routes.use('/user-groups', userGroupRoutes)
v1Routes.use('/users', userManagementRoutes)


//CNC Quotes Routes
v1Routes.use('/cnc-quotes', cncQuotesRoutes)

router.use('/api/v1', v1Routes)

export default router
