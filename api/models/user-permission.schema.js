import mongoose from 'mongoose'
import paginate from 'mongoose-paginate-v2'
import aggregatePaginate from 'mongoose-aggregate-paginate-v2'

const UserPermissionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    permissionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Permission',
      required: true,
      index: true
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
  },
  {
    timestamps: true,
    collection: 'UserPermissions',
    versionKey: false
  }
)

// Compound unique index to prevent duplicate user-permission combinations
UserPermissionSchema.index({ userId: 1, permissionId: 1 }, { unique: true })

// Index for fast permission lookups by user
UserPermissionSchema.index({ userId: 1, grantedActions: 1 })

// Pre-save middleware to ensure 'view' is always included
UserPermissionSchema.pre('save', function(next) {
  if (!this.grantedActions.includes('view')) {
    this.grantedActions.unshift('view')
  }
  next()
})

// Pre-update middleware to ensure 'view' is always included
UserPermissionSchema.pre('findOneAndUpdate', function(next) {
  const update = this.getUpdate()
  if (update.grantedActions && !update.grantedActions.includes('view')) {
    update.grantedActions.unshift('view')
  }
  next()
})

UserPermissionSchema.plugin(paginate)
UserPermissionSchema.plugin(aggregatePaginate)

export default mongoose.model('UserPermission', UserPermissionSchema)