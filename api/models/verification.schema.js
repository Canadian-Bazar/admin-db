import mongoose from 'mongoose'
import paginate from 'mongoose-paginate-v2'

const VerificationsSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      index: true,
      lowercase: true,
      trim: true,
    },
    phoneNumber: {
      type: String,
      trim: true,
      index: true,
    },
    isEmailVerified: {
      type: Boolean,
      default: false,
      required: true,
    },
    isPhoneNumberVerified: {
      type: Boolean,
      default: false,
      required: true,
    },
    emailOtp: { type: String, trim: true },
    phoneOtp: { type: String, trim: true },
    otp: { type: Number },
    validTill: { type: Date },
  },
  {
    versionKey: false,
    timestamps: true,
    collection: 'Verifications',
    expires:30*5*60
  }
)

VerificationsSchema.plugin(paginate)

export default mongoose.model('Verifications', VerificationsSchema)
