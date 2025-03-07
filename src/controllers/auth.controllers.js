import asyncHandler from "../helpers/asyncHandler.js";
import { authService } from "../services/index.js";

// @Register
export const register = asyncHandler(async (req, res, next) => {
  return await authService.register(req, res, next);
});
// @Login
export const login = asyncHandler(async (req, res, next) => {
  return await authService.login(req, res, next);
});
