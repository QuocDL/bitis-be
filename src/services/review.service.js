import { ReasonPhrases, StatusCodes } from 'http-status-codes';
import customResponse from '../helpers/response.js';
import Review from '../models/review.js';
import handleQuery from '../utils/handleQuery.js';
import { reviewData } from '../utils/function/QueryReview.js';

// @Post create new review
export const createNewReview = async (req, res, next) => {
    const review = await Review.create(req.body);

    return res.status(StatusCodes.CREATED).json(
        customResponse({
            data: review,
            message: ReasonPhrases.CREATED,
            status: StatusCodes.OK,
            success: true,
        }),
    );
};

// @Get get all admin reviews
export const getAllAdminReviews = async (req, res, next) => {
    const { data, page, totalDocs, totalPages } = await handleQuery(req, Review);

    return res.status(StatusCodes.OK).json(
        customResponse({
            data: {
                reviews: data,
                page,
                totalDocs,
                totalPages,
            },
            message: ReasonPhrases.OK,
            status: StatusCodes.OK,
            success: true,
        }),
    );
};

// @Get get all reviews
export const getAllReviewsByProductId = async (req, res, next) => {
    const limit = req.query.limit ? req.query.limit : 5;
    const reviews = await Review.find({ productId: req.params.id }).sort({ createdAt: -1 }).limit(limit).lean();

    const { averageRating, reviewCount } = reviewData(reviews);

    return res.status(StatusCodes.OK).json(
        customResponse({
            data: {
                reviews: reviews,
                count: reviewCount,
                rating: averageRating,
            },
            message: ReasonPhrases.OK,
            status: StatusCodes.OK,
            success: true,
        }),
    );
};

// @Get get all review by productId
export const getProductDetailReviews = async (req, res, next) => {
    const limit = 3;
    const reviews = await Review.find({ productId: req.params.id })
        .sort({ createdAt: -1, rating: -1 })
        .limit(limit)
        .lean();

    const { averageRating, reviewCount } = reviewData(reviews);

    return res.status(StatusCodes.OK).json(
        customResponse({
            data: {
                reviews: reviews,
                count: reviewCount,
                rating: averageRating,
            },
            message: ReasonPhrases.OK,
            status: StatusCodes.OK,
            success: true,
        }),
    );
};
