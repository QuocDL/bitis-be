import Color from '../models/color.js';
import { ReasonPhrases, StatusCodes } from 'http-status-codes';
import customResponse from '../helpers/response.js';
import handleQuery from '../utils/handleQuery.js';

// Helper function to reduce response code duplication
const sendResponse = (res, statusCode, data, message = ReasonPhrases.OK) => {
    return res.status(statusCode).json(
        customResponse({
            data,
            message,
            status: StatusCodes.OK, // Keeping original behavior
            success: true,
        }),
    );
};

// @Post create new color
export const createNewColor = async (req, res, next) => {
    try {
        const color = await Color.create(req.body);
        return sendResponse(res, StatusCodes.CREATED, color, ReasonPhrases.CREATED);
    } catch (error) {
        next(error);
    }
};

// @Get get all color
export const getAllColors = async (req, res, next) => {
    try {
        const { data, page, todalDocs, totalPages } = await handleQuery(req, Color);
        return sendResponse(res, StatusCodes.OK, {
            colors: data,
            page,
            todalDocs,
            totalPages,
        });
    } catch (error) {
        next(error);
    }
};

// @Get get detailed color
export const getDetailedColor = async (req, res, next) => {
    try {
        const color = await Color.findById(req.params.id).lean();
        return sendResponse(res, StatusCodes.OK, color);
    } catch (error) {
        next(error);
    }
};

// @Post update color
export const updateColor = async (req, res, next) => {
    try {
        const newColor = await Color.findOneAndUpdate({ _id: req.params.id }, req.body, { new: true });
        return sendResponse(res, StatusCodes.OK, newColor);
    } catch (error) {
        next(error);
    }
};
