# 🔐 Permission Management System - Setup & Testing Guide

## 📋 **Prerequisites**

1. ✅ MongoDB running and connected
2. ✅ Node.js server running on port specified in your config
3. ✅ All dependencies installed (`npm install`)

## 🚀 **Setup Steps**

### **Step 1: Initialize Super Admin User**
```bash
cd /Users/admin/.YASH/admin-db
node setup-super-admin.js
```

This creates:
- **Super Admin Role**: `super_admin`
- **Default User Role**: `user` 
- **Super Admin User**: 
  - Email: `admin@example.com`
  - Password: `SuperAdmin123!`

### **Step 2: Initialize Permission System**
```bash
node setup-permissions.js
```

This creates:
- **15 Default Permissions** across 5 modules
- **6 Default User Groups** with pre-configured permissions
- Assigns Super Admin user to Super Admin group

### **Step 3: Import Postman Collection**

1. Open Postman
2. Click **Import** 
3. Select `Permission_Management_API_Tests.postman_collection.json`
4. Update the `baseUrl` variable to match your server (default: `http://localhost:9090`)

## 🧪 **Testing Instructions**

### **Prerequisites for Testing:**
1. **Update baseUrl**: Set collection variable `baseUrl` to your server URL
2. **Server Running**: Ensure your admin-db server is running
3. **Database Ready**: Run both setup scripts above

### **Test Flow:**
The Postman collection is designed to run **sequentially** (top to bottom):

1. **🔐 Login Super Admin** - Gets authentication token
2. **📝 Create Permission** - Creates test permission
3. **👥 Create User Group** - Creates test group with permissions
4. **👤 Create User** - Creates user with permissions & groups
5. **🔍 Test All Endpoints** - CRUD operations on all entities
6. **🛡️ Test Protected Routes** - Verifies permission middleware works
7. **🧹 Cleanup** - Removes test data

### **Running Tests:**

**Option 1: Run Individual Requests**
- Click each request in order
- Check the **Test Results** tab
- Variables are automatically set between requests

**Option 2: Run Collection**
- Click **Run Collection**
- Select all requests
- Set delay to 500ms between requests
- Click **Run**

## 📊 **What Gets Created**

### **Default Permissions (15):**
```json
{
  "user-management": ["users", "user-permissions", "user-groups", "permissions"],
  "content-management": ["categories", "blogs", "certifications"], 
  "website-management": ["website-projects", "website-quotations"],
  "subscription-management": ["subscription-templates", "subscription-versions"],
  "system": ["uploads", "dashboard", "reports"]
}
```

### **Default User Groups (6):**
- **Super Admin** - All permissions with all actions
- **Content Manager** - Content & media management
- **Website Manager** - Website project management
- **Subscription Manager** - Subscription management
- **User Manager** - User & permission management
- **Viewer** - Read-only access

## 🔧 **API Endpoints Overview**

### **Permission Management:**
- `POST /api/v1/permissions` - Create permission
- `GET /api/v1/permissions` - List permissions
- `PUT /api/v1/permissions/:id` - Update permission
- `DELETE /api/v1/permissions/:id` - Delete permission

### **User Management:**
- `POST /api/v1/users` - Create user with permissions
- `GET /api/v1/users` - List users with permissions
- `PATCH /api/v1/users/:id/password` - Change password
- `DELETE /api/v1/users/:id` - Delete user

### **Group Management:**
- `POST /api/v1/user-groups` - Create group
- `POST /api/v1/user-groups/:id/members` - Add user to group
- `PUT /api/v1/user-groups/:id/permissions` - Update group permissions

### **User Permission Management:**
- `POST /api/v1/user-permissions/assign` - Assign individual permission
- `GET /api/v1/user-permissions/user/:userId` - Get effective permissions
- `POST /api/v1/user-permissions/bulk-assign` - Bulk assign permissions

## 🛡️ **Permission Middleware Usage**

### **Auto-Detection (Recommended):**
```javascript
// Automatically detects action from HTTP method
router.get('/categories', checkPermission('categories'), controller) // 'view'
router.post('/users', checkPermission('users'), controller) // 'create'
router.put('/blogs', checkPermission('blogs'), controller) // 'edit'
router.delete('/reports', checkPermission('reports'), controller) // 'delete'
```

### **Explicit Action:**
```javascript
// Specify exact action needed
router.get('/sensitive-data', checkPermission('reports', 'admin'), controller)
router.post('/bulk-update', checkPermission('users', 'edit'), controller)
```

### **Multiple Permissions (AND logic):**
```javascript
router.get('/admin-dashboard', checkMultiplePermissions([
  { name: 'dashboard', action: 'view' },
  { name: 'reports', action: 'view' }
]), controller)
```

### **Any Permission (OR logic):**
```javascript
router.get('/manager-area', checkAnyPermission([
  { name: 'admin', action: 'view' },
  { name: 'manager', action: 'view' }
]), controller)
```

## ⚠️ **Security Notes**

### **Super Admin Security:**
- ✅ Change default password immediately
- ✅ Use strong, unique passwords
- ✅ Consider implementing 2FA
- ✅ Regularly audit permissions

### **Permission Best Practices:**
- ✅ Follow principle of least privilege
- ✅ Use groups instead of individual permissions when possible
- ✅ Regularly review user permissions
- ✅ Deactivate unused permissions/groups

### **Production Deployment:**
- ✅ Change all default passwords
- ✅ Use environment variables for secrets
- ✅ Enable proper logging and monitoring
- ✅ Implement rate limiting on auth endpoints

## 🔍 **Troubleshooting**

### **Common Issues:**

**1. "UNAUTHORIZED" Error**
- ✅ Check if you're logged in (run login request first)
- ✅ Verify cookie is being sent with requests
- ✅ Check if token has expired

**2. "Access denied" Error**
- ✅ Verify user has required permission
- ✅ Check if permission is active
- ✅ Ensure user is in correct group

**3. "Permission not found" Error**
- ✅ Run setup scripts to create default permissions
- ✅ Check permission name spelling
- ✅ Verify permission exists and is active

**4. Variables Not Set**
- ✅ Run requests in order (they set variables for each other)
- ✅ Check Test Results tab for variable setting
- ✅ Verify response contains expected ID fields

### **Debug Commands:**
```javascript
// Check user's effective permissions
GET /api/v1/user-permissions/user/{userId}?includeGroups=true

// List all permissions
GET /api/v1/permissions

// Check group memberships  
GET /api/v1/user-groups/{groupId}/members
```

## 🎯 **Success Criteria**

After running the full test suite, you should see:
- ✅ All requests return successful status codes (200/201)
- ✅ User created with individual permissions and group membership
- ✅ Permission middleware properly blocks unauthorized access
- ✅ Effective permissions correctly combine individual + group permissions
- ✅ CRUD operations work for all entities
- ✅ Test data properly cleaned up at the end

## 📞 **Support**

If you encounter issues:
1. Check server logs for detailed error messages
2. Verify database connectivity
3. Ensure all setup scripts ran successfully
4. Check that your server is using the correct port
5. Verify environment variables are properly set

**🎉 You now have a fully functional permission management system!**