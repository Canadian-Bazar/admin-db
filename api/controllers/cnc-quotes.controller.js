import { matchedData } from 'express-validator'
import CNCQuote from '../models/cnc-quotes.schema.js'
import buildResponse from '../utils/buildResponse.js'
import handleError from '../utils/handleError.js'
import httpStatus from 'http-status'
import buildErrorObject from '../utils/buildErrorObject.js'

/**
 * Get all CNC quotes with pagination, search and filters
 */
export const getAllCNCQuotesController = async (req, res) => {
    try {
        const validatedData = matchedData(req)
        let { 
            page = 1, 
            limit = 10, 
            search,
            name,
            email,
            city,
            workType,
            budget,
            timeline,
            sortBy = 'createdAt',
            sortOrder = 'desc'
        } = validatedData

        limit = Math.min(Number(limit), 50)
        page = Number(page)

        const filter = {}

        // Search filter (searches in name, contact/email, and city)
        if (search) {
            filter.$or = [
                { name: { $regex: search, $options: 'i' } },
                { contact: { $regex: search, $options: 'i' } },
                { city: { $regex: search, $options: 'i' } }
            ]
        }

        // Specific field filters
        if (name) {
            filter.name = { $regex: name, $options: 'i' }
        }

        if (email) {
            filter.contact = { $regex: email, $options: 'i' }
        }

        if (city) {
            filter.city = { $regex: city, $options: 'i' }
        }

        if (workType) {
            filter.workType = { $regex: workType, $options: 'i' }
        }

        if (budget) {
            filter.budget = { $regex: budget, $options: 'i' }
        }

        if (timeline) {
            filter.timeline = { $regex: timeline, $options: 'i' }
        }

        // Sorting
        const sortOptions = {}
        sortOptions[sortBy] = sortOrder === 'asc' ? 1 : -1

        const options = {
            page,
            limit,
            sort: sortOptions
        }

        const quotes = await CNCQuote.paginate(filter, options)

        const response = {
            docs: quotes.docs,
            totalDocs: quotes.totalDocs,
            limit: quotes.limit,
            page: quotes.page,
            totalPages: quotes.totalPages,
            hasNextPage: quotes.hasNextPage,
            hasPrevPage: quotes.hasPrevPage,
            nextPage: quotes.nextPage,
            prevPage: quotes.prevPage,
            pagingCounter: quotes.pagingCounter
        }

        res.status(httpStatus.OK).json(buildResponse(httpStatus.OK, response))
    } catch (err) {
        handleError(res, err)
    }
}

/**
 * Get CNC quote by ID
 */
export const getCNCQuoteByIdController = async (req, res) => {
    try {
        const validatedData = matchedData(req)
        const { quoteId } = validatedData

        const quote = await CNCQuote.findById(quoteId)

        if (!quote) {
            throw buildErrorObject(httpStatus.NOT_FOUND, 'CNC Quote not found')
        }

        res.status(httpStatus.OK).json(buildResponse(httpStatus.OK, quote))
    } catch (err) {
        handleError(res, err)
    }
}