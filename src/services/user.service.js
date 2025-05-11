import { BadRequestError, NotFoundError } from '../errors/customError.js';
import { ReasonPhrases, StatusCodes } from 'http-status-codes';
import customResponse from '../helpers/response.js';
import APIQuery from '../utils/APIQuery.js';
import User from '../models/user.js';
import bcrypt from 'bcryptjs';
import { removeUploadedFile, uploadSingleFile } from '../utils/upload.js';
import { clientRequiredFields } from '../helpers/filterRequiredClient.js';

// Helper function to create standard responses
const createSuccessResponse = (res, data = null) => {
    return res.status(StatusCodes.OK).json(
        customResponse({
            data,
            message: ReasonPhrases.OK,
            status: StatusCodes.OK,
            success: true,
        })
    );
};

// GET: Get all users
export const getAllUsers = async (req, res) => {
    try {
        const page = Number(req.query.page) || 1;
        const limit = Number(req.query.limit) || 10;

        const features = new APIQuery(User.find({role:'user'}).select('-password'), req.query);
        features.filter().sort().limitFields().search().paginate();

        const [users, totalDocs] = await Promise.all([features.query, features.count()]);
        const totalPages = Math.ceil(totalDocs / limit);

        return createSuccessResponse(res, {
            users,
            page,
            totalDocs,
            totalPages,
        });
    } catch (error) {
        next(error);
    }
};

// Change password
export const changePassword = async (req, res, next) => {
    try {
        const { password, newPassword } = req.body;
        const user = await User.findById(req.userId);

        if (!user) {
            throw new NotFoundError('User not found');
        }

        if (!(await bcrypt.compare(password, user.password))) {
            throw new BadRequestError('Mật khẩu cũ không chính xác');
        }

        user.password = newPassword;
        await user.save();

        return createSuccessResponse(res);
    } catch (error) {
        next(error);
    }
};

// Forgot password
export const forgotPassword = async (req, res, next) => {
    try {
        const user = await User.findById(req.userId);
        if (!user) {
            throw new NotFoundError('User not found');
        }

        user.password = req.body.password;
        await user.save();

        return createSuccessResponse(res);
    } catch (error) {
        next(error);
    }
};

// Get user profile
export const getProfile = async (req, res, next) => {
    try {
        const user = await User.findById(req.userId);
        if (!user) {
            throw new NotFoundError('User not found');
        }

        return createSuccessResponse(res, user);
    } catch (error) {
        next(error);
    }
};

// Update user profile
export const updateProfile = async (req, res, next) => {
    try {
        const user = await User.findById(req.userId);
        if (!user) {
            throw new NotFoundError('User not found');
        }

        if (req.files?.['avatar']) {
            const { downloadURL, imageUrlRef } = await uploadSingleFile(...req.files['avatar']);

            // Remove old image if it exists
            if (user.imageUrlRef) {
                removeUploadedFile(user.imageUrlRef);
            }

            user.avatar = downloadURL;
            user.imageUrlRef = imageUrlRef;
        }

        user.set(req.body);
        await user.save();

        return createSuccessResponse(res);
    } catch (error) {
        next(error);
    }
};

// Wishlist operations
export const addWishList = async (req, res, next) => {
    try {
        const { userId } = req;
        const { productId } = req.body;

        const user = await User.findByIdAndUpdate(
            userId,
            { $addToSet: { wishList: productId } },
            { new: true }
        ).lean();

        if (!user) {
            throw new NotFoundError('User not found');
        }

        return createSuccessResponse(res, user);
    } catch (error) {
        next(error);
    }
};

export const deleteWishList = async (req, res, next) => {
    try {
        const { userId } = req;
        const { productId } = req.body;

        const user = await User.findByIdAndUpdate(
            userId,
            { $pull: { wishList: productId } },
            { new: true }
        ).lean();

        if (!user) {
            throw new NotFoundError('User not found');
        }

        return createSuccessResponse(res, user);
    } catch (error) {
        next(error);
    }
};

export const getWishListByUser = async (req, res, next) => {
    try {
        const wishlist = await User.findById(req.userId)
            .select('wishList')
            .populate({
                path: 'wishList',
                match: clientRequiredFields,
                populate: [
                    {
                        path: 'variants',
                        select: 'color size stock image imageUrlRef',
                        populate: [
                            { path: 'color', select: 'name hex' },
                            { path: 'size', select: 'name' },
                        ],
                    },
                ],
                select: 'name price discount variants description rating reviewCount',
            })
            .lean();

        if (!wishlist) {
            throw new NotFoundError('Không tìm thấy wishlist');
        }

        return createSuccessResponse(res, wishlist);
    } catch (error) {
        next(error);
    }
};
