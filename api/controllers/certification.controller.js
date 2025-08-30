import { matchedData } from 'express-validator'
import Certifications from '../models/certifications.schema.js'
import buildResponse from '../utils/buildResponse.js'
import handleError from '../utils/handleError.js'
import httpStatus from 'http-status'
import buildErrorObject from '../utils/buildErrorObject.js'
import mongoose from 'mongoose'

/**
 * Create a new certification
 */
export const createCertificationController = async (req, res) => {
    const session = await mongoose.startSession();

    try {
        await session.withTransaction(async () => {
            const validatedData = matchedData(req);
            const { name } = validatedData;

            // Check if certification with same name already exists (case-insensitive)
            const existingCertification = await Certifications.findOne({
                name: { $regex: new RegExp(`^${name}$`, 'i') },
                isDeleted: false
            }).session(session);

            if (existingCertification) {
                throw buildErrorObject(httpStatus.CONFLICT, 'A certification with this name already exists');
            }

            const [newCertification] = await Certifications.create(
                [{
                    name: name.trim(),
                    isActive: true,
                    isDeleted: false
                }],
                { session }
            );

            req.responseData = {
                message: 'Certification created successfully',
                certification: newCertification
            };
        });

        res.status(httpStatus.CREATED).json(
            buildResponse(httpStatus.CREATED, req.responseData)
        );

    } catch (err) {
        handleError(res, err);
    } finally {
        await session.endSession();
    }
};

/**
 * Get all certifications with pagination and filters
 */
export const getAllCertificationsController = async (req, res) => {
    try {
        const validatedData = matchedData(req);
        let { 
            page = 1, 
            limit = 10, 
            search, 
            isActive,
            includeDeleted = false,
            sortBy = 'createdAt',
            sortOrder = 'desc'
        } = validatedData;

        limit = Math.min(Number(limit), 100);
        page = Number(page);

        const filter = {};

        // Don't include deleted certifications unless explicitly requested
        if (!includeDeleted) {
            filter.isDeleted = false;
        }

        // Search filter
        if (search) {
            filter.name = { $regex: search, $options: 'i' };
        }

        // Active/Inactive filter
        if (isActive !== undefined) {
            filter.isActive = isActive === 'true' || isActive === true;
        }

        // Sort options
        const sortOptions = {};
        sortOptions[sortBy] = sortOrder === 'asc' ? 1 : -1;

        const options = {
            page,
            limit,
            sort: sortOptions
        };

        const certifications = await Certifications.paginate(filter, options);

        // Add statistics
        const stats = await Certifications.aggregate([
            {
                $match: { isDeleted: false }
            },
            {
                $group: {
                    _id: null,
                    total: { $sum: 1 },
                    active: { $sum: { $cond: ['$isActive', 1, 0] } },
                    inactive: { $sum: { $cond: ['$isActive', 0, 1] } }
                }
            }
        ]);

        const response = {
            ...certifications,
            stats: stats[0] || {
                total: 0,
                active: 0,
                inactive: 0
            }
        };

        res.status(httpStatus.OK).json(buildResponse(httpStatus.OK, response));
    } catch (err) {
        handleError(res, err);
    }
};

/**
 * Get certification by ID
 */
export const getCertificationByIdController = async (req, res) => {
    try {
        const validatedData = matchedData(req);
        const { certificationId } = validatedData;

        const certification = await Certifications.findOne({
            _id: certificationId,
            isDeleted: false
        });

        if (!certification) {
            throw buildErrorObject(httpStatus.NOT_FOUND, 'Certification not found');
        }

        res.status(httpStatus.OK).json(buildResponse(httpStatus.OK, certification));
    } catch (err) {
        handleError(res, err);
    }
};

/**
 * Update certification
 */
