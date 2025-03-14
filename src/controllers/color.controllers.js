import asyncHandler from '../helpers/asyncHandler.js';
import { colorServices } from '../services/index.js';

// @Get get all colors
export const getAllColors = asyncHandler(async (req, res, next) => {
    return colorServices.getAllColors(req, res, next);
});
