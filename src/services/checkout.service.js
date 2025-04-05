import { envConfig } from '../config/env.js';
import mongoose from 'mongoose';
import generateOrderStatusLog from '../utils/generateOrderStatusLog.js';
import { ORDER_STATUS } from '../constants/orderStatus.js';
import { PAYMENT_METHOD } from '../constants/paymentMethod.js';
import { buildSigned, createVpnUrl } from '../utils/vnpayGenerator.js';
import Order from '../models/order.js';
import Cart from '../models/cart.js';
import { BadRequestError, NotFoundError } from '../errors/customError.js';
import { inventoryService } from './index.js';

// Helper to verify VNPay signature
const verifyVnpaySignature = (params) => {
    const secureHash = params['vnp_SecureHash'];
    return secureHash === buildSigned(params);
};

// Helper to update order status
const updateOrderStatus = (orderId, updateData) => {
    return Order.findByIdAndUpdate(orderId, updateData, { new: true });
};

// Helper to remove items from cart
const removeItemsFromCart = async (userId, items) => {
    const operations = items.map((product) =>
        Cart.findOneAndUpdate(
            {
                userId,
                'items.product': new mongoose.Types.ObjectId(product.productId),
                'items.variant': new mongoose.Types.ObjectId(product.variantId),
            },
            {
                $pull: {
                    items: {
                        product: new mongoose.Types.ObjectId(product.productId),
                        variant: new mongoose.Types.ObjectId(product.variantId),
                    },
                },
            },
            { new: true },
        ),
    );
    return Promise.all(operations);
};

export const createPaymentUrlWithVNpay = async (req, res) => {
    await new Promise((resolve) => setTimeout(resolve, 2000));

    const ipAddr = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    const { totalPrice } = req.body;
    const session = req.session;

    await inventoryService.updateStockOnCreateOrder(req.body.items, session);

    const orderData = {
        ...req.body,
        paymentMethod: PAYMENT_METHOD.CARD,
        totalPrice,
        orderStatus: 'cancelled',
        canceledBy: 'system',
    };

    const order = new Order(orderData);
    await order.save({ session });

    const vnpUrl = createVpnUrl({
        ipAddr,
        bankCode: '',
        locale: 'en',
        amount: totalPrice,
        vnPayReturnUrl: envConfig.VN_PAY_CONFIG.vnp_ReturnUrl,
        orderId: order._id.toString(),
    });

    res.status(200).json({ checkout: vnpUrl });
};

export const vnpayReturn = async (req, res) => {
    const vnp_Params = req.query;
    const responseCode = vnp_Params['vnp_ResponseCode'];

    if (!verifyVnpaySignature(vnp_Params)) {
        return res.status(400).json({
            code: '97',
            message: 'Invalid checksum',
            redirectUrl: '/error',
            status: 'error',
        });
    }

    const order = await Order.findById(vnp_Params['vnp_TxnRef']);
    if (!order) {
        return res.status(400).json({
            code: '01',
            message: 'Order not found',
            redirectUrl: '/404',
            status: 'error',
        });
    }

    const userId = order.userId;

    if (responseCode === '00') {
        const data = await updateOrderStatus(vnp_Params['vnp_TxnRef'], {
            isPaid: true,
            orderStatus: ORDER_STATUS.PENDING,
            paymentMethod: PAYMENT_METHOD.CARD,
            orderStatusLogs: generateOrderStatusLog({
                statusChangedBy: userId,
                orderStatus: ORDER_STATUS.PENDING,
                reason: 'User paid by VNPay successfully',
            }),
        });

        await removeItemsFromCart(userId, order.items);
        await inventoryService.updateStockOnCreateOrder(order.items);

        return res.status(200).json({
            code: responseCode,
            message: 'Payment successful',
            data,
            status: 'success',
            orderId: order._id,
        });
    } else {
        const data = await updateOrderStatus(vnp_Params['vnp_TxnRef'], {
            isPaid: false,
            orderStatus: ORDER_STATUS.CANCELLED,
            paymentMethod: PAYMENT_METHOD.CARD,
            description: 'Thanh toán qua VNPay thất bại đơn hàng đã bị hủy',
            orderStatusLogs: generateOrderStatusLog({
                statusChangedBy: req.userId || userId,
                orderStatus: ORDER_STATUS.CANCELLED,
                reason: `VNPay payment failed with code ${responseCode}`,
            }),
        });

        return res.status(200).json({
            code: responseCode,
            message: 'Payment cancelled or failed',
            data,
            status: 'failed',
            orderId: order._id,
            errorMessage: 'Thanh toán thất bại hoặc đã bị hủy bỏ',
        });
    }
};

export const vnpayIpn = async (req, res) => {
    const vnp_Params = req.query;
    const rspCode = vnp_Params['vnp_ResponseCode'];
    const transactionStatus = vnp_Params['vnp_TransactionStatus'];

    if (!verifyVnpaySignature(vnp_Params)) {
        return res.status(200).json({ code: '97', message: 'Checksum failed' });
    }

    const order = await Order.findById(vnp_Params['vnp_TxnRef']);
    if (!order) {
        return res.status(200).json({ code: '01', message: 'Order not found' });
    }

    if (rspCode === '00' && transactionStatus === '00') {
        await updateOrderStatus(vnp_Params['vnp_TxnRef'], {
            isPaid: true,
            orderStatus: ORDER_STATUS.CONFIRMED,
            paymentMethod: PAYMENT_METHOD.CARD,
            orderStatusLogs: generateOrderStatusLog({
                statusChangedBy: req.userId || order.userId,
                orderStatus: ORDER_STATUS.CONFIRMED,
                reason: 'User paid by VNPay successfully',
            }),
        });

        await inventoryService.updateStockOnCreateOrder(order.items);
        return res.status(200).json({ code: '00', message: 'Success' });
    } else {
        await updateOrderStatus(vnp_Params['vnp_TxnRef'], {
            isPaid: false,
            orderStatus: ORDER_STATUS.CANCELLED,
            description: `Thanh toán qua VNPay thất bại đơn hàng đã bị hủy (Mã lỗi: ${rspCode})`,
            orderStatusLogs: generateOrderStatusLog({
                statusChangedBy: req.userId || order.userId,
                orderStatus: ORDER_STATUS.CANCELLED,
                reason: `VNPay payment failed with code ${rspCode}`,
            }),
        });

        return res.status(200).json({
            code: rspCode,
            message: 'Payment cancelled or failed',
        });
    }
};
