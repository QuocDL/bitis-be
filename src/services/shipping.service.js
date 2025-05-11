import request from '../config/axios.js';
import { envConfig } from '../config/env.js';
import { ENDPOINT } from '../constants/endpoint.js';
import { HTTP_METHOD } from '../constants/http.js';

// Helper function to handle API requests with consistent error handling
const makeApiRequest = async (method, url, options = {}) => {
    try {
        const response = await request({
            method,
            url,
            ...options,
        });
        return response;
    } catch (error) {
        console.error('API request failed:', error);
        throw error; // Re-throw to allow caller to handle the error
    }
};

export const getProvince = () => {
    return makeApiRequest(HTTP_METHOD.GET, ENDPOINT.GET_PROVINCE);
};

export const getDistrict = (provinceId) => {
    return makeApiRequest(HTTP_METHOD.GET, ENDPOINT.GET_DISTRICT, {
        data: { province_id: JSON.parse(provinceId) }
    });
};

export const getWard = (districtId) => {
    return makeApiRequest(HTTP_METHOD.GET, ENDPOINT.GET_WARD, {
        params: { district_id: JSON.parse(districtId) }
    });
};

export const getService = (toDistrict) => {
    return makeApiRequest(HTTP_METHOD.GET, ENDPOINT.GET_SERVICE, {
        params: {
            shop_id: envConfig.shipping.shopId,
            from_district: envConfig.shipping.fromDistrictId,
            to_district: JSON.parse(toDistrict)
        }
    });
};

export const calculateShippingFee = (queryParams) => {
    const { serviceId, toDistrictId, toWardCode } = queryParams;

    const params = {
        from_district_id: +envConfig.shipping.fromDistrictId,
        from_ward_code: +envConfig.shipping.fromWardCode,
        service_id: JSON.parse(serviceId),
        to_district_id: JSON.parse(toDistrictId),
        to_ward_code: toWardCode,
        height: 50,
        length: 20,
        weight: 200,
        width: 20,
    };

    return makeApiRequest(HTTP_METHOD.GET, ENDPOINT.CALCULATE_SHIPPING_FEE, { params });
};

export const getPickShift = () => {
    return makeApiRequest(HTTP_METHOD.GET, ENDPOINT.GET_PICK_SHIFT);
};

export const createOrder = (orderData) => {
    return makeApiRequest(HTTP_METHOD.POST, ENDPOINT.CREATE_ORDER, { data: orderData });
};
