import mongoose from 'mongoose'

const LandingFeatureSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  description: { type: String, required: true, trim: true },
  icon: { type: String, required: false, trim: true },
  order: { type: Number, default: 0, index: true },
  isActive: { type: Boolean, default: true },
}, { collection: 'LandingFeatures', timestamps: true })

export default mongoose.model('LandingFeature', LandingFeatureSchema)


