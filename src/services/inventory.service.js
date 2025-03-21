import { BadRequestError, NotFoundError } from '../errors/customError.js';
import Product from '../models/product.js';

export const updateStockOnCreateOrder = async (dataItems, session) => {
    return await Promise.all(
        dataItems.map(async (item) => {
            const productTarget = await Product.findOne({
                _id: item.productId,
            }).session(session);
            if (!productTarget) {
                throw new NotFoundError('Product not found');
            }
            const newVariants = productTarget.variants.map((variant) => {
                if (variant._id.toString() === item.variantId.toString()) {
                    const newStock = variant.stock - item.quantity;
                    if (newStock < 0) {
                        throw new BadRequestError('Sản phẩm đã hết hàng!');
                    }
                    variant.stock = newStock;
                }
                return variant;
            });
            productTarget.sold += item.quantity;
            productTarget.variants = newVariants;
            await productTarget.save();
        }),
    );
};

export const updateStockOnCancelOrder = async (dataItems) => {
    return await Promise.all(
        dataItems.map(async (item) => {
            const target = await Product.findOne({
                _id: item.productId,
                'variants._id': item.variantId,
            });
            if (!target) {
                throw new NotFoundError('Product not found');
            }
            const newVariants = target.variants.map((variant) => {
                if (variant._id.toString() === item.variantId.toString()) {
                    variant.stock += item.quantity;
                }
                return variant;
            });
            target.sold -= item.quantity;
            target.variants = newVariants;
            await target.save();
        }),
    );
};
