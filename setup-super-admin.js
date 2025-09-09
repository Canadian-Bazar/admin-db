import mongoose from 'mongoose'
import User from './api/models/user.schema.js'
import Roles from './api/models/role.schema.js'
import UserGroup from './api/models/user-group.schema.js'
import UserGroupMember from './api/models/user-group-member.schema.js'
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

const setupSuperAdmin = async () => {
  try {
    console.log('🔧 Setting up Super Admin user...')
    
    // 1. Create Super Admin role if it doesn't exist
    let superAdminRole = await Roles.findOne({ role: 'super_admin' })
    if (!superAdminRole) {
      superAdminRole = await Roles.create({
        role: 'super_admin',
        label: 'Super Admin',
        description: 'Has full system access and can manage all permissions'
      })
      console.log('✅ Created Super Admin role')
    } else {
      console.log('ℹ️  Super Admin role already exists')
    }

    // 2. Create default 'user' role if it doesn't exist
    let userRole = await Roles.findOne({ role: 'user' })
    if (!userRole) {
      userRole = await Roles.create({
        role: 'user',
        label: 'Regular User',
        description: 'Standard user with basic permissions'
      })
      console.log('✅ Created User role')
    } else {
      console.log('ℹ️  User role already exists')
    }

    // 3. Create Super Admin user if it doesn't exist
    const superAdminEmail = 'admin@example.com'
    let superAdminUser = await User.findOne({ email: superAdminEmail })
    
    if (!superAdminUser) {
      superAdminUser = await User.create({
        fullName: 'Super Administrator',
        email: superAdminEmail,
        password: 'SuperAdmin123!', // Will be hashed by pre-save middleware
        roleId: superAdminRole._id
      })
      console.log('✅ Created Super Admin user')
      console.log(`📧 Email: ${superAdminEmail}`)
      console.log('🔐 Password: SuperAdmin123!')
    } else {
      console.log('ℹ️  Super Admin user already exists')
      console.log(`📧 Email: ${superAdminEmail}`)
    }

    // 4. Add Super Admin to Super Admin group if group exists
    const superAdminGroup = await UserGroup.findOne({ name: 'Super Admin' })
    if (superAdminGroup) {
      const existingMembership = await UserGroupMember.findOne({
        userId: superAdminUser._id,
        groupId: superAdminGroup._id
      })

      if (!existingMembership) {
        await UserGroupMember.create({
          userId: superAdminUser._id,
          groupId: superAdminGroup._id
        })
        console.log('✅ Added Super Admin user to Super Admin group')
      } else {
        console.log('ℹ️  Super Admin user already in Super Admin group')
      }
    }

    console.log('\n🎉 Super Admin setup completed successfully!')
    console.log('\n📋 Login Credentials:')
    console.log('Email: admin@example.com')
    console.log('Password: SuperAdmin123!')
    console.log('\n🔗 Login Endpoint: POST /api/v1/auth/login')
    
    console.log('\n⚠️  Security Reminder:')
    console.log('- Change the default password after first login')
    console.log('- Consider enabling 2FA for the super admin account')
    console.log('- Regularly review super admin permissions and access')

    return {
      superAdminUser,
      superAdminRole,
      userRole,
      credentials: {
        email: superAdminEmail,
        password: 'SuperAdmin123!'
      }
    }

  } catch (error) {
    console.error('❌ Error setting up Super Admin:', error)
    throw error
  }
}

const main = async () => {
  try {
    await connectDB()
    await setupSuperAdmin()
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

export { setupSuperAdmin }