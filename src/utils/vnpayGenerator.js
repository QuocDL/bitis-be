import { envConfig } from '../config/env.js';
import crypto from 'crypto';
import moment from 'moment';
import querystring from 'qs';

export const sortObject = (obj) => {
    const sorted = {};
    const keys = Object.keys(obj)
        .filter((key) => Object.prototype.hasOwnProperty.call(obj, key))
        .map((key) => encodeURIComponent(key))
        .sort();

    for (const encodedKey of keys) {
        const originalKey = decodeURIComponent(encodedKey);
        sorted[encodedKey] = encodeURIComponent(obj[originalKey]).replace(/%20/g, '+');
    }

    return sorted;
};

export const buildSigned = (vnp_Params) => {
    const params = { ...vnp_Params };
    delete params.vnp_SecureHash;
    delete params.vnp_SecureHashType;

    const sortedParams = sortObject(params);
    const secretKey = envConfig.VN_PAY_CONFIG.vnp_HashSecret;
    const signData = querystring.stringify(sortedParams, { encode: false });

    return crypto.createHmac('sha512', secretKey).update(Buffer.from(signData, 'utf-8')).digest('hex');
};

export const createVpnUrl = ({ ipAddr, amount, bankCode, locale, orderId, vnPayReturnUrl }) => {
    process.env.TZ = 'Asia/Ho_Chi_Minh';
    const createDate = moment(new Date()).format('YYYYMMDDHHmmss');

    const vnp_Params = {
        vnp_Version: '2.1.0',
        vnp_Command: 'pay',
        vnp_TmnCode: envConfig.VN_PAY_CONFIG.vnpTmnCode,
        vnp_Locale: locale,
        vnp_CurrCode: 'VND',
        vnp_TxnRef: orderId,
        vnp_OrderInfo: `Thanh toan cho ma GD:${orderId}`,
        vnp_OrderType: 'other',
        vnp_Amount: amount * 100,
        vnp_ReturnUrl: vnPayReturnUrl,
        vnp_IpAddr: ipAddr,
        vnp_CreateDate: createDate,
    };

    if (bankCode !== null && bankCode !== '') {
        vnp_Params.vnp_BankCode = bankCode;
    }

    const sortedParams = sortObject(vnp_Params);
    const signed = buildSigned(vnp_Params);
    sortedParams.vnp_SecureHash = signed;

    return `${envConfig.VN_PAY_CONFIG.vnp_Url}?${querystring.stringify(sortedParams, { encode: false })}`;
};
