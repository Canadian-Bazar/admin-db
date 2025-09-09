import mongoose from 'mongoose'
import paginate from 'mongoose-paginate-v2'
import aggregatePaginate from 'mongoose-aggregate-paginate-v2'

const PermissionSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      index: true,
      trim: true,
      lowercase: true
    },
    route: {
      type: String,
      required: true,
      trim: true
    },
    description: {
      type: String,
      default: null,
      trim: true
    },
    module: {
      type: String,
      required: true,
      index: true,
      trim: true,
      lowercase: true
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true
    }
  },
  {
    timestamps: true,
    collection: 'Permissions',
    versionKey: false
  }
)

// Compound indexes for better query performance
PermissionSchema.index({ module: 1, isActive: 1 })
PermissionSchema.index({ name: 1, isActive: 1 })

PermissionSchema.plugin(paginate)
PermissionSchema.plugin(aggregatePaginate)

export default mongoose.model('Permission', PermissionSchema)