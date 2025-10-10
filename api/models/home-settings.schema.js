import mongoose from 'mongoose'

const HomeSettingsSchema = new mongoose.Schema({
  backgroundImage: { type: String, default: '' },
  // New simplified fields
  title: { type: String, default: '' },
  subtitle: { type: String, default: '' },
  // Backward compatible optional granular fields
  mainHeadingBuy: { type: String, default: '' },
  mainHeadingCanadian: { type: String, default: '' },
  subHeadingPart1: { type: String, default: '' },
  subHeadingPart2: { type: String, default: '' },
  isActive: { type: Boolean, default: true }
}, { collection: 'HomeSettings', timestamps: true })

export default mongoose.model('HomeSettings', HomeSettingsSchema)


