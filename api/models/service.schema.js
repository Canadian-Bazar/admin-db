import mongoose from 'mongoose'
import paginate from 'mongoose-paginate-v2'
import aggregatePaginate from 'mongoose-aggregate-paginate-v2'

const ServiceSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    slug: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true
    },
    description: {
        type: String,
        trim: true
    },
    shortDescription: {
        type: String,
        trim: true,
        maxlength: 200
    },
    avgRating: {
        type: Number,
        default: 0.0,
        min: 0,
        max: 5
    },
    ratingsCount: {
        type: Number,
        default: 0,
        min: 0
    },
    price: {
        type: Number,
        min: 0
    },
    originalPrice: {
        type: Number,
        min: 0
    },
    discount: {
        type: Number,
        min: 0,
        max: 100,
        default: 0
    },
    category: {
        type: mongoose.Types.ObjectId,
        ref: 'Category',
    },
    categoryName: {
        type: String,
        trim: true
    },
    subcategory: {
        type: mongoose.Types.ObjectId,
        ref: 'Category'
    },
    subcategoryName: {
        type: String,
        trim: true
    },
    images: [{
        type: String
    }],
    thumbnail: {
        type: String
    },
    isVerified: {
        type: Boolean,
        default: false
    },
    duration: {
        value: { type: Number, min: 1 },
        unit: { 
            type: String, 
            enum: ['minutes', 'hours', 'days', 'weeks', 'months'] 
        }
    },
    serviceType: {
        type: String,
        enum: ['one-time', 'recurring', 'subscription'],
        default: 'one-time'
    },
    recurringInterval: {
        type: String,
        enum: ['daily', 'weekly', 'monthly', 'yearly'],
        required: function() {
            return this.serviceType === 'recurring' || this.serviceType === 'subscription'
        }
    },
    isAvailable: {
        type: Boolean,
        default: true
    },
    maxBookings: {
        type: Number,
        min: 1
    },
    currentBookings: {
        type: Number,
        default: 0,
        min: 0
    },
    tags: [{
        type: String,
        trim: true
    }],
    requirements: [{
        type: String,
        trim: true
    }],
    deliverables: [{
        type: String,
        trim: true
    }],
    features: [{
        type: String,
        trim: true
    }],
    isActive: {
        type: Boolean,
        default: true
    },
    isFeatured: {
        type: Boolean,
        default: false
    },
    isBlocked: {
        type: Boolean,
        default: false
    },
    isArchived: {
        type: Boolean,
        default: false
    },
    seller: {
        type: mongoose.Types.ObjectId,
        ref: 'Seller'
    },
    rating: {
        average: { type: Number, default: 0, min: 0, max: 5 },
        count: { type: Number, default: 0, min: 0 }
    },
    reviews: [{
        user: { type: mongoose.Types.ObjectId, ref: 'User' },
        rating: { type: Number, min: 1, max: 5 },
        comment: { type: String, trim: true },
        createdAt: { type: Date, default: Date.now }
    }],
    isComplete: {
        type: Boolean,
        default: false
    },
    completionPercentage: {
        type: Number,
        default: 0,
        min: 0,
        max: 100
    },
    incompleteSteps: [{
        type: String,
        enum: ['serviceInfo', 'capabilities', 'order', 'pricing', 'customization', 'media']
    }],
    stepStatus: {
        serviceInfo: { type: Boolean, default: false },
        capabilities: { type: Boolean, default: false },
        order: { type: Boolean, default: false },
        pricing: { type: Boolean, default: false },
        customization: { type: Boolean, default: false },
        media: { type: Boolean, default: false }
    },
    availability: {
        monday: { start: String, end: String, isAvailable: { type: Boolean, default: true } },
        tuesday: { start: String, end: String, isAvailable: { type: Boolean, default: true } },
        wednesday: { start: String, end: String, isAvailable: { type: Boolean, default: true } },
        thursday: { start: String, end: String, isAvailable: { type: Boolean, default: true } },
        friday: { start: String, end: String, isAvailable: { type: Boolean, default: true } },
        saturday: { start: String, end: String, isAvailable: { type: Boolean, default: true } },
        sunday: { start: String, end: String, isAvailable: { type: Boolean, default: true } }
    },
    seoTitle: {
        type: String,
        trim: true
    },
    seoDescription: {
        type: String,
        trim: true
    },
    seoKeywords: [{
        type: String,
        trim: true
    }],
    city: {
        type: String,
        trim: true
    },
    status: {
        type: String,
        enum: ['draft', 'published', 'archived'],
        default: 'draft'
    }
}, { 
    timestamps: true, 
    collection: 'Service' 
})

// Indexes for better performance
ServiceSchema.index({ name: 'text', description: 'text', tags: 'text' })
ServiceSchema.index({ category: 1, isActive: 1 })
ServiceSchema.index({ price: 1 })
ServiceSchema.index({ rating: -1 })
ServiceSchema.index({ createdAt: -1 })
ServiceSchema.index({ serviceType: 1 })
ServiceSchema.index({ isVerified: 1 })

ServiceSchema.plugin(paginate)
ServiceSchema.plugin(aggregatePaginate)

export default mongoose.model('Service', ServiceSchema)
