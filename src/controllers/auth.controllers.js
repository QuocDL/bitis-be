import asyncHandler from '../helpers/asyncHandler.js';
import { authService } from '../services/index.js';

// @Register
export const register = asyncHandler(async (req, res, next) => {
    return await authService.register(req, res, next);
});
// @Login
export const login = asyncHandler(async (req, res, next) => {
    return await authService.login(req, res, next);
});
// @send mail Verify
export const sendMailVerify = asyncHandler(async (req, res, next) => {
    return await authService.sendMailverifyAccount(req, res, next);
});
export const sendMailResetPassword = asyncHandler(async (req, res, next) => {
    return await authService.sendMailForgotPassword(req, res, next);
});
// @Verify
export const verifyEmail = asyncHandler(async (req, res, next) => {
    return await authService.verifyEmail(req, res, next);
});
