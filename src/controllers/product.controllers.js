import { productService } from '../services/index.js';
import asyncHandler from '../helpers/asyncHandler.js';
import { ReasonPhrases, StatusCodes } from 'http-status-codes';
import customResponse from '../helpers/response.js';

export const createProduct = asyncHandler(async (req, res) => {
    const pro = await productService.createProduct(req.body, req.files);
    return res.status(StatusCodes.OK).json(
        customResponse({
            data: pro,
            success: true,
            status: StatusCodes.OK,
            message: ReasonPhrases.OK,
        }),
    );
});

export const updateProduct = asyncHandler(async (req, res) => {
    let { variantString, oldImageUrlRefs, ...productNew } = req.body;
    console.log(req.body, 'productNew');
    oldImageUrlRefs = oldImageUrlRefs ? JSON.parse(oldImageUrlRefs) : [];
    const variants = variantString ? JSON.parse(variantString) : [];
    const productId = req.params.id;
    const files = req.files;
    const pro = await productService.updateProduct(productId, oldImageUrlRefs, files, variants, productNew);
    return res.status(StatusCodes.OK).json(
        customResponse({
            data: pro,
            success: true,
            status: StatusCodes.OK,
            message: ReasonPhrases.OK,
        }),
    );
});
