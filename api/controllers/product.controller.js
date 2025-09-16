import { matchedData } from 'express-validator'
import Product from '../models/product.schema.js'
import Category from '../models/category.schema.js'
import buildResponse from '../utils/buildResponse.js'
import handleError from '../utils/handleError.js'
import httpStatus from 'http-status'
import buildErrorObject from '../utils/buildErrorObject.js'
import mongoose from 'mongoose'
import { uploadFile } from '../helpers/aws-s3.js'

const generateSlug = (name) => {
    return name
        .toLowerCase()
        .replace(/[^\w\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .trim()
}

export const createProductController = async (req, res) => {
    const session = await mongoose.startSession()

    try {
        const validatedData = matchedData(req)
        const { name, description, price, category, categoryName: inputCategoryName, subcategory, subcategoryName: inputSubcategoryName, tags, features, specifications } = validatedData

        await session.startTransaction()

        let categoryId = category
        let subcategoryId = subcategory
        let resolvedCategoryName = inputCategoryName
        let resolvedSubcategoryName = inputSubcategoryName

        let categoryDoc = null
        let subcategoryDoc = null

        // Handle category by name if provided
        if (resolvedCategoryName && !category) {
            categoryDoc = await Category.findOne({ 
                name: { $regex: new RegExp(`^${resolvedCategoryName}$`, 'i') },
                isActive: true 
            }).session(session)
            if (!categoryDoc) {
                throw buildErrorObject(httpStatus.BAD_REQUEST, `Category "${resolvedCategoryName}" not found`)
            }
            categoryId = categoryDoc._id
        }

        // Validate category exists if provided
        if (categoryId) {
            if (!categoryDoc) {
                categoryDoc = await Category.findById(categoryId).session(session)
            }
            if (!categoryDoc) {
                throw buildErrorObject(httpStatus.BAD_REQUEST, "Category not found")
            }
            if (!categoryDoc.isActive) {
                throw buildErrorObject(httpStatus.BAD_REQUEST, "Category is not active")
            }
            // Set resolvedCategoryName from the fetched category document
            if (!resolvedCategoryName) {
                resolvedCategoryName = categoryDoc.name
            }
        }

        // Handle subcategory by name if provided
        if (resolvedSubcategoryName && !subcategory) {
            subcategoryDoc = await Category.findOne({ 
                name: { $regex: new RegExp(`^${resolvedSubcategoryName}$`, 'i') },
                isActive: true 
            }).session(session)
            if (!subcategoryDoc) {
                throw buildErrorObject(httpStatus.BAD_REQUEST, `Subcategory "${resolvedSubcategoryName}" not found`)
            }
            subcategoryId = subcategoryDoc._id
        }

        // Validate subcategory if provided
        if (subcategoryId) {
            if (!subcategoryDoc) {
                subcategoryDoc = await Category.findById(subcategoryId).session(session)
            }
            if (!subcategoryDoc) {
                throw buildErrorObject(httpStatus.BAD_REQUEST, "Subcategory not found")
            }
            if (!subcategoryDoc.isActive) {
                throw buildErrorObject(httpStatus.BAD_REQUEST, "Subcategory is not active")
            }
            // Set resolvedSubcategoryName from the fetched subcategory document
            if (!resolvedSubcategoryName) {
                resolvedSubcategoryName = subcategoryDoc.name
            }
        }

        // Handle image uploads
        let images = []
        let thumbnail = ""

        if (req.files?.length) {
            const uploadedUrls = await uploadFile(req.files)
            images = uploadedUrls
            thumbnail = uploadedUrls[0] // First image as thumbnail
        }

        // Generate unique slug
        let baseSlug = generateSlug(name)
        let slug = baseSlug
        let suffix = 1

        while (await Product.exists({ slug }).session(session)) {
            slug = `${baseSlug}-${suffix++}`
        }

        // Generate SKU if not provided
        let sku = validatedData.sku
        if (!sku) {
            const timestamp = Date.now().toString().slice(-6)
            sku = `PRD-${timestamp}`
        }

        // Calculate discount percentage if originalPrice and price are provided
        let discount = 0
        if (validatedData.originalPrice && price && validatedData.originalPrice > price) {
            discount = Math.round(((validatedData.originalPrice - price) / validatedData.originalPrice) * 100)
        }

        const productData = {
            name,
            slug,
            description,
            shortDescription: validatedData.shortDescription,
            price,
            originalPrice: validatedData.originalPrice,
            discount,
            category: categoryId,
            categoryName: resolvedCategoryName || (categoryDoc?.name) || null,
            subcategory: subcategoryId,
            subcategoryName: resolvedSubcategoryName || (subcategoryDoc?.name) || null,
            images,
            thumbnail,
            sku,
            stock: validatedData.stock || 0,
            isInStock: (validatedData.stock || 0) > 0,
            weight: validatedData.weight,
            dimensions: validatedData.dimensions,
            tags: tags || [],
            specifications: specifications || [],
            features: features || [],
            isActive: true,
            isFeatured: validatedData.isFeatured || false,
            seller: validatedData.seller,
            seoTitle: validatedData.seoTitle,
            seoDescription: validatedData.seoDescription,
            seoKeywords: validatedData.seoKeywords || [],
            city: validatedData.city,
            status: validatedData.status || 'draft'
        }

        const [newProduct] = await Product.create([productData], { session })

        await session.commitTransaction()

        return res.status(httpStatus.CREATED).json(
            buildResponse(httpStatus.CREATED, {
                message: "Product created successfully",
                product: newProduct
            })
        )
    } catch (err) {
        await session.abortTransaction()
        handleError(res, err)
    } finally {
        session.endSession()
    }
}

export const getAllProductsController = async (req, res) => {
    try {
        const validatedData = matchedData(req)
        let { 
            page = 1, 
            limit = 10, 
            search, 
            isActive, 
            category, 
            subcategory, 
            minPrice, 
            maxPrice, 
            isFeatured,
            isInStock,
            city,
            sortBy = 'createdAt',
            sortOrder = 'desc'
        } = validatedData

        limit = Math.min(Number(limit), 50)
        page = Number(page)

        const filter = {}

        // Text search
        if (search) {
            filter.$or = [
                { name: { $regex: search, $options: 'i' } },
                { description: { $regex: search, $options: 'i' } },
                { tags: { $in: [new RegExp(search, 'i')] } }
            ]
        }

        // Status filters
        if (isActive !== undefined) {
            filter.isActive = isActive === 'true' || isActive === true
        }

        if (isFeatured !== undefined) {
            filter.isFeatured = isFeatured === 'true' || isFeatured === true
        }

        if (isInStock !== undefined) {
            filter.isInStock = isInStock === 'true' || isInStock === true
        }

        // Category filters
        if (category && category !== 'all') {
            filter.category = mongoose.Types.ObjectId.createFromHexString(category)
        }

        if (subcategory && subcategory !== 'all') {
            filter.subcategory = mongoose.Types.ObjectId.createFromHexString(subcategory)
        }

        // Price range
        if (minPrice !== undefined || maxPrice !== undefined) {
            filter.price = {}
            if (minPrice !== undefined) filter.price.$gte = Number(minPrice)
            if (maxPrice !== undefined) filter.price.$lte = Number(maxPrice)
        }

        // City filter
        if (city) {
            filter.city = { $regex: city, $options: 'i' }
        }

        // Sort options
        const sortOptions = {}
        if (sortBy === 'price') {
            sortOptions.price = sortOrder === 'asc' ? 1 : -1
        } else if (sortBy === 'rating') {
            sortOptions['rating.average'] = sortOrder === 'asc' ? 1 : -1
        } else if (sortBy === 'name') {
            sortOptions.name = sortOrder === 'asc' ? 1 : -1
        } else {
            sortOptions.createdAt = sortOrder === 'asc' ? 1 : -1
        }

        const options = {
            page,
            limit,
            populate: [
                {
                    path: 'category',
                    select: 'name slug',
                    options: { strictPopulate: false }
                },
                {
                    path: 'subcategory',
                    select: 'name slug',
                    options: { strictPopulate: false }
                },
                {
                    path: 'seller',
                    select: 'name email'
                }
            ],
            sort: sortOptions
        }

        const products = await Product.paginate(filter, options)

        // Return minimal common fields for listing
        const minimalDocs = products.docs.map((product) => {
            const createdDate = new Date(product.createdAt)
            const created = createdDate.toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            })
            return {
                _id: product._id,
                name: product.name,
                status: product.isActive ? 'Active' : 'Inactive',
                created
            }
        })

        const response = {
            docs: minimalDocs,
            totalDocs: products.totalDocs,
            limit: products.limit,
            page: products.page,
            totalPages: products.totalPages,
            hasNextPage: products.hasNextPage,
            hasPrevPage: products.hasPrevPage,
            nextPage: products.nextPage,
            prevPage: products.prevPage,
            pagingCounter: products.pagingCounter
        }

        res.status(httpStatus.OK).json(buildResponse(httpStatus.OK, response))
    } catch (err) {
        handleError(res, err)
    }
}

