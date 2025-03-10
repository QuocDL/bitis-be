import { ReasonPhrases, StatusCodes } from 'http-status-codes';
import { BadRequestError, DuplicateError, UnAuthenticatedError } from '../errors/customError.js';
import User from '../models/user.js';
import customResponse from '../helpers/response.js';
import bcrypt from 'bcryptjs';
import _ from 'lodash';
import { envConfig } from '../config/env.js';
import { generateToken, saveToken } from './token.service.js';

// @POST register
export const register = async (req, res, next) => {
    const foundedUser = await User.findOne({ email: req.body.email }).lean();

    if (foundedUser) {
        throw new DuplicateError('Email đã tồn tại!');
    }

    const user = await User.create(req.body);

    return res.status(StatusCodes.CREATED).json(
        customResponse({
            data: user,
            message: 'Đăng ký tài khoản thành công. Vui lòng kiểm tra email để xác minh tài khoản',
            status: StatusCodes.OK,
            success: true,
        }),
    );
};

// @POST login
export const login = async (req, res, next) => {
    const foundedUser = await User.findOne({ email: req.body.email });

    if (!foundedUser) {
        throw new BadRequestError('Thông tin đăng nhập không chính xác');
    }

    const payload = {
        userId: foundedUser._id,
        role: foundedUser.role,
    };

    const isCompared = await bcrypt.compare(req.body.password, foundedUser.password);

    if (!isCompared) {
        throw new BadRequestError('Thông tin đăng nhập không chính xác');
    }
    if (!foundedUser.isActive) {
        throw new BadRequestError('Tài khoản của bạn chưa được kích hoạt vui lòng kiểm tra lại email');
    }
    const accessToken = generateToken(payload, envConfig.JWT_SECRET, '1d');

    return res.status(StatusCodes.OK).json(
        customResponse({
            data: { user: foundedUser, accessToken },
            message: ReasonPhrases.OK,
            status: StatusCodes.OK,
            success: true,
        }),
    );
};

// @ResetPassword
export const sendMailForgotPassword = async (req, res, next) => {
    const checkedEmail = await User.findOne({ email: req.body.email }).lean();
    if (!checkedEmail) {
        return res.status(StatusCodes.BAD_REQUEST).json(
            customResponse({
                data: {
                    field: 'email',
                    message: 'Email chưa được đăng ký',
                },
                message: 'Error Email',
                status: 400,
                success: false,
            }),
        );
    }
    const generateRandomPassword = (length = 8) => {
        const characters = 'abcdefghijklmnopqrstuvwxyz0123456789';
        let password = '';
        for (let i = 0; i < length; i++) {
            const randomIndex = Math.floor(Math.random() * characters.length);
            password += characters[randomIndex];
        }
        return password;
    };
    const newPassword = generateRandomPassword();
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(newPassword, saltRounds);
    await User.findByIdAndUpdate(checkedEmail._id, { password: hashedPassword });

    return res.status(StatusCodes.OK).json(
        customResponse({
            data: null,
            message: 'Vui Lòng Kiểm Tra Email',
            success: true,
            status: StatusCodes.NO_CONTENT,
        }),
    );
};
