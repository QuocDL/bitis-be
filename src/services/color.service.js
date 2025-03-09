import asyncHandler from '../helpers/asyncHandler.js';
import { colorServices } from '../services/index.js';

// @Post create new color
export const createColor = asyncHandler(async (req, res, next) => {
    return colorServices.createNewColor(req, res, next);
});
