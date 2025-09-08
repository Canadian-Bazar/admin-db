import { matchedData } from 'express-validator'
import httpStatus from 'http-status'
import WebsiteProject from '../models/website-project.schema.js'
import WebsiteQuotation from '../models/website-quotation.schema.js'
import WebsiteDocumentation from '../models/website-documentation.schema.js'
import buildErrorObject from '../utils/buildErrorObject.js'
import buildResponse from '../utils/buildResponse.js'
import handleError from '../utils/handleError.js'
import mongoose from 'mongoose'
import crypto from 'crypto'
import { validate } from 'node-cron';

/**
 * Get all website projects (for admin)
 */
export const getAllWebsiteProjectsController = async (req, res) => {
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
      filter.projectStatus = status
    }
    
    if (seller) {
      filter.seller = seller
    }
    
    const sortOptions = {}
    sortOptions[sortBy] = sortOrder === 'asc' ? 1 : -1
    
    const projects = await WebsiteProject.find(filter)
      .populate('seller', 'companyName email phone')
      .populate('websiteQuotation', 'domainName itemsSold')
      .populate('websiteDocumentation')
      .select('projectStatus paymentStatus projectStartDate expectedCompletionDate actualCompletionDate percentageCompletion report additionalDetails report2 websiteOverviewLink completionPaymentToken finalPaymentCompleted notes amountPaid amountPending selectedPlan createdAt updatedAt')
      .sort(sortOptions)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .exec()
    
    const total = await WebsiteProject.countDocuments(filter)
    
    const response = {
      projects,
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
 * Get seller's website projects
 */
export const getSellerWebsiteProjectsController = async (req, res) => {
  try {
    const sellerId = req.user._id
    
    const projects = await WebsiteProject.find({ seller: sellerId })
      .populate('websiteQuotation', 'domainName itemsSold')
      .populate('websiteDocumentation')
      .sort({ createdAt: -1 })
      .exec()
    
    res.status(httpStatus.OK).json(buildResponse(httpStatus.OK, projects))
  } catch (err) {
    handleError(res, err)
  }
}

/**
 * Update website project (admin only)
 */
export const updateWebsiteProjectController = async (req, res) => {
  try {
    const { projectId } = req.params
    const updateData = req.body
    
    const project = await WebsiteProject.findById(projectId)
    if (!project) {
      throw buildErrorObject(httpStatus.NOT_FOUND, 'Project not found')
    }
    
    // Update project fields - exclude MongoDB internal fields and populated objects
    const excludeFields = ['_id', '__v', 'createdAt', 'updatedAt', 'seller', 'websiteQuotation', 'websiteDocumentation', 'transactionId']
    
    Object.keys(updateData).forEach(key => {
      if (updateData[key] !== undefined && !excludeFields.includes(key)) {
        project[key] = updateData[key]
      }
    })
    
    await project.save()
    
    const updatedProject = await WebsiteProject.findById(projectId)
      .populate('seller', 'companyName email phone')
      .populate('websiteQuotation', 'domainName itemsSold')
      .populate('websiteDocumentation')
    
    res.status(httpStatus.OK).json(
      buildResponse(httpStatus.OK, {
        message: 'Project updated successfully',
        project: updatedProject
      })
    )
  } catch (err) {
    handleError(res, err)
  }
}

/**
 * Update project status (admin only)
 */
export const updateProjectStatusController = async (req, res) => {
  try {
    const { projectId } = req.params
    const { status } = req.body
    
    const project = await WebsiteProject.findById(projectId)
    if (!project) {
      throw buildErrorObject(httpStatus.NOT_FOUND, 'Project not found')
    }
    
    project.projectStatus = status
    
    if (status === 'completed') {
      project.actualCompletionDate = new Date()
      project.percentageCompletion = 100
    }
    
    await project.save()
    
    res.status(httpStatus.OK).json(
      buildResponse(httpStatus.OK, {
        message: 'Project status updated successfully',
        project
      })
    )
  } catch (err) {
    handleError(res, err)
  }
}

/**
 * Update project progress (admin only)
 */
export const updateProjectProgressController = async (req, res) => {
  try {
    const { projectId } = req.params
    const { 
      percentage, 
      report, 
      additionalDetails, 
      report2, 
      websiteOverviewLink,
      projectStatus
    } = req.body
    
    const project = await WebsiteProject.findById(projectId)
    if (!project) {
      throw buildErrorObject(httpStatus.NOT_FOUND, 'Project not found')
    }
    
    // Update admin-only fields
    if (percentage !== undefined) project.percentageCompletion = percentage
    if (report !== undefined) project.report = report
    if (additionalDetails !== undefined) project.additionalDetails = additionalDetails
    if (report2 !== undefined) project.report2 = report2
    if (websiteOverviewLink !== undefined) project.websiteOverviewLink = websiteOverviewLink
    if (projectStatus !== undefined) project.projectStatus = projectStatus
    
    if (percentage === 100 && project.projectStatus !== 'completed') {
      project.projectStatus = 'completed'
      project.actualCompletionDate = new Date()
    }
    
    await project.save()
    
    res.status(httpStatus.OK).json(
      buildResponse(httpStatus.OK, {
        message: 'Project updated successfully',
        project
      })
    )
  } catch (err) {
    handleError(res, err)
  }
}

/**
 * Create project from approved documentation
 */
export const createProjectFromDocumentationController = async (req, res) => {
  const session = await mongoose.startSession()
  
  try {
    await session.withTransaction(async () => {
      const { documentationId, selectedPlan } = req.body
      
      const documentation = await WebsiteDocumentation.findById(documentationId)
        .populate('websiteQuotationId')
        .session(session)
      
      if (!documentation) {
        throw buildErrorObject(httpStatus.NOT_FOUND, 'Documentation not found')
      }
      
      if (documentation.status !== 'approved') {
        throw buildErrorObject(httpStatus.BAD_REQUEST, 'Documentation not approved')
      }
      
      // Check if project already exists
      const existingProject = await WebsiteProject.findOne({
        websiteDocumentation: documentationId
      }).session(session)
      
      if (existingProject) {
        throw buildErrorObject(httpStatus.BAD_REQUEST, 'Project already exists for this documentation')
      }
      
      // Create new project
      const project = new WebsiteProject({
        seller: documentation.websiteQuotationId.seller,
        websiteQuotation: documentation.websiteQuotationId._id,
        websiteDocumentation: documentation._id,
        selectedPlan,
        projectStatus: 'plan_selected',
        paymentStatus: 'pending',
        projectStartDate: new Date(),
        expectedCompletionDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
        percentageCompletion: 0,
        amountPaid: 0,
        amountPending: selectedPlan.totalPrice
      })
      
      await project.save({ session })
      
      req.responseData = {
        message: 'Project created successfully',
        project
      }
    })
    
    res.status(httpStatus.CREATED).json(
      buildResponse(httpStatus.CREATED, req.responseData)
    )
    
  } catch (err) {
    handleError(res, err)
  } finally {
    await session.endSession()
  }
}

/**
 * Complete project and generate final payment token
 */
export const completeProjectAndGeneratePaymentLinkController = async (req, res) => {
  try {

    const validatedData = matchedData(req)
    const { projectId } = validatedData
    
    const project = await WebsiteProject.findById(projectId)
      .populate('seller', 'companyName name email phone')
      .populate('websiteQuotation', 'domainName')
      .populate('selectedPlan.subscriptionPlanVersionId')
    
    if (!project) {
      throw buildErrorObject(httpStatus.NOT_FOUND, 'Project not found')
    }
    
    // Check if project can be completed
    if (!['in_progress', 'completed'].includes(project.projectStatus)) {
      throw buildErrorObject(httpStatus.BAD_REQUEST, 'Project must be in progress or completed to generate payment link')
    }
    
    if (!project.websiteOverviewLink) {
      throw buildErrorObject(httpStatus.BAD_REQUEST, 'Website overview link is required to complete project')
    }
    
    if (project.finalPaymentCompleted) {
      throw buildErrorObject(httpStatus.BAD_REQUEST, 'Final payment already completed')
    }
    
    // Generate unique completion payment token
    const completionToken = crypto.randomBytes(32).toString('hex')
    const tokenExpiry = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days expiry
    
    // Update project status and add completion token
    project.projectStatus = 'completed'
    project.percentageCompletion = 100
    project.actualCompletionDate = new Date()
    project.completionPaymentToken = completionToken
    project.completionPaymentTokenExpiry = tokenExpiry
    
    await project.save()
    
    // Generate completion payment URL for seller
    const completionPaymentUrl = `${process.env.SELLER_UI_BASE_URL || 'http://localhost:3000'}/complete-payment/${completionToken}`
    
    const response = {
      message: 'Project completed and payment link generated successfully',
      project: {
        _id: project._id,
        projectStatus: project.projectStatus,
        percentageCompletion: project.percentageCompletion,
        completionPaymentToken,
        completionPaymentUrl,
        tokenExpiry
      },
      seller: {
        name: project.seller?.companyName || project.seller?.name,
        email: project.seller?.email
      }
    }
    
    res.status(httpStatus.OK).json(buildResponse(httpStatus.OK, response))
  } catch (err) {
    handleError(res, err)
  }
}