import { BadRequestError, NotFoundError } from '../errors/customError.js';
import { ReasonPhrases, StatusCodes } from 'http-status-codes';
import customResponse from '../helpers/response.js';
import APIQuery from '../utils/APIQuery.js';
import User from '../models/user.js';
import bcrypt from 'bcryptjs';
import { removeUploadedFile, uploadSingleFile } from '../utils/upload.js';
import { clientRequiredFields } from '../helpers/filterRequiredClient.js';

// GET: Get all users
// @Get: getAllUsers
export const getAllUsers = async (req, res) => {
    const page = req.query.page ? +req.query.page : 1;
    req.query.limit = String(req.query.limit || 10);

    const features = new APIQuery(User.find({}).select('-password'), req.query);
    features.filter().sort().limitFields().search().paginate();

    const [data, totalDocs] = await Promise.all([features.query, features.count()]);
    const totalPages = Math.ceil(Number(totalDocs) / +req.query.limit);
    return res.status(StatusCodes.OK).json(
        customResponse({
            data: {
                users: data,
                page: page,
                totalDocs: totalDocs,
                totalPages: totalPages,
            },
            success: true,
            status: StatusCodes.OK,
            message: ReasonPhrases.OK,
        }),
    );
};

// @Patch change password
export const changePassword = async (req, res, next) => {
    const { password, newPassword } = req.body;
    const user = await User.findOne({ _id: req.userId });

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
        throw new BadRequestError('Mật khẩu cũ không chính xác');
    }

    user.password = newPassword;
    await user.save();

    return res.status(StatusCodes.OK).json(
        customResponse({
            data: null,
            message: ReasonPhrases.OK,
            status: StatusCodes.OK,
            success: true,
        }),
    );
};
