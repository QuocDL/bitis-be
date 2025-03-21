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
