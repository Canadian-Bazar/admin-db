import mongoose from 'mongoose'
import Permission from './api/models/permission.schema.js'
import UserGroup from './api/models/user-group.schema.js'
import dotenv from 'dotenv'

dotenv.config()

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI)
    console.log('✅ Connected to MongoDB')
  } catch (error) {
    console.error('❌ MongoDB connection error:', error)
    process.exit(1)
  }
}

const defaultPermissions = [
  // User Management Module
  { name: 'users', route: '/users', description: 'Manage system users', module: 'user-management' },
  { name: 'user-permissions', route: '/user-permissions', description: 'Manage user permissions', module: 'user-management' },
  { name: 'user-groups', route: '/user-groups', description: 'Manage user groups', module: 'user-management' },
  { name: 'permissions', route: '/permissions', description: 'Manage system permissions', module: 'user-management' },
  
  // Content Management Module
  { name: 'categories', route: '/categories', description: 'Manage product/service categories', module: 'content-management' },
  { name: 'blogs', route: '/blogs', description: 'Manage blog posts and content', module: 'content-management' },
  { name: 'certifications', route: '/certifications', description: 'Manage certifications', module: 'content-management' },
  
  // Website Management Module
  { name: 'website-projects', route: '/website-projects', description: 'Manage website development projects', module: 'website-management' },
  { name: 'website-quotations', route: '/quotations', description: 'Manage website project quotations', module: 'website-management' },
  
  // Subscription Management Module
  { name: 'subscription-templates', route: '/subscription-templates', description: 'Manage subscription plan templates', module: 'subscription-management' },
  { name: 'subscription-versions', route: '/subscription-versions', description: 'Manage subscription plan versions', module: 'subscription-management' },
  
  // System Module
  { name: 'uploads', route: '/uploads', description: 'Manage file uploads and media', module: 'system' },
  { name: 'dashboard', route: '/dashboard', description: 'Access admin dashboard', module: 'system' },
  { name: 'reports', route: '/reports', description: 'Generate and view system reports', module: 'system' }
]

const defaultGroups = [
  {
    name: 'Super Admin',
    description: 'Full system access with all permissions',
    permissions: [] // Will be populated with all permissions
  },
  {
    name: 'Content Manager',
    description: 'Manage content, categories, and blogs',
    permissions: [
      { permissionName: 'category', actions: ['view', 'create', 'edit'] },
      { permissionName: 'blogs', actions: ['view', 'create', 'edit', 'delete'] },
      { permissionName: 'certifications', actions: ['view', 'create', 'edit'] },
      { permissionName: 'uploads', actions: ['view', 'create'] },
      { permissionName: 'dashboard', actions: ['view'] }
    ]
  },
  {
    name: 'Website Manager',
    description: 'Manage website projects and quotations',
    permissions: [
      { permissionName: 'website-projects', actions: ['view', 'create', 'edit'] },
      { permissionName: 'website-quotations', actions: ['view', 'create', 'edit'] },
      { permissionName: 'uploads', actions: ['view', 'create'] },
      { permissionName: 'dashboard', actions: ['view'] }
    ]
  },
  {
    name: 'Subscription Manager',
    description: 'Manage subscription plans and templates',
    permissions: [
      { permissionName: 'subscription-templates', actions: ['view', 'create', 'edit'] },
      { permissionName: 'subscription-versions', actions: ['view', 'create', 'edit'] },
      { permissionName: 'dashboard', actions: ['view'] }
    ]
  },
  {
    name: 'User Manager',
    description: 'Manage users and their permissions',
    permissions: [
      { permissionName: 'users', actions: ['view', 'create', 'edit'] },
      { permissionName: 'user-permissions', actions: ['view', 'create', 'edit'] },
      { permissionName: 'user-groups', actions: ['view', 'create', 'edit'] },
      { permissionName: 'dashboard', actions: ['view'] }
    ]
  },
  {
    name: 'Viewer',
    description: 'Read-only access to most content',
    permissions: [
      { permissionName: 'categories', actions: ['view'] },
      { permissionName: 'blogs', actions: ['view'] },
      { permissionName: 'website-projects', actions: ['view'] },
      { permissionName: 'website-quotations', actions: ['view'] },
      { permissionName: 'subscription-templates', actions: ['view'] },
      { permissionName: 'subscription-versions', actions: ['view'] },
      { permissionName: 'dashboard', actions: ['view'] }
    ]
  }
]

