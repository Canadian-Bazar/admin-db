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
import jwt from 'jsonwebtoken'
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
      sortOrder = 'desc',
      search
    } = validatedData

    limit = Math.min(Number(limit), 100)
    page = Number(page)

    const matchStage = {}

    if (status) {
      // If specific status requested, show that status
      matchStage.projectStatus = status
    } else {
      // ➕ DEFAULT FILTER: Only show projects where 50% payment completed (exclude quotation phases)
      matchStage.projectStatus = { 
        $nin: ['quotation_submitted', 'quotation_raised'] 
      }
    }

    if (seller) {
      matchStage.seller = seller
    }

    const pipeline = [
      { $match: matchStage },
      {
        $lookup: {
          from: 'Sellers',
          localField: 'seller',
          foreignField: '_id',
          as: 'seller'
        }
      },
      { $unwind: { path: '$seller', preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: 'WebsiteQuotation',
          localField: 'websiteQuotation',
          foreignField: '_id',
          as: 'websiteQuotation'
        }
      },
      { $unwind: { path: '$websiteQuotation', preserveNullAndEmptyArrays: true } },
    ]

    if (search) {
      pipeline.push({
        $match: {
          $or: [
            { 'seller.companyName': { $regex: search, $options: 'i' } },
            { 'seller.email': { $regex: search, $options: 'i' } },
            { 'seller.phone': { $regex: search, $options: 'i' } }
          ]
        }
      })
    }

    pipeline.push({ $sort: { [sortBy]: sortOrder === 'asc' ? 1 : -1 } })
    pipeline.push({ $skip: (page - 1) * limit })
    pipeline.push({ $limit: limit })
    
    // LIMITED DETAILS for getAll
    pipeline.push({
      $project: {
        _id: 1,
        percentageCompletion: 1,
        paymentStatus: 1,
        projectStatus: 1,
        createdAt: 1,
        hasPaymentLink: 1,
        linkExpiry: 1,
        finalPaymentCompleted: 1,
        'seller.companyName': 1,
        'seller.email': 1,
        'seller.phone': 1,
        'websiteQuotation.domainName': 1,
      }
    })

    const projects = await WebsiteProject.aggregate(pipeline)

    const countPipeline = [
      { $match: matchStage },
      {
        $lookup: {
          from: 'Sellers',
          localField: 'seller',
          foreignField: '_id',
          as: 'seller'
        }
      },
      { $unwind: { path: '$seller', preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: 'WebsiteQuotation',
          localField: 'websiteQuotation',
          foreignField: '_id',
          as: 'websiteQuotation'
        }
      },
      { $unwind: { path: '$websiteQuotation', preserveNullAndEmptyArrays: true } },
    ]

    if (search) {
      countPipeline.push({
        $match: {
          $or: [
            { 'seller.companyName': { $regex: search, $options: 'i' } },
            { 'seller.email': { $regex: search, $options: 'i' } },
            { 'seller.phone': { $regex: search, $options: 'i' } }
          ]
        }
      })
    }

    countPipeline.push({ $count: 'total' })
    const countResult = await WebsiteProject.aggregate(countPipeline)
    const total = countResult[0]?.total || 0

    const response = {
      docs: projects,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total,
      hasNext: page * limit < total,
      hasPrev: page > 1,
    }

    res.status(httpStatus.OK).json(buildResponse(httpStatus.OK, response))
  } catch (err) {
    handleError(res, err)
  }
}

