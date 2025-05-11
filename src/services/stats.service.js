import moment from 'moment-timezone';
import Order from '../models/order.js';
import User from '../models/user.js';
import Product from '../models/product.js';

// Date utility functions
const vietnamTZ = 'Asia/Ho_Chi_Minh';

const getDateRange = (dateFilter, startDate, endDate, month, year) => {
    if (dateFilter === 'range' && startDate && endDate) {
        return {
            start: moment.tz(startDate, 'DD-MM-YYYY', vietnamTZ).startOf('day').toDate(),
            end: moment.tz(endDate, 'DD-MM-YYYY', vietnamTZ).endOf('day').toDate()
        };
    } else if (month && year) {
        return {
            start: moment.tz(`01-${month}-${year}`, 'DD-MM-YYYY', vietnamTZ).startOf('month').toDate(),
            end: moment.tz(`01-${month}-${year}`, 'DD-MM-YYYY', vietnamTZ).endOf('month').toDate()
        };
    } else if (year) {
        return {
            start: moment.tz(`01-01-${year}`, 'DD-MM-YYYY', vietnamTZ).startOf('year').toDate(),
            end: moment.tz(`31-12-${year}`, 'DD-MM-YYYY', vietnamTZ).endOf('year').toDate()
        };
    } else if (dateFilter === 'single' && startDate) {
        return {
            start: moment.tz(startDate, 'DD-MM-YYYY', vietnamTZ).startOf('day').toDate(),
            end: moment.tz(startDate, 'DD-MM-YYYY', vietnamTZ).endOf('day').toDate()
        };
    }
    return null;
};

const createVNDateAddField = () => ({
    $addFields: {
        createdAtVN: {
            $dateToString: {
                format: '%Y-%m-%d %H:%M:%S',
                date: '$createdAt',
                timezone: '+07:00',
            },
        },
    }
});

const createDateMatchStage = (start, end) => ({
    $match: {
        createdAt: {
            $gte: start,
            $lte: end,
        },
    }
});

export const totalStats = async (req, res, next) => {
    const { dateFilter, startDate, endDate, month, year } = req.query;

    const dateRange = getDateRange(dateFilter, startDate, endDate, month, year);
    if (!dateRange) {
        return { error: 'Invalid date filter', status: 400 };
    }

    const { start, end } = dateRange;

    const [totalOrders, cancelledOrders, totalRevenue, newUsers, newProducts] = await Promise.all([
        Order.countDocuments(createDateMatchStage(start, end).$match),
        Order.countDocuments({
            ...createDateMatchStage(start, end).$match,
            orderStatus: 'cancelled',
        }),
        Order.aggregate([
            {
                $match: {
                    ...createDateMatchStage(start, end).$match,
                    orderStatus: 'done',
                    isPaid: true,
                },
            },
            {
                $group: {
                    _id: null,
                    total: { $sum: '$totalPrice' },
                    count: { $sum: 1 },
                },
            },
        ]).then((result) => ({
            total: result[0]?.total || 0,
            count: result[0]?.count || 0,
        })),
        User.countDocuments(createDateMatchStage(start, end).$match),
        Product.countDocuments(createDateMatchStage(start, end).$match),
    ]);

    const successfulOrders = totalRevenue.count;
    const orderSuccessRate = totalOrders > 0 ? (successfulOrders / totalOrders) * 100 : 0;
    const orderCancelRate = totalOrders > 0 ? (cancelledOrders / totalOrders) * 100 : 0;
    const daysDiff = moment(end).diff(moment(start), 'days') + 1;
    const averageDailyRevenue = totalRevenue.total / daysDiff;

    return {
        data: {
            totalOrders,
            cancelledOrders,
            successfulOrders,
            totalRevenue: totalRevenue.total,
            orderSuccessRate: parseFloat(orderSuccessRate.toFixed(2)),
            orderCancelRate: parseFloat(orderCancelRate.toFixed(2)),
            newUsers,
            newProducts,
            averageDailyRevenue: parseFloat(averageDailyRevenue.toFixed(2)),
            dateRange: {
                start: moment(start).format('YYYY-MM-DD'),
                end: moment(end).format('YYYY-MM-DD'),
            },
        },
    };
};

// Other functions optimized following the same pattern
export const orderByDayStats = async (req, res, next) => {
    const year = parseInt(req.query.year) || new Date().getFullYear();
    const month = parseInt(req.query.month) || new Date().getMonth() + 1;

    const startDate = moment.tz(`01-${month}-${year}`, 'DD-MM-YYYY', vietnamTZ).startOf('month').utc().toDate();
    const endDate = moment.tz(`01-${month}-${year}`, 'DD-MM-YYYY', vietnamTZ).endOf('month').utc().toDate();

    const data = await Order.aggregate([
        createDateMatchStage(startDate, endDate),
        createVNDateAddField(),
        {
            $group: {
                _id: {
                    day: { $dayOfMonth: { $toDate: '$createdAtVN' } },
                    month: { $month: { $toDate: '$createdAtVN' } },
                    year: { $year: { $toDate: '$createdAtVN' } },
                },
                totalOrders: { $sum: 1 },
                totalRevenue: { $sum: '$totalPrice' },
            },
        },
        {
            $project: {
                _id: 0,
                date: {
                    $dateFromParts: {
                        year: '$_id.year',
                        month: '$_id.month',
                        day: '$_id.day',
                    },
                },
                totalOrders: 1,
                totalRevenue: 1,
            },
        },
        { $sort: { date: 1 } },
    ]);

    return data.map((stat) => ({
        date: moment(stat.date).format('MMM DD'),
        totalOrders: stat.totalOrders,
        totalRevenue: stat.totalRevenue,
    }));
};

// Additional optimization would require refactoring other functions similarly
