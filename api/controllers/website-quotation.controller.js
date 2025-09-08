import { matchedData } from 'express-validator'
import httpStatus from 'http-status'
import WebsiteQuotation from '../models/website-quotation.schema.js'
import WebsiteDocumentation from '../models/website-documentation.schema.js'
import WebsiteProject from '../models/website-project.schema.js'
import SubscriptionPlanTemplate from '../models/subsciption-plan-template.schema.js'
import SubscriptionPlanVersion from '../models/subscription-plan-version.schema.js'
import buildErrorObject from '../utils/buildErrorObject.js'
import buildResponse from '../utils/buildResponse.js'
import handleError from '../utils/handleError.js'
import mongoose from 'mongoose'
import jwt from 'jsonwebtoken'
import sendMail from '../helpers/sendMail.js'

export const generateWebsiteDocumentationToken = (id) => {
  return jwt.sign({ documentationId: id },
    process.env.DOCUMENTATION_SECRET,
    {
      expiresIn: '30d'
    }
  )
}



/**
 * Get all website quotations (for admin)
 */
export const getAllWebsiteQuotationsController = async (req, res) => {
  try {
    const validatedData = matchedData(req)
    let {
      page = 1,
      limit = 10,
      status,
      seller,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = validatedData
    
    limit = Math.min(Number(limit), 100)
    page = Number(page)
    
    const filter = {}
    
    if (status) {
      filter.status = status
    }
    
    if (seller) {
      filter.seller = seller
    }
    
    const sortOptions = {}
    sortOptions[sortBy] = sortOrder === 'asc' ? 1 : -1
    
    const quotations = await WebsiteQuotation.find(filter)
      .populate('seller', 'companyName email phone')
      .populate('category', 'name')
      .populate('referenceWebTemplates', 'name')
      .sort(sortOptions)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .exec()
    
    const total = await WebsiteQuotation.countDocuments(filter)
    
    const response = {
      quotations,
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
 * Accept a website quotation (admin only)
 */
export const acceptWebsiteQuotationController = async (req, res) => {
  const session = await mongoose.startSession()
  
  try {
    await session.withTransaction(async () => {
      const { quotationId } = req.params
      
      const {
        message = 'Your website quotation has been accepted',
        documentation = `Website documentation for the requested project`,
        sitePrice = 1000,
        selectedPlans = [] 
      } = req.body
      
      console.log('Received data:', req.body)
      console.log('Selected plans:', selectedPlans)
      
      const quotation = await WebsiteQuotation.findById(quotationId).session(session)
      if (!quotation) {
        throw buildErrorObject(httpStatus.NOT_FOUND, 'Quotation not found')
      }


    console.log("quotation" , quotation)
      
      if (quotation.status !== 'pending') {
        throw buildErrorObject(httpStatus.BAD_REQUEST, 'Quotation already processed')
      }
      
      // Update quotation status
      quotation.status = 'approved'
      await quotation.save({ session })
      
      // Create pricing plans using existing subscription plan templates
      const pricingPlans = [
        {
          planName: 'Site Only',
          sitePrice: Number(sitePrice),
          subscriptionPrice: 0,
          totalPrice: Number(sitePrice),
          isActive: true,
          selected: false
        }
      ]
      
      // Add selected subscription plans
      for (const plan of selectedPlans) {
        const { templateId, versionId, price, planName } = plan
        
        // For now, if template/version IDs are temporary, just create the plan without subscription version ID
        // TODO: Update this when real template selection is implemented
        if (templateId.startsWith('temp-') || versionId.startsWith('temp-')) {
          pricingPlans.push({
            planName: planName || 'Subscription Plan',
            // subscriptionPlanVersionId: null, // No reference for temporary plans
            sitePrice: Number(sitePrice),
            subscriptionPrice: Number(price),
            totalPrice: Number(sitePrice) + Number(price),
            isActive: true,
            selected: false
          })
        } else {
          // Verify the subscription plan version exists for real IDs
          const versionDoc = await SubscriptionPlanVersion.findById(versionId).session(session)
          if (versionDoc && versionDoc.templateId.toString() === templateId) {
            pricingPlans.push({
              planName: planName || `Site + ${versionDoc.templateId.name}`,
              subscriptionPlanVersionId: versionDoc._id,
              sitePrice: Number(sitePrice),
              subscriptionPrice: Number(price),
              totalPrice: Number(sitePrice) + Number(price),
              isActive: true,
              selected: false
            })
          }
        }
      }
      
      const tempToken = generateWebsiteDocumentationToken('temp')
      
      // Create website documentation with admin-specified pricing
      const websiteDocumentation = new WebsiteDocumentation({
        websiteQuotationId: quotation._id,
        documentation: documentation || `Website documentation for ${quotation.domainName}`,
        pricingPlans,
        token: tempToken,
        status: 'pending'
      })
      
      await websiteDocumentation.save({ session })


      console.log("websiteDocumentation" , websiteDocumentation)

      const finalToken = generateWebsiteDocumentationToken(websiteDocumentation._id)
    
      await WebsiteDocumentation.findByIdAndUpdate(
        websiteDocumentation._id,
        { token: finalToken },
        { session }
      )
      
      req.responseData = {
        message: message || 'Quotation accepted and documentation created with custom pricing',
        quotation,
        documentation: websiteDocumentation,
        token: finalToken
      }
    })
    
    res.status(httpStatus.OK).json(
      buildResponse(httpStatus.OK, req.responseData)
    )
    
  } catch (err) {
    handleError(res, err)
  } finally {
    await session.endSession()
  }
}

/**
 * Reject a website quotation (admin only)
 */
export const rejectWebsiteQuotationController = async (req, res) => {
  try {


    const validatedData = matchedData(req)
    const { quotationId } = validatedData
    const { rejectionReason } = validatedData


    console.log("quoattion ,m " , quotationId)

    
    
    const quotation = await WebsiteQuotation.findById(quotationId).populate('seller', 'companyName email phone')

    console.log("quotation" , quotation)
    if (!quotation) {
      throw buildErrorObject(httpStatus.NOT_FOUND, 'Quotation not found')
    }
    
    if (quotation.status !== 'pending') {
      throw buildErrorObject(httpStatus.BAD_REQUEST, 'Quotation already processed')
    }
    
    quotation.status = 'rejected'
    quotation.rejectionReason = rejectionReason



    await quotation.save()



    sendMail(
      quotation.seller.email ,
      'quotation-rejected.ejs' ,
      {
        subject:'Website Quotation Rejected' ,
        rejectionReason:rejectionReason
      }


    )
    
    res.status(httpStatus.OK).json(
      buildResponse(httpStatus.OK, {
        message: 'Quotation rejected successfully',
        quotation
      })
    )
  } catch (err) {
    handleError(res, err)
  }
}