import Color from '../models/color.js';
import { ReasonPhrases, StatusCodes } from 'http-status-codes';
import customResponse from '../helpers/response.js';
import handleQuery from '../utils/handleQuery.js';

// @Post create new color
export const createNewColor = async (req, res, next) => {
    const color = await Color.create(req.body);

    return res.status(StatusCodes.CREATED).json(
        customResponse({
            data: color,
            message: ReasonPhrases.CREATED,
            status: StatusCodes.OK,
            success: true,
        }),
    );
};

// @Get get all color
export const getAllColors = async (req, res, next) => {
    const { data, page, todalDocs, totalPages } = await handleQuery(req, Color);

    return res.status(StatusCodes.OK).json(
        customResponse({
            data: {
                colors: data,
                page,
                todalDocs,
                totalPages,
            },
            message: ReasonPhrases.OK,
            status: StatusCodes.OK,
            success: true,
        }),
    );
};

// @Get get detailed color
export const getDetailedColor = async (req, res, next) => {
    const color = await Color.findById(req.params.id).lean();

    return res.status(StatusCodes.OK).json(
        customResponse({
            data: color,
            message: ReasonPhrases.OK,
            status: StatusCodes.OK,
            success: true,
        }),
    );
};

// @Post update color
export const updateColor = async (req, res, next) => {
    const currentColor = await Color.findById(req.params.id);
    if (!currentColor) throw new NotFoundError('Color not found');
    const checkHexColorExist = await Color.findOne({ hex: req.body.hex, _id: { $ne: req.params.id } });
    if (checkHexColorExist) throw new BadRequestError('Color already exists');
    const checkNameColorExist = await Color.findOne({ name: req.body.name, _id: { $ne: req.params.id } });
    if (checkNameColorExist) throw new BadRequestError('Color already');
    const newColor = await Color.findOneAndUpdate({ _id: req.params.id }, req.body, {
        new: true,
    });

    return res.status(StatusCodes.OK).json(
        customResponse({
            data: newColor,
            message: ReasonPhrases.OK,
            status: StatusCodes.OK,
            success: true,
        }),
    );
};
