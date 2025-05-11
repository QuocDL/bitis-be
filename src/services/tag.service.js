import { ReasonPhrases, StatusCodes } from 'http-status-codes';
import customResponse from '../helpers/response.js';
import Tag from '../models/tag.js';
import handleQuery from '../utils/handleQuery.js';

// Helper function to create consistent responses
const sendResponse = (res, status, data, message = ReasonPhrases.OK) => {
    return res.status(status).json(
        customResponse({
            data,
            message,
            status,
            success: true,
        })
    );
};

export const createNewTag = async (req, res, next) => {
    try {
        const tag = await Tag.create(req.body);
        return sendResponse(res, StatusCodes.CREATED, tag, ReasonPhrases.CREATED);
    } catch (error) {
        next(error);
    }
};

export const getDetailedTag = async (req, res, next) => {
    try {
        const tag = await Tag.findById(req.params.id).lean();
        if (!tag) return sendResponse(res, StatusCodes.NOT_FOUND, null, 'Tag not found');
        return sendResponse(res, StatusCodes.OK, tag);
    } catch (error) {
        next(error);
    }
};

export const getAllTag = async (req, res, next) => {
    try {
        const { data, page, totalDocs, totalPages } = await handleQuery(req, Tag);
        return sendResponse(res, StatusCodes.OK, {
            tags: data,
            page,
            totalDocs,
            totalPages,
        });
    } catch (error) {
        next(error);
    }
};

export const updateTag = async (req, res, next) => {
    try {
        const tag = await Tag.findOneAndUpdate(
            { _id: req.params.id },
            req.body,
            { new: true }
        ).lean();

        if (!tag) return sendResponse(res, StatusCodes.NOT_FOUND, null, 'Tag not found');
        return sendResponse(res, StatusCodes.OK, tag);
    } catch (error) {
        next(error);
    }
};