const setupPermissions = async () => {
  try {
    console.log('🔧 Setting up default permissions...')
    
    // Create permissions
    const createdPermissions = {}
    for (const permissionData of defaultPermissions) {
      const existingPermission = await Permission.findOne({ name: permissionData.name })
      
      if (!existingPermission) {
        const permission = await Permission.create(permissionData)
        createdPermissions[permissionData.name] = permission._id
        console.log(`✅ Created permission: ${permissionData.name}`)
      } else {
        createdPermissions[permissionData.name] = existingPermission._id
        console.log(`ℹ️  Permission already exists: ${permissionData.name}`)
      }
    }

    console.log('\n🔧 Setting up default user groups...')
    
    // Create groups
    for (const groupData of defaultGroups) {
      const existingGroup = await UserGroup.findOne({ name: groupData.name })
      
      if (!existingGroup) {
        // Map permission names to IDs and actions
        let permissions = []
        
        if (groupData.name === 'Super Admin') {
          // Super Admin gets all permissions with all actions
          permissions = Object.entries(createdPermissions).map(([name, id]) => ({
            permissionId: id,
            grantedActions: ['view', 'create', 'edit', 'delete']
          }))
        } else {
          // Map specific permissions
          permissions = groupData.permissions.map(perm => ({
            permissionId: createdPermissions[perm.permissionName],
            grantedActions: perm.actions
          })).filter(p => p.permissionId) // Filter out any undefined permissions
        }

        await UserGroup.create({
          name: groupData.name,
          description: groupData.description,
          permissions
        })
        
        console.log(`✅ Created group: ${groupData.name} with ${permissions.length} permissions`)
      } else {
        console.log(`ℹ️  Group already exists: ${groupData.name}`)
      }
    }

    console.log('\n🎉 Permission system setup completed successfully!')
    console.log('\n📊 Summary:')
    console.log(`- ${defaultPermissions.length} permissions created/verified`)
    console.log(`- ${defaultGroups.length} user groups created/verified`)
    
    console.log('\n📋 Available Permission Modules:')
    const modules = [...new Set(defaultPermissions.map(p => p.module))]
    modules.forEach(module => {
      const modulePerms = defaultPermissions.filter(p => p.module === module)
      console.log(`- ${module}: ${modulePerms.map(p => p.name).join(', ')}`)
    })

    console.log('\n👥 Available User Groups:')
    defaultGroups.forEach(group => {
      console.log(`- ${group.name}: ${group.description}`)
    })

    console.log('\n🚀 Next Steps:')
    console.log('1. Assign users to appropriate groups using /api/v1/user-groups/:groupId/members')
    console.log('2. Create additional permissions as needed using /api/v1/permissions')
    console.log('3. Add permission checks to your existing routes using checkPermission() middleware')
    console.log('4. Use /api/v1/user-permissions/user/:userId to view effective permissions')

  } catch (error) {
    console.error('❌ Error setting up permissions:', error)
    throw error
  }
}

const main = async () => {
  try {
    await connectDB()
    await setupPermissions()
  } catch (error) {
    console.error('❌ Setup failed:', error)
  } finally {
    await mongoose.disconnect()
    console.log('👋 Disconnected from MongoDB')
    process.exit(0)
  }
}

// Check if this file is being run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main()
}

export { setupPermissions, defaultPermissions, defaultGroups }