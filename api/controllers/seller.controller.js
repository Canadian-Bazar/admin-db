import { matchedData } from 'express-validator'
import Seller from '../models/seller.schema.js'
import buildResponse from '../utils/buildResponse.js'
import handleError from '../utils/handleError.js'
import httpStatus from 'http-status'
import buildErrorObject from '../utils/buildErrorObject.js'
import mongoose from 'mongoose'
import sendMail from '../helpers/sendMail.js'
import { createBuyerForSeller } from '../utils/internalBuyerClient.js'

/**
 * Get all sellers with pagination and filters
 */
export const getAllSellersController = async (req, res) => {
    try {
        const validatedData = matchedData(req);
        let { 
            page = 1, 
            limit = 10, 
            search, 
            email,
            phoneNumber,
            businessNumber,
            isVerified, 
            approvalStatus,
            city,
            state,
            isBlocked,
            sortBy = 'createdAt',
            sortOrder = 'desc'
        } = validatedData;

        limit = Math.min(Number(limit), 100);
        page = Number(page);

        const filter = {};

        // Search filter (searches in companyName, email, and businessNumber)
        if (search) {
            filter.$or = [
                { companyName: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } },
                { businessNumber: { $regex: search, $options: 'i' } }
            ];
        }

        // Specific field filters
        if (email) {
            filter.email = { $regex: email, $options: 'i' };
        }

        if (phoneNumber) {
            filter.phone = { $regex: phoneNumber, $options: 'i' };
        }

        if (businessNumber) {
            filter.businessNumber = { $regex: businessNumber, $options: 'i' };
        }

        if (isVerified !== undefined) {
            filter.isVerified = isVerified === 'true' || isVerified === true;
        }

        if (isBlocked !== undefined) {
            filter.isBlocked = isBlocked === 'true' || isBlocked === true;
        }

        if (approvalStatus && approvalStatus !== 'all') {
            filter.approvalStatus = approvalStatus;
        }

        if (city) {
            filter.city = { $regex: city, $options: 'i' };
        }

        if (state) {
            filter.state = { $regex: state, $options: 'i' };
        }

        // Sort options
        const sortOptions = {};
        sortOptions[sortBy] = sortOrder === 'asc' ? 1 : -1;

        const options = {
            page,
            limit,
            populate: [
                {
                    path: 'parentCategory',
                    select: 'name slug'
                },
                {
                    path: 'categories',
                    select: 'name slug'
                }
            ],
            sort: sortOptions,
            select: '-password' // Exclude password from results
        };

        const sellers = await Seller.paginate(filter, options);

        // Add additional statistics
        const stats = await Seller.aggregate([
            {
                $group: {
                    _id: null,
                    total: { $sum: 1 },
                    verified: { $sum: { $cond: ['$isVerified', 1, 0] } },
                    blocked: { $sum: { $cond: ['$isBlocked', 1, 0] } },
                    pending: { $sum: { $cond: [{ $eq: ['$approvalStatus', 'pending'] }, 1, 0] } },
                    approved: { $sum: { $cond: [{ $eq: ['$approvalStatus', 'approved'] }, 1, 0] } },
                    rejected: { $sum: { $cond: [{ $eq: ['$approvalStatus', 'rejected'] }, 1, 0] } }
                }
            }
        ]);

        const response = {
            ...sellers,
            stats: stats[0] || {
                total: 0,
                verified: 0,
                blocked: 0,
                pending: 0,
                approved: 0,
                rejected: 0
            }
        };

        res.status(httpStatus.OK).json(buildResponse(httpStatus.OK, response));
    } catch (err) {
        handleError(res, err);
    }
};

/**
 * Get seller by ID
 */
export const getSellerByIdController = async (req, res) => {
    try {
        const validatedData = matchedData(req);
        const { sellerId } = validatedData;

        const seller = await Seller.findById(sellerId)
            .populate('parentCategory', 'name slug')
            .populate('categories', 'name slug')
            .select('-password');

        if (!seller) {
            throw buildErrorObject(httpStatus.NOT_FOUND, 'Seller not found');
        }

        res.status(httpStatus.OK).json(buildResponse(httpStatus.OK, seller));
    } catch (err) {
        handleError(res, err);
    }
};

/**
 * Block a seller with reason and email notification
 */
