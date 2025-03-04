import { ReasonPhrases, StatusCodes } from 'http-status-codes';
import { BadRequestError, NotFoundError } from '../errors/customError.js';
import Product from '../models/product.js';
import APIQuery from '../utils/APIQuery.js';
import { removeUploadedFile, uploadFiles } from '../utils/upload.js';
import { clientRequiredFields } from '../helpers/filterRequiredClient.js';
import customResponse from '../helpers/response.js';

function hasDuplicates(array) {
    return new Set(array).size !== array.length;
}
export const getAllProducts = async (query) => {
    const features = new APIQuery(
        Product.find().populate('variants.color').populate('variants.size').populate('category').populate('tags'),
        query,
    );
    features.filter().sort().limitFields().search().paginate();

    const [products, totalDocs] = await Promise.all([features.query, features.count()]);
    return { products, totalDocs };
};
export const getBestSellingProducts = async () => {
    const products = await Product.find({ ...clientRequiredFields })
        .populate('variants.color')
        .populate('variants.size')
        .sort({ sold: -1 })
        .limit(10);
    return products;
};
export const getDiscountProducts = async () => {
    const products = await Product.find({ ...clientRequiredFields })
        .populate('variants.color')
        .populate('variants.size')
        .sort({ discount: -1 })
        .limit(10);
    return products;
};

export const createProduct = async (productData, files) => {
    let variationList;

    // @upload images
    if (files && files['variantImages']) {
        const { fileUrls, fileUrlRefs, originNames } = await uploadFiles(files['variantImages']);
        const variants = JSON.parse(productData.variantString);
        const map = {};
        variants.forEach((element) => {
            const key = element.size + element.color;
            if (map[key]) {
                // throw new BadRequestError("Biến thể không được trùng nhau");
            } else {
                map[key] = 1;
            }
        });
        if (hasDuplicates(variants.map((item) => item.imageUrlRef))) {
            throw new BadRequestError('File ảnh không được trùng nhau');
        }

        variationList = fileUrls.map((item, i) => {
            const variation = variants.find((obj) => {
                const originName = originNames[i];

                const fileName = obj.imageUrlRef;
                return fileName === originName;
            });
            if (variation) {
                return { ...variation, image: item, imageUrlRef: fileUrlRefs[i] };
            }
        });
    }

    delete productData.variantImages;
    delete productData.variantString;

    // @add variants to product
    const newProduct = new Product({
        ...productData,
        tags: productData.tags ? productData.tags.split(',') : [],
        variants: variationList,
    });

    await newProduct.save();
    return newProduct;
};
