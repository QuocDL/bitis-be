import { ReasonPhrases, StatusCodes } from 'http-status-codes';
import { BadRequestError, NotAcceptableError, NotFoundError } from '../errors/customError.js';
import Order from '../models/order.js';
import APIQuery from '../utils/APIQuery.js';
import { sendMail } from '../utils/sendMail.js';
import customResponse from '../helpers/response.js';
import { inventoryService } from './index.js';
import { ORDER_STATUS, PAYMENT_METHOD } from '../constants/orderStatus.js';
import { ROLE } from '../constants/role.js';
import mongoose, { set } from 'mongoose';
import Cart from '../models/cart.js';

// @GET:  Get all orders
export const getAllOrders = async (req, res, next) => {
    const page = req.query.page ? +req.query.page : 1;
    req.query.limit = String(req.query.limit || 10);
    const searchString = req.query.rawsearch;
    const searchQuery = searchString ? { 'customerInfo.name': { $regex: searchString, $options: 'i' } } : {};
    const features = new APIQuery(Order.find(searchQuery), req.query);
    features.filter().sort().limitFields().search().paginate();

    const [orders, totalDocs] = await Promise.all([features.query, features.count()]);
    const totalPages = Math.ceil(Number(totalDocs) / +req.query.limit);

    return res.status(StatusCodes.OK).json(
        customResponse({
            data: {
                orders,
                page,
                totalDocs,
                totalPages,
            },
            success: true,
            status: StatusCodes.OK,
            message: ReasonPhrases.OK,
        }),
    );
};

//@GET: Get all orders by user
export const getAllOrdersByUser = async (req, res, next) => {
    const userId = new mongoose.Types.ObjectId(req.userId);
    const page = req.query.page ? +req.query.page : 1;
    req.query.limit = Number(req.query.limit || 10);
    req.query.userId;

    const features = new APIQuery(Order.find({ userId }), req.query);
    features.filter().sort().limitFields().search().paginate();

    const [orders, totalDocs] = await Promise.all([features.query, features.count()]);
    return res.status(StatusCodes.OK).json(
        customResponse({
            data: {
                orders,
                page,
                totalDocs,
            },
            success: true,
            status: StatusCodes.OK,
            message: ReasonPhrases.OK,
        }),
    );
};

//@GET: Get the detailed order
export const getDetailedOrder = async (req, res, next) => {
    const order = await Order.findById(req.params.id).lean();

    if (!order) {
        throw new NotFoundError(`${ReasonPhrases.NOT_FOUND} order with id: ${req.params.id}`);
    }

    return res.status(StatusCodes.OK).json(
        customResponse({
            data: order,
            success: true,
            status: StatusCodes.OK,
            message: ReasonPhrases.OK,
        }),
    );
};

// @POST: Create new order
export const createOrder = async (req, res, next) => {
    const order = new Order({
        ...req.body,
        userId: req.userId,
    });

    // Pause for 3 seconds
    await new Promise((resolve) => setTimeout(resolve, 2000));
    const session = req.session;
    //   Update stock
    await inventoryService.updateStockOnCreateOrder(req.body.items, session);

    await Promise.all(
        req.body.items.map(async (product) => {
            await Cart.findOneAndUpdate(
                { userId: req.userId },
                {
                    $pull: {
                        items: { product: product.productId, variant: product.variantId },
                    },
                },
                { new: true },
            ).session(session);
        }),
    );
    await order.save({ session });
    return res.status(StatusCodes.OK).json(
        customResponse({
            data: order,
            success: true,
            status: StatusCodes.OK,
            message: ReasonPhrases.OK,
        }),
    );
};

//@POST Set order status to cancelled
export const cancelOrder = async (req, res, next) => {
    const foundedOrder = await Order.findOne({ _id: req.body.orderId });

    if (!foundedOrder) {
        throw new BadRequestError(`Not found order with id ${req.body.orderId}`);
    }

    if (foundedOrder.orderStatus === ORDER_STATUS.CANCELLED) {
        throw new NotAcceptableError(`You cannot cancel this order because it was cancelled before. `);
    }

    if (foundedOrder.orderStatus !== ORDER_STATUS.DELIVERED && foundedOrder.orderStatus !== ORDER_STATUS.DONE) {
        if (req.role !== ROLE.ADMIN && foundedOrder.orderStatus !== ORDER_STATUS.PENDING) {
            throw new NotAcceptableError('Bạn không được phép hủy đơn vui lòng liên hệ nếu có vấn đề');
        }
        if (req.role === ROLE.ADMIN) {
            foundedOrder.canceledBy = ROLE.ADMIN;
        }

        foundedOrder.orderStatus = ORDER_STATUS.CANCELLED;
        foundedOrder.description = req.body.description ?? '';
        foundedOrder.save();

        // Update stock
        await inventoryService.updateStockOnCancelOrder(foundedOrder.items);

        const template = {
            content: {
                title: `${req.role === ROLE.ADMIN ? 'Đơn hàng của bạn đã bị hủy bởi admin' : 'Đơn hàng của bạn đã bị hủy'}`,
                description: `${req.role === ROLE.ADMIN ? `Đơn hàng của bạn đã bị hủy bởi admin với lý do ${foundedOrder.description}, ${foundedOrder.isPaid ? `Rất xin lỗi vì sự bất tiện này hãy liên hệ ngay với chúng tôi qua số điện thoại +84 123 456 789 để cửa hàng hoàn lại ${new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(foundedOrder.totalPrice || 0)} cho bạn ` : ''} dưới đây là thông tin đơn hàng:` : `Bạn vừa hủy một đơn hàng với lý do ${foundedOrder.description} từ AdShop thông tin đơn hàng:`}`,
                email:
                    foundedOrder.paymentMethod === PAYMENT_METHOD.CARD
                        ? foundedOrder.customerInfo.email
                        : foundedOrder.receiverInfo.email,
            },
            product: {
                items: foundedOrder.items,
                shippingfee: foundedOrder.shippingFee,
                totalPrice: foundedOrder.totalPrice,
            },
            subject: '[AdShop] - Đơn hàng của bạn đã bị hủy',
            link: {
                linkHerf: `http://localhost:3000/my-orders/${req.body.orderId}`,
                linkName: `Kiểm tra đơn hàng`,
            },
            user: {
                name:
                    foundedOrder.paymentMethod === PAYMENT_METHOD.CARD
                        ? foundedOrder.customerInfo.name
                        : foundedOrder.receiverInfo.name,
                phone:
                    foundedOrder.paymentMethod === PAYMENT_METHOD.CARD
                        ? foundedOrder.customerInfo.phone
                        : foundedOrder.receiverInfo.phone,
                email:
                    foundedOrder.paymentMethod === PAYMENT_METHOD.CARD
                        ? foundedOrder.customerInfo.email
                        : foundedOrder.receiverInfo.email,
                address: `[${foundedOrder.shippingAddress.address}] -${foundedOrder.paymentMethod === PAYMENT_METHOD.CARD ? '' : ` ${foundedOrder.shippingAddress.ward}, ${foundedOrder.shippingAddress.district},`} ${foundedOrder.shippingAddress.province}, ${foundedOrder.shippingAddress.country}`,
            },
        };
        await sendMail({
            email: foundedOrder.customerInfo.email,
            template,
            type: 'UpdateStatusOrder',
        });
    } else {
        throw new NotAcceptableError(`Đơn hàng của bạn đã được giao không thể hủy đơn`);
    }

    return res.status(StatusCodes.OK).json(
        customResponse({
            data: null,
            success: true,
            status: StatusCodes.OK,
            message: 'Your order is cancelled.',
        }),
    );
};