export const updateCertificationController = async (req, res) => {
    const session = await mongoose.startSession();

    try {
        await session.withTransaction(async () => {
            const validatedData = matchedData(req);
            const { certificationId, name } = validatedData;

            const certification = await Certifications.findOne({
                _id: certificationId,
                isDeleted: false
            }).session(session);

            if (!certification) {
                throw buildErrorObject(httpStatus.NOT_FOUND, 'Certification not found');
            }

            // Check if another certification with same name exists (case-insensitive)
            if (name && name.toLowerCase() !== certification.name.toLowerCase()) {
                const existingCertification = await Certifications.findOne({
                    name: { $regex: new RegExp(`^${name}$`, 'i') },
                    _id: { $ne: certificationId },
                    isDeleted: false
                }).session(session);

                if (existingCertification) {
                    throw buildErrorObject(httpStatus.CONFLICT, 'A certification with this name already exists');
                }
            }

            // Update fields
            if (name !== undefined) {
                certification.name = name.trim();
            }

            await certification.save({ session });

            req.responseData = {
                message: 'Certification updated successfully',
                certification
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
 * Soft delete certification
 */
export const deleteCertificationController = async (req, res) => {
    const session = await mongoose.startSession();

    try {
        await session.withTransaction(async () => {
            const validatedData = matchedData(req);
            const { certificationId } = validatedData;

            const certification = await Certifications.findOne({
                _id: certificationId,
                isDeleted: false
            }).session(session);

            if (!certification) {
                throw buildErrorObject(httpStatus.NOT_FOUND, 'Certification not found');
            }

            // Soft delete
            certification.isDeleted = true;
            certification.isActive = false; // Also deactivate when deleting
            await certification.save({ session });

            req.responseData = {
                message: 'Certification deleted successfully'
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
 * Restore deleted certification
 */
export const restoreCertificationController = async (req, res) => {
    const session = await mongoose.startSession();

    try {
        await session.withTransaction(async () => {
            const validatedData = matchedData(req);
            const { certificationId } = validatedData;

            const certification = await Certifications.findOne({
                _id: certificationId,
                isDeleted: true
            }).session(session);

            if (!certification) {
                throw buildErrorObject(httpStatus.NOT_FOUND, 'Deleted certification not found');
            }

            // Check if another active certification with same name exists
            const existingCertification = await Certifications.findOne({
                name: { $regex: new RegExp(`^${certification.name}$`, 'i') },
                _id: { $ne: certificationId },
                isDeleted: false
            }).session(session);

            if (existingCertification) {
                throw buildErrorObject(httpStatus.CONFLICT, 'A certification with this name already exists');
            }

            // Restore
            certification.isDeleted = false;
            certification.isActive = true; // Activate when restoring
            await certification.save({ session });

            req.responseData = {
                message: 'Certification restored successfully',
                certification
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
 * Activate certification
 */
export const activateCertificationController = async (req, res) => {
    const session = await mongoose.startSession();

    try {
        await session.withTransaction(async () => {
            const validatedData = matchedData(req);
            const { certificationId } = validatedData;

            const certification = await Certifications.findOne({
                _id: certificationId,
                isDeleted: false
            }).session(session);

            if (!certification) {
                throw buildErrorObject(httpStatus.NOT_FOUND, 'Certification not found');
            }

            if (certification.isActive) {
                throw buildErrorObject(httpStatus.BAD_REQUEST, 'Certification is already active');
            }

            certification.isActive = true;
            await certification.save({ session });

            req.responseData = {
                message: 'Certification activated successfully',
                certification
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
 * Deactivate certification
 */
export const deactivateCertificationController = async (req, res) => {
    const session = await mongoose.startSession();

    try {
        await session.withTransaction(async () => {
            const validatedData = matchedData(req);
            const { certificationId } = validatedData;

            const certification = await Certifications.findOne({
                _id: certificationId,
                isDeleted: false
            }).session(session);

            if (!certification) {
                throw buildErrorObject(httpStatus.NOT_FOUND, 'Certification not found');
            }

            if (!certification.isActive) {
                throw buildErrorObject(httpStatus.BAD_REQUEST, 'Certification is already inactive');
            }

            certification.isActive = false;
            await certification.save({ session });

            req.responseData = {
                message: 'Certification deactivated successfully',
                certification
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
 * Get certification statistics
 */
export const getCertificationStatsController = async (req, res) => {
    try {
        const stats = await Certifications.aggregate([
            {
                $group: {
                    _id: null,
                    totalCertifications: { $sum: 1 },
                    activeCertifications: { $sum: { $cond: [{ $and: ['$isActive', { $eq: ['$isDeleted', false] }] }, 1, 0] } },
                    inactiveCertifications: { $sum: { $cond: [{ $and: [{ $eq: ['$isActive', false] }, { $eq: ['$isDeleted', false] }] }, 1, 0] } },
                    deletedCertifications: { $sum: { $cond: ['$isDeleted', 1, 0] } }
                }
            }
        ]);

        // Get certifications created per month for the last 6 months
        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

        const monthlyStats = await Certifications.aggregate([
            {
                $match: {
                    createdAt: { $gte: sixMonthsAgo },
                    isDeleted: false
                }
            },
            {
                $group: {
                    _id: {
                        year: { $year: '$createdAt' },
                        month: { $month: '$createdAt' }
                    },
                    count: { $sum: 1 }
                }
            },
            {
                $sort: { '_id.year': 1, '_id.month': 1 }
            }
        ]);

        const response = {
            overview: stats[0] || {
                totalCertifications: 0,
                activeCertifications: 0,
                inactiveCertifications: 0,
                deletedCertifications: 0
            },
            monthlyCreation: monthlyStats
        };

        res.status(httpStatus.OK).json(buildResponse(httpStatus.OK, response));
    } catch (err) {
        handleError(res, err);
    }
};

/**
 * Bulk operations for certifications
 */
export const bulkCertificationOperationController = async (req, res) => {
    const session = await mongoose.startSession();

    try {
        await session.withTransaction(async () => {
            const validatedData = matchedData(req);
            const { certificationIds, operation } = validatedData;

            const certifications = await Certifications.find({
                _id: { $in: certificationIds },
                isDeleted: false
            }).session(session);

            if (certifications.length === 0) {
                throw buildErrorObject(httpStatus.NOT_FOUND, 'No valid certifications found');
            }

            let updateOperation = {};
            let message = '';

            switch (operation) {
                case 'activate':
                    updateOperation = { isActive: true };
                    message = 'Certifications activated successfully';
                    break;
                case 'deactivate':
                    updateOperation = { isActive: false };
                    message = 'Certifications deactivated successfully';
                    break;
                case 'delete':
                    updateOperation = { isDeleted: true, isActive: false };
                    message = 'Certifications deleted successfully';
                    break;
                default:
                    throw buildErrorObject(httpStatus.BAD_REQUEST, 'Invalid operation');
            }

            await Certifications.updateMany(
                { _id: { $in: certificationIds }, isDeleted: false },
                updateOperation,
                { session }
            );

            req.responseData = {
                message,
                affectedCount: certifications.length
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