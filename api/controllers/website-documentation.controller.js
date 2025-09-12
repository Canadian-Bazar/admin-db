import { matchedData } from 'express-validator'
import httpStatus from 'http-status'
import WebsiteDocumentation from '../models/website-documentation.schema.js'
import WebsiteQuotation from '../models/website-quotation.schema.js'
import buildErrorObject from '../utils/buildErrorObject.js'
import buildResponse from '../utils/buildResponse.js'
import handleError from '../utils/handleError.js'

/**
 * Get all website documentation (for admin)
 */
export const getAllWebsiteDocumentationController = async (req, res) => {
  try {
    const validatedData = matchedData(req)
    let {
      page = 1,
      limit = 10,
      status,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = validatedData
    
    limit = Math.min(Number(limit), 100)
    page = Number(page)
    
    const filter = {}
    
    if (status) {
      filter.status = status
    }
    
    const sortOptions = {}
    sortOptions[sortBy] = sortOrder === 'asc' ? 1 : -1
    
    const documentation = await WebsiteDocumentation.find(filter)
      .populate({
        path: 'websiteQuotationId',
        populate: {
          path: 'seller',
          select: 'companyName email phone'
        }
      })
      .sort(sortOptions)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .exec()
    
    const total = await WebsiteDocumentation.countDocuments(filter)
    
    const response = {
      documentation,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    }
    
    res.status(httpStatus.OK).json(buildResponse(httpStatus.OK, response))
  } catch (err) {
    handleError(res, err)
  }
}

/**
 * Get website documentation by ID (for admin)
 */
export const getWebsiteDocumentationByIdController = async (req, res) => {
  try {
    const { id } = matchedData(req)
    
    const documentation = await WebsiteDocumentation.findById(id)
      .populate({
        path: 'websiteQuotationId',
        populate: {
          path: 'seller',
          select: 'companyName email phone'
        }
      })
      .populate('pricingPlans.subscriptionPlanVersionId')
    
    if (!documentation) {
      return res.status(httpStatus.NOT_FOUND).json(
        buildResponse(httpStatus.NOT_FOUND, 'Website documentation not found')
      )
    }
    
    res.status(httpStatus.OK).json(buildResponse(httpStatus.OK, documentation))
  } catch (err) {
    handleError(res, err)
  }
}

/**
 * Update website documentation (for admin)
 */
export const updateWebsiteDocumentationController = async (req, res) => {
  try {
    const validatedData = matchedData(req)
    const { id, documentation, pricingPlans, status } = validatedData
    
    const existingDoc = await WebsiteDocumentation.findById(id)
    if (!existingDoc) {
      return res.status(httpStatus.NOT_FOUND).json(
        buildResponse(httpStatus.NOT_FOUND, 'Website documentation not found')
      )
    }
    
    const updateData = {}
    
    if (documentation !== undefined) {
      updateData.documentation = documentation
    }
    
    if (pricingPlans !== undefined) {
      updateData.pricingPlans = pricingPlans
    }
    
    if (status !== undefined) {
      updateData.status = status
    }
    
    const updatedDoc = await WebsiteDocumentation.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    ).populate({
      path: 'websiteQuotationId',
      populate: {
        path: 'seller',
        select: 'companyName email phone'
      }
    })
    
    res.status(httpStatus.OK).json(
      buildResponse(httpStatus.OK, 'Website documentation updated successfully', updatedDoc)
    )
  } catch (err) {
    handleError(res, err)
  }
} 