import mongoose from 'mongoose'
import paginate from 'mongoose-paginate-v2'
import aggregatePaginate from 'mongoose-aggregate-paginate-v2'

const UserGroupMemberSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    groupId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'UserGroup',
      required: true,
      index: true
    },
    assignedAt: {
      type: Date,
      default: Date.now,
      index: true
    }
  },
  {
    timestamps: true,
    collection: 'UserGroupMembers',
    versionKey: false
  }
)

// Compound unique index to prevent duplicate user-group combinations
UserGroupMemberSchema.index({ userId: 1, groupId: 1 }, { unique: true })

// Index for fast group member lookups
UserGroupMemberSchema.index({ groupId: 1, assignedAt: -1 })

// Index for fast user group lookups
UserGroupMemberSchema.index({ userId: 1, assignedAt: -1 })

UserGroupMemberSchema.plugin(paginate)
UserGroupMemberSchema.plugin(aggregatePaginate)

export default mongoose.model('UserGroupMember', UserGroupMemberSchema)