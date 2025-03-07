import { ReasonPhrases, StatusCodes } from 'http-status-codes';
import { BadRequestError, NotFoundError } from '../errors/customError.js';
import customResponse from '../helpers/response.js';
import Cart from '../models/cart.js';
import Product from '../models/product.js';
import mongoose from 'mongoose';
import { clientRequiredFields } from '../helpers/filterRequiredClient.js';

// @Get cart by user
export const getMyCart = async (req, res, next) => {
    const userId = req.userId;
    const cartUser = await Cart.findOne({
        userId: new mongoose.Types.ObjectId(userId),
    })
        .populate({
            path: 'items.product',
            populate: [{ path: 'variants.color' }, { path: 'variants.size' }, { path: 'category' }],
        })
        .lean();
    if (!cartUser) throw new NotFoundError('Not found cart or cart is not exist.');
    const checkStock = cartUser.items
        .filter((itemEl) => itemEl.product !== null)
        .map((item) => {
            const variant = item.product.variants.find((el) => {
                return el._id.equals(item.variant);
            });
            console.log(variant);
            if (!variant) {
                return null;
            }
            if (item.quantity > variant.stock) {
                item.quantity = variant.stock;
            }
            return {
                ...item,
                variantObj: {
                    ...variant,
                    color: variant.color.name,
                    size: variant.size.name,
                    category: item.product.category.name,
                    categoryId: item.product.category._id,
                },
            };
        })
        .filter((el) => el !== null);

    await Cart.findOneAndUpdate({ userId: new mongoose.Types.ObjectId(userId) }, { items: checkStock }, { new: true });

    const itemsResponse = checkStock
        .map((item) => {
            const newItem = {
                productId: item.product._id,
                isActive: item.product.isActive,
                variantId: item.variant,
                quantity: item.quantity,
                name: item.product.name,
                price: item.product.price,
                image: item.product.variants[0].image,
                description: item.product.description,
                discount: item.product.discount,
                ...item.variantObj,
            };
            return newItem;
        })
        .filter((el) => el.isActive);
    const myCart = {
        userId: cartUser.userId,
        items: itemsResponse,
    };

    return myCart;
};