export const toggleProductStatusController = async (req, res) => {
    try {
        const validatedData = matchedData(req)
        const { productId, isActive } = validatedData

        const product = await Product.findById(productId)
        if (!product) {
            throw buildErrorObject(httpStatus.NOT_FOUND, 'Product not found')
        }

        if (product.isActive === isActive) {
            const status = isActive ? 'active' : 'inactive'
            throw buildErrorObject(httpStatus.BAD_REQUEST, `Product is already ${status}`)
        }

        product.isActive = isActive
        await product.save()

        const status = isActive ? 'activated' : 'deactivated'
        res.status(httpStatus.OK).json(
            buildResponse(httpStatus.OK, {
                message: `Product ${status} successfully`,
                product: {
                    _id: product._id,
                    name: product.name,
                    isActive: product.isActive
                }
            })
        )
    } catch (err) {
        handleError(res, err)
    }
}

export const getProductInfoController = async (req, res) => {
    try {
        const validatedData = matchedData(req)
        const { productId } = validatedData

        const product = await Product.findById(productId)
            .populate('category', 'name slug')
            .populate('subcategory', 'name slug')
            .populate('seller', 'name email phone')
            .populate('reviews.user', 'name email')

        if (!product) {
            throw buildErrorObject(httpStatus.NOT_FOUND, 'Product not found')
        }

        // Ensure categoryName is included
        const productData = product.toObject()
        if (productData.category && !productData.categoryName) {
            productData.categoryName = productData.category.name
        }
        if (productData.subcategory && !productData.subcategoryName) {
            productData.subcategoryName = productData.subcategory.name
        }

        res.status(httpStatus.OK).json(buildResponse(httpStatus.OK, productData))
    } catch (err) {
        handleError(res, err)
    }
}

