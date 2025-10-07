import { matchedData } from 'express-validator'
import Service from '../models/service.schema.js'
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

export const createServiceController = async (req, res) => {
    const session = await mongoose.startSession()

    try {
        const validatedData = matchedData(req)
        const { name, description, price, category, categoryName, subcategory, subcategoryName, duration, serviceType, recurringInterval } = validatedData

        await session.startTransaction()

        let categoryId = category
        let subcategoryId = subcategory

        let categoryDoc = null
        let subcategoryDoc = null

        // Handle category by name if provided
        if (categoryName && !category) {
            categoryDoc = await Category.findOne({ 
                name: { $regex: new RegExp(`^${categoryName}$`, 'i') },
                isActive: true 
            }).session(session)
            if (!categoryDoc) {
                throw buildErrorObject(httpStatus.BAD_REQUEST, `Category "${categoryName}" not found`)
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
            // Set categoryName from the fetched category document
            if (!categoryName) {
                categoryName = categoryDoc.name
            }
        }

        // Handle subcategory by name if provided
        if (subcategoryName && !subcategory) {
            subcategoryDoc = await Category.findOne({ 
                name: { $regex: new RegExp(`^${subcategoryName}$`, 'i') },
                isActive: true 
            }).session(session)
            if (!subcategoryDoc) {
                throw buildErrorObject(httpStatus.BAD_REQUEST, `Subcategory "${subcategoryName}" not found`)
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
            // Set subcategoryName from the fetched subcategory document
            if (!subcategoryName) {
                subcategoryName = subcategoryDoc.name
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

        while (await Service.exists({ slug }).session(session)) {
            slug = `${baseSlug}-${suffix++}`
        }

        // Calculate discount percentage if originalPrice is provided
        let discount = 0
        if (validatedData.originalPrice && validatedData.originalPrice > price) {
            discount = Math.round(((validatedData.originalPrice - price) / validatedData.originalPrice) * 100)
        }

        const [newService] = await Service.create(
            [{
                name,
                slug,
                description,
                shortDescription: validatedData.shortDescription,
                price,
                originalPrice: validatedData.originalPrice,
                discount,
            category: categoryId,
            categoryName: categoryName || (categoryDoc?.name) || null,
            subcategory: subcategoryId,
            subcategoryName: subcategoryName || (subcategoryDoc?.name) || null,
                images,
                thumbnail,
                duration: {
                    value: duration.value,
                    unit: duration.unit
                },
                serviceType: serviceType || 'one-time',
                recurringInterval: (serviceType === 'recurring' || serviceType === 'subscription') ? recurringInterval : undefined,
                isAvailable: true,
                maxBookings: validatedData.maxBookings,
                currentBookings: 0,
                tags: validatedData.tags || [],
                requirements: validatedData.requirements || [],
                deliverables: validatedData.deliverables || [],
                features: validatedData.features || [],
                isActive: true,
                isFeatured: validatedData.isFeatured || false,
                seller: validatedData.seller,
                availability: validatedData.availability || {
                    monday: { start: "09:00", end: "18:00", isAvailable: true },
                    tuesday: { start: "09:00", end: "18:00", isAvailable: true },
                    wednesday: { start: "09:00", end: "18:00", isAvailable: true },
                    thursday: { start: "09:00", end: "18:00", isAvailable: true },
                    friday: { start: "09:00", end: "18:00", isAvailable: true },
                    saturday: { start: "09:00", end: "18:00", isAvailable: true },
                    sunday: { start: "09:00", end: "18:00", isAvailable: true }
                },
                seoTitle: validatedData.seoTitle,
                seoDescription: validatedData.seoDescription,
                seoKeywords: validatedData.seoKeywords || [],
                city: validatedData.city,
                status: validatedData.status || 'draft'
            }],
            { session }
        )

        await session.commitTransaction()

        return res.status(httpStatus.CREATED).json(
            buildResponse(httpStatus.CREATED, {
                message: "Service created successfully",
                service: newService
            })
        )
    } catch (err) {
        await session.abortTransaction()
        handleError(res, err)
    } finally {
        session.endSession()
    }
}

export const getAllServicesController = async (req, res) => {
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
            isAvailable,
            serviceType,
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

        if (isAvailable !== undefined) {
            filter.isAvailable = isAvailable === 'true' || isAvailable === true
        }

        if (serviceType) {
            filter.serviceType = serviceType
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
                    select: 'name slug'
                },
                {
                    path: 'subcategory',
                    select: 'name slug'
                },
                {
                    path: 'seller',
                    select: 'companyName email'
                }
            ],
            sort: sortOptions
        }

        const services = await Service.paginate(filter, options)

        // Return minimal common fields for listing (no category)
        const minimalDocs = services.docs.map((service) => {
            const createdDate = new Date(service.createdAt)
            const created = createdDate.toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            })
            return {
                _id: service._id,
                name: service.name,
                status: service.isActive ? 'Active' : 'Inactive',
                sellerName: service.seller?.companyName || 'N/A',
                created
            }
        })

        const response = {
            docs: minimalDocs,
            totalDocs: services.totalDocs,
            limit: services.limit,
            page: services.page,
            totalPages: services.totalPages,
            hasNextPage: services.hasNextPage,
            hasPrevPage: services.hasPrevPage,
            nextPage: services.nextPage,
            prevPage: services.prevPage,
            pagingCounter: services.pagingCounter
        }

        res.status(httpStatus.OK).json(buildResponse(httpStatus.OK, response))
    } catch (err) {
        handleError(res, err)
    }
}

