import { ReasonPhrases, StatusCodes } from 'http-status-codes';
import { BadRequestError, NotFoundError } from '../errors/customError.js';
import customResponse from '../helpers/response.js';
import Cart from '../models/cart.js';
import Product from '../models/product.js';
import mongoose from 'mongoose';
import { clientRequiredFields } from '../helpers/filterRequiredClient.js';

// Helper function to convert ID to ObjectId
const toObjectId = (id) => (id instanceof mongoose.Types.ObjectId ? id : new mongoose.Types.ObjectId(id));

// @Get cart by user
export const getMyCart = async (req, res, next) => {
    const userId = toObjectId(req.userId);
    const cartUser = await Cart.findOne({ userId })
        .populate({
            path: 'items.product',
            populate: [{ path: 'variants.color' }, { path: 'variants.size' }, { path: 'category' }],
        })
        .lean();
    if (!cartUser) throw new NotFoundError('Not found cart or cart is not exist.');

    const checkStock = cartUser.items
        .filter((itemEl) => itemEl.product !== null)
        .map((item) => {
            const variant = item.product.variants.find((el) => el._id.equals(item.variant));
            console.log(variant);
            if (!variant) return null;

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

    await Cart.findOneAndUpdate({ userId }, { items: checkStock }, { new: true });

    const itemsResponse = checkStock
        .map((item) => ({
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
        }))
        .filter((el) => el.isActive);

    return {
        userId: cartUser.userId,
        items: itemsResponse,
    };
};

// @Add to cart
export const addToCart = async (req, res, next) => {
    let { productId, quantity, variantId } = req.body;
    const userId = toObjectId(req.userId);
    productId = toObjectId(productId);
    variantId = toObjectId(variantId);

    if (quantity < 1) throw new BadRequestError(`Quantity must be at least 1`);

    const [product, currentCart] = await Promise.all([
        Product.findOne({ _id: productId }).lean(),
        Cart.findOne({ userId }).lean(),
    ]);

    if (!product) throw new BadRequestError(`Not found product`);

    const item = product.variants.find((item) => item._id.equals(variantId));
    if (!item) throw new BadRequestError(`Not found variant`);

    if (quantity > item.stock) quantity = item.stock;

    // Create new cart if none exists
    if (!currentCart) {
        const newCart = new Cart({
            userId,
            items: [{ product: productId, variant: variantId, quantity }],
        });
        await newCart.save();
        return newCart;
    }

    // Update quantity if product already in cart
    if (currentCart.items.length > 0) {
        const productInThisCart = currentCart.items.find((item) => item.variant.equals(variantId));
        if (productInThisCart) {
            const newQuantity = productInThisCart.quantity + quantity;
            if (newQuantity > item.stock) {
                throw new BadRequestError('Sản phẩm vượt quá số lượng trong kho');
            }

            const updatedCart = await Cart.findOneAndUpdate(
                { userId, 'items.variant': variantId },
                { $set: { 'items.$.quantity': Math.min(newQuantity, item.stock) } },
                { new: true },
            );

            return updatedCart;
        }
    }

    // Add new item to cart
    return Cart.findOneAndUpdate(
        { userId },
        { $push: { items: { product: productId, variant: variantId, quantity } } },
        { new: true, upsert: true },
    );
};

// @Remove one cart item
export const removeCartItem = async (req, res, next) => {
    const userId = toObjectId(req.userId);
    const updatedCart = await Cart.findOneAndUpdate(
        { userId },
        { $pull: { items: { variant: req.params.variantId } } },
        { new: true },
    );

    if (!updatedCart) throw new BadRequestError(`Not found cart with userId: ${req.body.userId}`);
    return null;
};

// @Remove all cart items
export const removeAllCartItems = async (req, res, next) => {
    const userId = toObjectId(req.userId);
    const cart = await Cart.findOneAndUpdate({ userId }, { items: [] }, { new: true }).lean();
    if (!cart) throw new BadRequestError(`Not found cart with userId: ${req.body.userId}`);
    return null;
};

// @Update cart item quantity
export const updateCartItemQuantity = async (req, res, next) => {
    const userId = toObjectId(req.userId);
    const productId = toObjectId(req.body.productId);
    const variantId = toObjectId(req.body.variantId);
    let { quantity } = req.body;

    const product = await Product.findOne({ _id: productId, 'variants._id': variantId });
    if (!product) throw new BadRequestError(`Not found product`);

    quantity = quantity <= 0 ? 1 : quantity;
    const variant = product.variants.find((el) => el._id.equals(variantId));
    quantity = Math.min(quantity, variant.stock);

    const updatedCart = await Cart.findOneAndUpdate(
        {
            userId,
            'items.product': productId,
            'items.variant': variantId,
        },
        { $set: { 'items.$.quantity': quantity } },
        { new: true },
    );

    if (!updatedCart)
        throw new BadRequestError(
            `Not found product with Id: ${req.body.productId} inside this cart or cart not found`,
        );

    return null;
};
