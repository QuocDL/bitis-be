import { ReasonPhrases, StatusCodes } from 'http-status-codes';
import { BadRequestError, NotFoundError } from '../errors/customError.js';
import Product from '../models/product.js';
import APIQuery from '../utils/APIQuery.js';
import { uploadFiles } from '../utils/upload.js';
import { clientRequiredFields } from '../helpers/filterRequiredClient.js';
import customResponse from '../helpers/response.js';

// Common population pattern
const PRODUCT_POPULATE = [
    { path: 'variants.color' },
    { path: 'variants.size' },
    { path: 'category' },
    { path: 'tags' },
];

const PRODUCT_VARIANT_POPULATE = [{ path: 'variants.color' }, { path: 'variants.size' }];

// Utility functions
const hasDuplicates = (array) => new Set(array).size !== array.length;

const validateVariants = (variants) => {
    const map = {};
    for (const element of variants) {
        const key = element.size + element.color;
        if (map[key]) {
            throw new BadRequestError('Biến thể không được trùng nhau');
        }
        map[key] = 1;
    }
};

export const getAllProducts = async (query) => {
    const features = new APIQuery(Product.find().populate(PRODUCT_POPULATE), query);
    features.filter().sort().limitFields().search().paginate();

    const [products, totalDocs] = await Promise.all([features.query, features.count()]);
    return { products, totalDocs };
};

export const getBestSellingProducts = async () => {
    return Product.find({ ...clientRequiredFields })
        .populate(PRODUCT_VARIANT_POPULATE)
        .sort({ sold: -1 })
        .limit(10);
};

export const getDiscountProducts = async () => {
    return Product.find({ ...clientRequiredFields })
        .populate(PRODUCT_VARIANT_POPULATE)
        .sort({ discount: -1 })
        .limit(10);
};

export const createProduct = async (productData, files) => {
    let variationList = [];

    if (files?.variantImages) {
        const { fileUrls, fileUrlRefs, originNames } = await uploadFiles(files.variantImages);
        const variants = JSON.parse(productData.variantString);

        validateVariants(variants);

        if (hasDuplicates(variants.map((item) => item.imageUrlRef))) {
            throw new BadRequestError('File ảnh không được trùng nhau');
        }

        variationList = fileUrls
            .map((item, i) => {
                const variation = variants.find((obj) => obj.imageUrlRef === originNames[i]);
                return variation ? { ...variation, image: item, imageUrlRef: fileUrlRefs[i] } : null;
            })
            .filter(Boolean);
    }

    delete productData.variantImages;
    delete productData.variantString;

    const newProduct = new Product({
        ...productData,
        tags: productData.tags ? productData.tags.split(',') : [],
        variants: variationList,
    });

    return newProduct.save();
};

export const updateProduct = async (productId, oldImageUrlRefs, files, variants, productNew) => {
    const product = await Product.findById(productId);
    if (!product) throw new NotFoundError(`${ReasonPhrases.NOT_FOUND} product with id: ${productId}`);

    validateVariants(variants);

    let updatedVariants = [...variants];

    if (files?.variantImages) {
        const { fileUrls, fileUrlRefs, originNames } = await uploadFiles(files.variantImages);

        // Process new variants with uploaded images
        const newVariants = fileUrls
            .map((item, i) => {
                const variation = variants.find((obj) => obj.imageUrlRef === originNames[i]);
                return variation ? { ...variation, image: item, imageUrlRef: fileUrlRefs[i] } : null;
            })
            .filter(Boolean);

        // Keep old variants with existing images
        const oldVariants = variants.filter((item) => item.image);
        updatedVariants = [...newVariants, ...oldVariants];
    }

    const tags = productNew.tags ? productNew.tags.split(',') : product.tags;

    product.set({
        ...productNew,
        variants: updatedVariants,
        tags,
    });

    return product.save();
};

export const getProductById = async (productId) => {
    const product = await Product.findOne({
        _id: productId,
        ...clientRequiredFields,
    }).populate(PRODUCT_VARIANT_POPULATE);

    if (!product) throw new NotFoundError(`${ReasonPhrases.NOT_FOUND} product with id: ${productId}`);
    return product;
};

export const hiddenProduct = async (id) => {
    const product = await Product.findOneAndUpdate({ _id: id, isActive: true }, { isActive: false }, { new: true });

    if (!product) {
        throw new NotFoundError(`Không tìm thấy sản phẩm này: ${id}`);
    }

    return product;
};

export const showProduct = async (id) => {
    const product = await Product.findOneAndUpdate({ _id: id, isActive: false }, { isActive: true }, { new: true });

    if (!product) {
        throw new NotFoundError(`${ReasonPhrases.NOT_FOUND} product with id: ${id}`);
    }

    return product;
};

export const getRelatedProducts = async (productId) => {
    const product = await Product.findById(productId).populate(PRODUCT_VARIANT_POPULATE).lean();
    if (!product) throw new NotFoundError(`${ReasonPhrases.NOT_FOUND} product with id: ${productId}`);

    return Product.find({ tags: { $in: product.tags } }).limit(10);
};
