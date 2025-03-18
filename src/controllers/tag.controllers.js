import asyncHandler from '../helpers/asyncHandler.js';
import { tagServices } from '../services/index.js';
export const createTag = asyncHandler(async (req, res, next) => {
    return tagServices.createNewTag(req, res, next);
});
