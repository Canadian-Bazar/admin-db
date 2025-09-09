import mongoose from 'mongoose'
import paginate from 'mongoose-paginate-v2'
import aggregatePaginate from 'mongoose-aggregate-paginate-v2'

const UserGroupSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      index: true,
      trim: true
    },
    description: {
      type: String,
      default: null,
      trim: true
    },
    permissions: [{
      permissionId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Permission',
        required: true
      },
      grantedActions: {
        type: [String],
        enum: ['view', 'create', 'edit', 'delete'],
        required: true,
        validate: {
          validator: function(actions) {
            return actions.length > 0
          },
          message: 'At least one action must be granted'
        }
      }
    }],
    isActive: {
      type: Boolean,
      default: true,
      index: true
    }
  },
  {
    timestamps: true,
    collection: 'UserGroups',
    versionKey: false
  }
)

// Index for active groups
UserGroupSchema.index({ isActive: 1, name: 1 })

// Pre-save middleware to ensure 'view' is always included in permission actions
UserGroupSchema.pre('save', function(next) {
  this.permissions.forEach(permission => {
    if (!permission.grantedActions.includes('view')) {
      permission.grantedActions.unshift('view')
    }
  })
  next()
})

// Pre-update middleware to ensure 'view' is always included
UserGroupSchema.pre('findOneAndUpdate', function(next) {
  const update = this.getUpdate()
  if (update.permissions) {
    update.permissions.forEach(permission => {
      if (permission.grantedActions && !permission.grantedActions.includes('view')) {
        permission.grantedActions.unshift('view')
      }
    })
  }
  next()
})

UserGroupSchema.plugin(paginate)
UserGroupSchema.plugin(aggregatePaginate)

export default mongoose.model('UserGroup', UserGroupSchema)