import { ReasonPhrases, StatusCodes } from 'http-status-codes';
import customResponse from '../helpers/response.js';
import Size from '../models/size.js';
import handleQuery from '../utils/handleQuery.js';

// Helper function to send responses
const sendResponse = (res, statusCode, data, message = ReasonPhrases.OK) => {
    return res.status(statusCode).json(
        customResponse({
            data,
            message,
            status: statusCode,
            success: true,
        })
    );
};

// @Post create new size
export const createNewSize = async (req, res) => {
    try {
        const size = await Size.create(req.body);
        return sendResponse(res, StatusCodes.CREATED, size, ReasonPhrases.CREATED);
    } catch (error) {
        return res.status(StatusCodes.BAD_REQUEST).json(
            customResponse({
                message: error.message,
                status: StatusCodes.BAD_REQUEST,
                success: false,
            })
        );
    }
};

// @Get get all size
export const getAllSizes = async (req, res) => {
    try {
        const { data, page, totalDocs, totalPages } = await handleQuery(req, Size);
        return sendResponse(res, StatusCodes.OK, {
            sizes: data,
            page,
            totalDocs,
            totalPages,
        });
    } catch (error) {
        return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json(
            customResponse({
                message: error.message,
                status: StatusCodes.INTERNAL_SERVER_ERROR,
                success: false,
            })
        );
    }
};

// @Get get detailed size
export const getDetailedSize = async (req, res) => {
    try {
        const size = await Size.findById(req.params.id).lean();
        if (!size) {
            return res.status(StatusCodes.NOT_FOUND).json(
                customResponse({
                    message: 'Size not found',
                    status: StatusCodes.NOT_FOUND,
                    success: false,
                })
            );
        }
        return sendResponse(res, StatusCodes.OK, size);
    } catch (error) {
        return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json(
            customResponse({
                message: error.message,
                status: StatusCodes.INTERNAL_SERVER_ERROR,
                success: false,
            })
        );
    }
};

// @Post update size
export const updateSize = async (req, res) => {
    try {
        const newSize = await Size.findOneAndUpdate({ _id: req.params.id }, req.body, {
            new: true,
        });

        if (!newSize) {
            return res.status(StatusCodes.NOT_FOUND).json(
                customResponse({
                    message: 'Size not found',
                    status: StatusCodes.NOT_FOUND,
                    success: false,
                })
            );
        }

        return sendResponse(res, StatusCodes.OK, newSize);
    } catch (error) {
        return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json(
            customResponse({
                message: error.message,
                status: StatusCodes.INTERNAL_SERVER_ERROR,
                success: false,
            })
        );
    }
};