export const toggleServiceStatusController = async (req, res) => {
    try {
        const validatedData = matchedData(req)
        const { serviceId, isActive } = validatedData

        const service = await Service.findById(serviceId)
        if (!service) {
            throw buildErrorObject(httpStatus.NOT_FOUND, 'Service not found')
        }

        if (service.isActive === isActive) {
            const status = isActive ? 'active' : 'inactive'
            throw buildErrorObject(httpStatus.BAD_REQUEST, `Service is already ${status}`)
        }

        service.isActive = isActive
        await service.save()

        const status = isActive ? 'activated' : 'deactivated'
        res.status(httpStatus.OK).json(
            buildResponse(httpStatus.OK, {
                message: `Service ${status} successfully`,
                service: {
                    _id: service._id,
                    name: service.name,
                    isActive: service.isActive
                }
            })
        )
    } catch (err) {
        handleError(res, err)
    }
}

export const getServiceInfoController = async (req, res) => {
    try {
        const validatedData = matchedData(req)
        const { serviceId } = validatedData

        const service = await Service.findById(serviceId)
            .populate('category', 'name slug')
            .populate('subcategory', 'name slug')
            .populate('seller', 'name email phone')
            .populate('reviews.user', 'name email')

        if (!service) {
            throw buildErrorObject(httpStatus.NOT_FOUND, 'Service not found')
        }

        // Ensure categoryName is included
        const serviceData = service.toObject()
        if (serviceData.category && !serviceData.categoryName) {
            serviceData.categoryName = serviceData.category.name
        }
        if (serviceData.subcategory && !serviceData.subcategoryName) {
            serviceData.subcategoryName = serviceData.subcategory.name
        }

        res.status(httpStatus.OK).json(buildResponse(httpStatus.OK, serviceData))
    } catch (err) {
        handleError(res, err)
    }
}

export const searchServicesController = async (req, res) => {
    try {
        const validatedData = matchedData(req)
        const { q, category, minPrice, maxPrice, serviceType, limit = 10 } = validatedData

        const filter = { isActive: true }

        if (q) {
            filter.$text = { $search: q }
        }

        if (category) {
            filter.category = mongoose.Types.ObjectId.createFromHexString(category)
        }

        if (serviceType) {
            filter.serviceType = serviceType
        }

        if (minPrice !== undefined || maxPrice !== undefined) {
            filter.price = {}
            if (minPrice !== undefined) filter.price.$gte = Number(minPrice)
            if (maxPrice !== undefined) filter.price.$lte = Number(maxPrice)
        }

        const services = await Service.find(filter)
            .populate('category', 'name slug')
            .select('name slug price thumbnail rating duration serviceType images')
            .limit(Number(limit))
            .sort({ score: { $meta: 'textScore' } })

        res.status(httpStatus.OK).json(buildResponse(httpStatus.OK, { services }))
    } catch (err) {
        handleError(res, err)
    }
}
