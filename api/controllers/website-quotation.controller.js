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
import Seller from '../models/seller.schema.js'
import SellerSubscription from '../models/seller-subscription.schema.js'


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
  const session = await mongoose.startSession();
  let isTransactionCommitted = false;

  try {
    session.startTransaction();

    const validatedData = matchedData(req);
    const { documentation, websiteQuotationId, pricingPlans } = validatedData;

    const websiteQuotationExists = await WebsiteQuotation.findById(websiteQuotationId).session(session);
    if (!websiteQuotationExists) {
      throw buildErrorObject(httpStatus.BAD_REQUEST, 'Invalid Website Quotation ID');
    }


    if(websiteQuotationExists.status==='approved'){
      throw buildErrorObject(httpStatus.BAD_REQUEST, 'Quotation already approved');
    }

    websiteQuotationExists.status = 'approved';

    const sellerId = websiteQuotationExists.seller;


    const sellerExists = await Seller.findById(sellerId).session(session);
    if (!sellerExists){
      throw buildErrorObject(httpStatus.BAD_REQUEST, 'Invalid Seller ID');
    }

    

    const activeSellerSubscription = await SellerSubscription.findOne({
      seller: sellerId,
      status: 'active',
      startDate: { $lte: new Date() },
      endDate: { $gte: new Date() }
    }).populate('planVersionId').session(session);

    const hasActivePaidSubscription = activeSellerSubscription && 
      activeSellerSubscription.planVersionId && 
      (activeSellerSubscription.planVersionId.pricing.monthly > 0 || 
       activeSellerSubscription.planVersionId.pricing.quarterly > 0 || 
       activeSellerSubscription.planVersionId.pricing.yearly > 0);

    const processedPricingPlans = await Promise.all(pricingPlans?.map(async (plan) => {
      let subscriptionPrice = 0;
      
      if (plan.subscriptionPlanVersionId && !hasActivePaidSubscription) {
        const planVersion = await SubscriptionPlanVersion.findById(plan.subscriptionPlanVersionId).session(session);
        if (planVersion) {
          subscriptionPrice = planVersion.pricing.monthly || 0;
        }
      }

      return {
        planName: plan.planName,
        subscriptionPlanVersionId: plan.subscriptionPlanVersionId || null,
        subscriptionPrice: hasActivePaidSubscription ? 0 : subscriptionPrice,
        sitePrice: plan.sitePrice,
        totalPrice: plan.sitePrice + (hasActivePaidSubscription ? 0 : subscriptionPrice),
        status: 'pending',
        isActive: true
      };
    }) || []);

    const token = generateWebsiteDocumentationToken('temp');

    const websiteDocumentation = new WebsiteDocumentation({
      documentation,
      websiteQuotationId,
      pricingPlans: processedPricingPlans,
      token
    });

    await websiteDocumentation.save({ session });

    const finalToken = generateWebsiteDocumentationToken(websiteDocumentation._id);
    
    await WebsiteDocumentation.findByIdAndUpdate(
      websiteDocumentation._id,
      { token: finalToken },
      { session }
    );


    await websiteQuotationExists.save({ session });


    await session.commitTransaction();


    


    sendMail(sellerExists.email, 'quotation-accepted.ejs', {
      token:finalToken,
      subject: 'Documentation',
      frontendURL: process.env.FRONTEND_URL,
    })
    isTransactionCommitted = true;

    return res.status(httpStatus.CREATED).json(buildResponse(httpStatus.CREATED,
      'Website documentation created successfully', { 
        token: finalToken,
        documentationId: websiteDocumentation._id 
      }
    ));

  } catch (err) {
    if (!isTransactionCommitted) {
      await session.abortTransaction();
    }
    handleError(res, err);
  } finally {
    session.endSession();
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