export const getProjectByIdController = async (req, res) => {
  try {
    const { id } = req.params

    // Validate if ID is provided
    if (!id) {
      return res.status(httpStatus.BAD_REQUEST).json(
        buildResponse(httpStatus.BAD_REQUEST, null, 'Project ID is required')
      )
    }

    const pipeline = [
      { $match: { _id: new mongoose.Types.ObjectId(id) } },
      {
        $lookup: {
          from: 'Sellers',
          localField: 'seller',
          foreignField: '_id',
          as: 'seller'
        }
      },
      { $unwind: { path: '$seller', preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: 'WebsiteQuotation',
          localField: 'websiteQuotation',
          foreignField: '_id',
          as: 'websiteQuotation'
        }
      },
      { $unwind: { path: '$websiteQuotation', preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: 'WebsiteDocumentation',
          localField: 'websiteDocumentation',
          foreignField: '_id',
          as: 'websiteDocumentation'
        }
      },
      { $unwind: { path: '$websiteDocumentation', preserveNullAndEmptyArrays: true } },
      {
        $project: {
          _id: 1,
          projectStatus: 1,
          paymentStatus: 1,
          projectStartDate: 1,
          expectedCompletionDate: 1,
          actualCompletionDate: 1,
          percentageCompletion: 1,
          report: 1,
          additionalDetails: 1,
          report2: 1,
          anyChanges: 1,
          additionalSuggestions: 1,
          websiteOverviewLink: 1,
          completionPaymentToken: 1,
          finalPaymentCompleted: 1,
          hasPaymentLink: 1,
          linkExpiry: 1,
          notes: 1,
          amountPaid: 1,
          amountPending: 1,
          selectedPlan: 1,
          transactionId: 1,
          createdAt: 1,
          updatedAt: 1,
          'seller._id': 1,
          'seller.companyName': 1,
          'seller.email': 1,
          'seller.phone': 1,
          'websiteQuotation._id': 1,
          'websiteQuotation.domainName': 1,
          'websiteQuotation.itemsSold': 1,
          'websiteDocumentation._id': 1,
          'websiteDocumentation.documentation': 1,
          'websiteDocumentation.pricingPlans': 1,
          'websiteDocumentation.status': 1 ,
          
          
        }
      }
    ]

    const project = await WebsiteProject.aggregate(pipeline)

    if (!project || project.length === 0) {
      return res.status(httpStatus.NOT_FOUND).json(
        buildResponse(httpStatus.NOT_FOUND, null, 'Project not found')
      )
    }

    res.status(httpStatus.OK).json(buildResponse(httpStatus.OK, project[0]))
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
      .select('projectStatus paymentStatus projectStartDate expectedCompletionDate actualCompletionDate percentageCompletion report additionalDetails report2 anyChanges additionalSuggestions websiteOverviewLink notes amountPaid amountPending selectedPlan transactionId completionPaymentToken completionPaymentTokenExpiry finalPaymentCompleted createdAt updatedAt')
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
    const validatedData = matchedData(req)
    const { projectId } = validatedData
    const updateData = validatedData
    
    const project = await WebsiteProject.findById(projectId)
    if (!project) {
      throw buildErrorObject(httpStatus.NOT_FOUND, 'Project not found')
    }
    
    // Store previous values to check for changes
    const previousPercentageCompletion = project.percentageCompletion
    const previousProjectStatus = project.projectStatus
    
    // Update project fields - exclude MongoDB internal fields and populated objects
    const excludeFields = ['_id', '__v', 'createdAt', 'updatedAt', 'seller', 'websiteQuotation', 'websiteDocumentation', 'transactionId']
    
    Object.keys(updateData).forEach(key => {
      if (updateData[key] !== undefined && !excludeFields.includes(key)) {
        // Special handling for actualCompletionDate - only allow if percentageCompletion is 100%
        if (key === 'actualCompletionDate') {
          if (updateData.percentageCompletion === 100 || (updateData.percentageCompletion === undefined && project.percentageCompletion === 100)) {
            project[key] = updateData[key]
          }
        } else {
          project[key] = updateData[key]
        }
      }
    })
    
    // Auto-set status and actualCompletionDate when percentageCompletion changes to 100%
    if (updateData.percentageCompletion === 100 && previousPercentageCompletion !== 100) {
      project.projectStatus = 'completed'
      project.actualCompletionDate = new Date()
    }
    
    // Remove payment link if percentageCompletion drops below 100%
    if (updateData.percentageCompletion !== undefined && updateData.percentageCompletion !== 100 && previousPercentageCompletion === 100) {
      project.actualCompletionDate = null
      project.completionPaymentToken = null
      project.hasPaymentLink = false
      project.linkExpiry = null
      if (previousProjectStatus === 'completed') {
        project.projectStatus = 'in_progress'
      }
    }
    
    // If status is set to completed, ensure percentageCompletion is 100%
    if (updateData.projectStatus === 'completed' && previousProjectStatus !== 'completed') {
      project.percentageCompletion = 100
      if (!project.actualCompletionDate) {
        project.actualCompletionDate = new Date()
      }
    }
    
    // If status is changed from completed to something else, remove payment link
    if (updateData.projectStatus !== undefined && updateData.projectStatus !== 'completed' && previousProjectStatus === 'completed') {
      project.actualCompletionDate = null
      project.completionPaymentToken = null
      project.hasPaymentLink = false
      project.linkExpiry = null
    }
    
    await project.save()
    
    const updatedProject = await WebsiteProject.findById(projectId)
      .populate('seller', 'companyName email phone')
      .populate('websiteQuotation', 'domainName itemsSold')
      .populate('websiteDocumentation', 'documentation pricingPlans status')
    
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
    
    // Check if there's already a valid payment link
    if (project.hasPaymentLink && project.linkExpiry && project.linkExpiry > new Date()) {
      throw buildErrorObject(httpStatus.BAD_REQUEST, `Payment link already exists and is valid until ${project.linkExpiry.toISOString()}`)
    }
    
    const paymentTokenPayload = {
      projectId: project._id,
      sellerId: project.seller._id,
      type: 'final_payment'
    }
    const completionToken = jwt.sign(paymentTokenPayload, process.env.FINAL_PAYMENT_SECRET, { expiresIn: '7d' })
    const linkExpiry = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days expiry
    
    project.projectStatus = 'completed'
    project.percentageCompletion = 100
    project.actualCompletionDate = new Date()
    project.completionPaymentToken = completionToken
    project.hasPaymentLink = true
    project.linkExpiry = linkExpiry
    
    await project.save()
    
    const completionPaymentUrl = `${process.env.SELLER_UI_BASE_URL || 'http://localhost:3000'}/complete-payment/${completionToken}`
    
    const response = {
      message: 'Project completed and payment link generated successfully',
      project: {
        _id: project._id,
        projectStatus: project.projectStatus,
        percentageCompletion: project.percentageCompletion,
        completionPaymentToken: completionToken,
        completionPaymentUrl,
        linkExpiry
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