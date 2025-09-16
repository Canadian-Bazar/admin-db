import mongoose from 'mongoose'
import paginate from 'mongoose-paginate-v2'
import aggregatePaginate from 'mongoose-aggregate-paginate-v2'

const ProductSchema = new mongoose.Schema({
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
    price: {
        type: Number,
        required: false,
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
        required: false
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
    sku: {
        type: String,
        unique: true,
        sparse: true
    },
    stock: {
        type: Number,
        default: 0,
        min: 0
    },
    isInStock: {
        type: Boolean,
        default: true
    },
    weight: {
        type: Number,
        min: 0
    },
    dimensions: {
        length: { type: Number, min: 0 },
        width: { type: Number, min: 0 },
        height: { type: Number, min: 0 }
    },
    tags: [{
        type: String,
        trim: true
    }],
    specifications: [{
        name: { type: String, required: true },
        value: { type: String, required: true }
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
    collection: 'Product' 
})

// Indexes for better performance
ProductSchema.index({ name: 'text', description: 'text', tags: 'text' })
ProductSchema.index({ category: 1, isActive: 1 })
ProductSchema.index({ price: 1 })
ProductSchema.index({ rating: -1 })
ProductSchema.index({ createdAt: -1 })

ProductSchema.plugin(paginate)
ProductSchema.plugin(aggregatePaginate)

export default mongoose.model('Product', ProductSchema)