export const fixProductCategoriesController = async (req, res) => {
    try {
        // Find products without categoryName
        const productsWithoutCategory = await Product.find({
            $or: [
                { categoryName: { $exists: false } },
                { categoryName: null },
                { categoryName: '' }
            ]
        }).populate('category', 'name')

        let fixedCount = 0

        for (const product of productsWithoutCategory) {
            if (product.category && product.category.name) {
                product.categoryName = product.category.name
                await product.save()
                fixedCount++
            } else {
                // Set a default category name for products without category
                product.categoryName = 'Uncategorized'
                await product.save()
                fixedCount++
            }
        }

        res.status(httpStatus.OK).json(buildResponse(httpStatus.OK, {
            message: `Fixed ${fixedCount} products`,
            fixedCount,
            totalProcessed: productsWithoutCategory.length
        }))
    } catch (err) {
        handleError(res, err)
    }
}

export const searchProductsController = async (req, res) => {
    try {
        const validatedData = matchedData(req)
        const { q, category, minPrice, maxPrice, limit = 10 } = validatedData

        const filter = { isActive: true }

        if (q) {
            filter.$text = { $search: q }
        }

        if (category) {
            filter.category = mongoose.Types.ObjectId.createFromHexString(category)
        }

        if (minPrice !== undefined || maxPrice !== undefined) {
            filter.price = {}
            if (minPrice !== undefined) filter.price.$gte = Number(minPrice)
            if (maxPrice !== undefined) filter.price.$lte = Number(maxPrice)
        }

        const products = await Product.find(filter)
            .populate('category', 'name slug')
            .select('name slug price thumbnail rating images')
            .limit(Number(limit))
            .sort({ score: { $meta: 'textScore' } })

        res.status(httpStatus.OK).json(buildResponse(httpStatus.OK, { products }))
    } catch (err) {
        handleError(res, err)
    }
}
