import { ReasonPhrases, StatusCodes } from 'http-status-codes';
import customResponse from '../helpers/response.js';
import Size from '../models/size.js';
import handleQuery from '../utils/handleQuery.js';

// @Post create new size
export const createNewSize = async (req, res, next) => {
    const size = await Size.create(req.body);

    return res.status(StatusCodes.CREATED).json(
        customResponse({
            data: size,
            message: ReasonPhrases.CREATED,
            status: StatusCodes.OK,
            success: true,
        }),
    );
};
