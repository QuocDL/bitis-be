import { ReasonPhrases, StatusCodes } from 'http-status-codes';
import customResponse from '../helpers/response.js';
import Tag from '../models/tag.js';
import handleQuery from '../utils/handleQuery.js';
export const createNewTag = async (req, res, next) => {
    const tag = await Tag.create(req.body);
    return res
        .status(StatusCodes.CREATED)
        .json(customResponse({ data: tag, message: ReasonPhrases.CREATED, status: StatusCodes.OK, success: true }));
};
