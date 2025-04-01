import asyncHandler from '../helpers/asyncHandler.js';
import { reviewServices } from '../services/index.js';

// @Post create new review
export const createReview = asyncHandler(async (req, res, next) => {
    return reviewServices.createNewReview(req, res, next);
});

// @Get get all reviews
export const getAllAdminReviews = asyncHandler(async (req, res, next) => {
    return reviewServices.getAllAdminReviews(req, res, next);
});

// @Get get top 3 review by product id
export const getProductDetailReviews = asyncHandler(async (req, res, next) => {
    return reviewServices.getProductDetailReviews(req, res, next);
});
// @Get get all review by product id
export const getAllReviewByProductId = asyncHandler(async (req, res, next) => {
    return reviewServices.getAllReviewsByProductId(req, res, next);
});