export const blockSellerController = async (req, res) => {
    const session = await mongoose.startSession();

    try {
        await session.withTransaction(async () => {
            const validatedData = matchedData(req);
            const { sellerId, blockReason } = validatedData;

            const seller = await Seller.findById(sellerId).session(session);
            if (!seller) {
                throw buildErrorObject(httpStatus.NOT_FOUND, 'Seller not found');
            }

            if (seller.isBlocked) {
                throw buildErrorObject(httpStatus.BAD_REQUEST, 'Seller is already blocked');
            }

            // Update seller status
            seller.isBlocked = true;
            seller.blockReason = blockReason;
            await seller.save({ session });

            // Send email notification
            try {
                await sendMail(
                    seller.email,
                    'seller-blocked.ejs',
                    {
                        subject: 'Canadian Bazaar - Account Blocked',
                        companyName: seller.companyName,
                        blockReason: blockReason
                    }
                );
            } catch (emailError) {
                console.error('Failed to send blocking email:', emailError);
                // Don't throw error here - we still want the blocking to succeed
            }

            req.responseData = {
                message: 'Seller blocked successfully and notification email sent',
                seller: {
                    _id: seller._id,
                    companyName: seller.companyName,
                    email: seller.email,
                    isBlocked: seller.isBlocked,
                    blockReason: seller.blockReason
                }
            };
        });

        res.status(httpStatus.OK).json(
            buildResponse(httpStatus.OK, req.responseData)
        );

    } catch (err) {
        handleError(res, err);
    } finally {
        await session.endSession();
    }
};

/**
 * Unblock a seller
 */
export const unblockSellerController = async (req, res) => {
    const session = await mongoose.startSession();

    try {
        await session.withTransaction(async () => {
            const validatedData = matchedData(req);
            const { sellerId } = validatedData;

            const seller = await Seller.findById(sellerId).session(session);
            if (!seller) {
                throw buildErrorObject(httpStatus.NOT_FOUND, 'Seller not found');
            }

            if (!seller.isBlocked) {
                throw buildErrorObject(httpStatus.BAD_REQUEST, 'Seller is not blocked');
            }

            // Update seller status
            seller.isBlocked = false;
            seller.blockReason = undefined;
            await seller.save({ session });

            req.responseData = {
                message: 'Seller unblocked successfully',
                seller: {
                    _id: seller._id,
                    companyName: seller.companyName,
                    email: seller.email,
                    isBlocked: seller.isBlocked
                }
            };
        });

        res.status(httpStatus.OK).json(
            buildResponse(httpStatus.OK, req.responseData)
        );

    } catch (err) {
        handleError(res, err);
    } finally {
        await session.endSession();
    }
};

/**
 * Approve seller
 */
export const approveSellerController = async (req, res) => {
    const session = await mongoose.startSession();

    try {
        await session.withTransaction(async () => {
            const validatedData = matchedData(req);
            const { sellerId } = validatedData;

            const seller = await Seller.findById(sellerId).session(session);
            if (!seller) {
                throw buildErrorObject(httpStatus.NOT_FOUND, 'Seller not found');
            }

            if (seller.approvalStatus === 'approved') {
                throw buildErrorObject(httpStatus.BAD_REQUEST, 'Seller is already approved');
            }

            // Update seller status
            seller.approvalStatus = 'approved';
            seller.isVerified = true;
            await seller.save({ session });

            // Prepare buyer sync payload (fire-and-forget after commit)
            req._buyerSyncPayload = {
                fullName: seller.companyName,
                companyName: seller.companyName,
                email: seller.email,
                phone: seller.phone,
                passwordHash: seller.password,
                city: seller.city || 'NA',
                state: seller.state || 'NA',
            };

            // Send approval email notification
            try {
                const dashboardUrl = `${process.env.SELLER_FRONTEND_URL || 'https://seller.canadian-bazaar.ca'}/dashboard`;
                
                await sendMail(
                    seller.email,
                    'seller-approved.ejs',
                    {
                        subject: 'Canadian Bazaar - Account Approved! 🎉',
                        companyName: seller.companyName,
                        email: seller.email,
                        dashboardUrl: dashboardUrl
                    }
                );
            } catch (emailError) {
                console.error('Failed to send seller approval email:', emailError);
                // Don't throw error here - we still want the approval to succeed
            }

            req.responseData = {
                message: 'Seller approved successfully and notification email sent',
                seller: {
                    _id: seller._id,
                    companyName: seller.companyName,
                    email: seller.email,
                    approvalStatus: seller.approvalStatus,
                    isVerified: seller.isVerified
                }
            };
        });

        // Trigger buyer account creation in buyer service (non-blocking)
        try {
            const buyerServiceUrl = process.env.BUYER_SERVICE_URL;
            const sharedSecret = process.env.INTERNAL_SHARED_SECRET;
            if (buyerServiceUrl && sharedSecret && req._buyerSyncPayload) {
                // Do not await; log in debug mode via client
                void createBuyerForSeller({
                    buyerServiceUrl,
                    sharedSecret,
                    payload: req._buyerSyncPayload,
                });
            }
        } catch (_e) {
            // Swallow errors - approval should still succeed
        }

        res.status(httpStatus.OK).json(
            buildResponse(httpStatus.OK, req.responseData)
        );

    } catch (err) {
        handleError(res, err);
    } finally {
        await session.endSession();
    }
};

/**
 * Reject seller with reason and email notification
 */
export const rejectSellerController = async (req, res) => {
    const session = await mongoose.startSession();

    try {
        await session.withTransaction(async () => {
            const validatedData = matchedData(req);
            const { sellerId, rejectionReason } = validatedData;

            const seller = await Seller.findById(sellerId).session(session);
            if (!seller) {
                throw buildErrorObject(httpStatus.NOT_FOUND, 'Seller not found');
            }

            if (seller.approvalStatus === 'rejected') {
                throw buildErrorObject(httpStatus.BAD_REQUEST, 'Seller is already rejected');
            }

            // Update seller status
            seller.approvalStatus = 'rejected';
            seller.isVerified = false;
            await seller.save({ session });

            // Send email notification
            try {
                await sendMail(
                    seller.email,
                    'seller-rejected.ejs',
                    {
                        subject: 'Canadian Bazaar - Application Rejected',
                        companyName: seller.companyName,
                        rejectionReason: rejectionReason
                    }
                );
            } catch (emailError) {
                console.error('Failed to send rejection email:', emailError);
                // Don't throw error here - we still want the rejection to succeed
            }

            req.responseData = {
                message: 'Seller rejected successfully and notification email sent',
                seller: {
                    _id: seller._id,
                    companyName: seller.companyName,
                    email: seller.email,
                    approvalStatus: seller.approvalStatus,
                    isVerified: seller.isVerified
                }
            };
        });

        res.status(httpStatus.OK).json(
            buildResponse(httpStatus.OK, req.responseData)
        );

    } catch (err) {
        handleError(res, err);
    } finally {
        await session.endSession();
    }
};

/**
 * Get sellers by approval status (pending, approved, rejected)
 */
export const getSellersByStatusController = async (req, res) => {
    try {
        const validatedData = matchedData(req);
        let { 
            status,
            page = 1, 
            limit = 10,
            search,
            sortBy = 'createdAt',
            sortOrder = 'desc'
        } = validatedData;

        limit = Math.min(Number(limit), 100);
        page = Number(page);

        const filter = { approvalStatus: status };

        if (search) {
            filter.$or = [
                { companyName: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } },
                { businessNumber: { $regex: search, $options: 'i' } }
            ];
        }

        const sortOptions = {};
        sortOptions[sortBy] = sortOrder === 'asc' ? 1 : -1;

        const options = {
            page,
            limit,
            populate: [
                {
                    path: 'parentCategory',
                    select: 'name slug'
                },
                {
                    path: 'categories',
                    select: 'name slug'
                }
            ],
            sort: sortOptions,
            select: '-password'
        };

        const sellers = await Seller.paginate(filter, options);

        res.status(httpStatus.OK).json(buildResponse(httpStatus.OK, sellers));
    } catch (err) {
        handleError(res, err);
    }
};

/**
 * Get seller statistics
 */
export const getSellerStatsController = async (req, res) => {
    try {
        const stats = await Seller.aggregate([
            {
                $group: {
                    _id: null,
                    totalSellers: { $sum: 1 },
                    verifiedSellers: { $sum: { $cond: ['$isVerified', 1, 0] } },
                    blockedSellers: { $sum: { $cond: ['$isBlocked', 1, 0] } },
                    pendingSellers: { $sum: { $cond: [{ $eq: ['$approvalStatus', 'pending'] }, 1, 0] } },
                    approvedSellers: { $sum: { $cond: [{ $eq: ['$approvalStatus', 'approved'] }, 1, 0] } },
                    rejectedSellers: { $sum: { $cond: [{ $eq: ['$approvalStatus', 'rejected'] }, 1, 0] } },
                    profileCompleteSellers: { $sum: { $cond: ['$isProfileComplete', 1, 0] } }
                }
            }
        ]);

        // Get sellers by city stats
        const cityStats = await Seller.aggregate([
            {
                $match: { city: { $exists: true, $ne: '' } }
            },
            {
                $group: {
                    _id: '$city',
                    count: { $sum: 1 }
                }
            },
            {
                $sort: { count: -1 }
            },
            {
                $limit: 10
            }
        ]);

        // Get sellers by state stats
        const stateStats = await Seller.aggregate([
            {
                $match: { state: { $exists: true, $ne: '' } }
            },
            {
                $group: {
                    _id: '$state',
                    count: { $sum: 1 }
                }
            },
            {
                $sort: { count: -1 }
            }
        ]);

        const response = {
            overview: stats[0] || {
                totalSellers: 0,
                verifiedSellers: 0,
                blockedSellers: 0,
                pendingSellers: 0,
                approvedSellers: 0,
                rejectedSellers: 0,
                profileCompleteSellers: 0
            },
            topCities: cityStats,
            stateDistribution: stateStats
        };

        res.status(httpStatus.OK).json(buildResponse(httpStatus.OK, response));
    } catch (err) {
        handleError(res, err);
    }
};