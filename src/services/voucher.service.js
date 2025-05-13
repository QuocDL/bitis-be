import { BadRequestError } from "../errors/customError.js";
import voucher from "../models/voucher.js";
import { generateCode } from "../utils/gennerateCode.js";

export const createVoucher = async (voucherData) => {
  const {
    startDate,
    endDate,
    name,
    voucherDiscount,
    minimumOrderPrice,
    status,
    maxUsage,
    usagePerUser,
    discountType,
    maxDiscountAmount,
    code,
  } = voucherData;

  const currentDate = new Date();

  const existingVoucherByName = await voucher.findOne({ name, isOnlyForNewUser });
  if (existingVoucherByName) {
    throw new BadRequestError('Tên voucher đã tồn tại');
  }

  const existingVoucherByCode = await Voucher.findOne({ code });
  if (existingVoucherByCode) {
    throw new BadRequestError('Mã voucher đã tồn tại');
  }

  if (maxUsage <= 0) {
    throw new BadRequestError('Số lần sử dụng tối đa phải lớn hơn 0');
  }

  if (minimumOrderPrice <= 0) {
    throw new BadRequestError('Giá trị đơn hàng tối thiểu phải lớn hơn 0');
  }

  if (usagePerUser <= 0) {
    throw new BadRequestError('Số lần sử dụng mỗi người phải lớn hơn 0');
  }

  if (new Date(startDate) < currentDate || new Date(endDate) < currentDate) {
    throw new BadRequestError('Ngày bắt đầu và ngày kết thúc phải sau ngày hiện tại');
  }

  if (new Date(startDate) >= new Date(endDate)) {
    throw new BadRequestError('Ngày bắt đầu phải trước ngày kết thúc');
  }

  if (discountType === 'percentage' && (voucherDiscount <= 0 || voucherDiscount > 100)) {
    throw new BadRequestError('Phần trăm giảm giá phải lớn hơn 0 và không vượt quá 100');
  }

  if (discountType === 'percentage' && (!maxDiscountAmount || maxDiscountAmount <= 0)) {
    throw new BadRequestError('Giá trị giảm giá tối đa phải lớn hơn 0 khi sử dụng phần trăm');
  }

  if (discountType === 'fixed' && voucherDiscount <= 0) {
    throw new BadRequestError('Giá trị giảm giá phải lớn hơn 0');
  }

  if (discountType === 'fixed' && voucherDiscount >= minimumOrderPrice) {
    throw new BadRequestError('Giá trị giảm giá phải nhỏ hơn giá trị đơn hàng tối thiểu');
  }

  const newVoucher = await voucher.create({
    startDate,
    endDate,
    name,
    voucherDiscount,
    minimumOrderPrice,
    status,
    code: code || generateCode(),
    maxUsage,
    usagePerUser,
    discountType: discountType || 'percentage',
    maxDiscountAmount: discountType === 'percentage' ? maxDiscountAmount : 0,
  });

  return newVoucher;
};


export const updateVoucher = async (id, voucherData) => {
  const {
    startDate,
    endDate,
    name,
    voucherDiscount,
    minimumOrderPrice,
    status,
    maxUsage,
    usagePerUser,
    discountType,
    maxDiscountAmount,
    resetCode,
  } = voucherData;

  const currentDate = new Date();

  const existingVoucher = await voucher.findById(id);

  if (!existingVoucher) {
    throw new BadRequestError('Voucher không tồn tại');
  }

  const existingVoucherByName = await voucher.findOne({
    name,
    _id: { $ne: id },
    isOnlyForNewUser
  });

  if (existingVoucherByName) {
    throw new BadRequestError('Tên voucher đã tồn tại');
  }

  if (maxUsage <= 0) {
    throw new BadRequestError('Số lần sử dụng tối đa phải lớn hơn 0');
  }

  if (minimumOrderPrice <= 0) {
    throw new BadRequestError('Giá trị đơn hàng tối thiểu phải lớn hơn 0');
  }

  if (usagePerUser <= 0) {
    throw new BadRequestError('Số lần sử dụng mỗi người phải lớn hơn 0');
  }

  if (new Date(endDate) < currentDate) {
    throw new BadRequestError('Ngày kết thúc phải sau ngày hiện tại');
  }

  if (new Date(startDate) >= new Date(endDate)) {
    throw new BadRequestError('Ngày bắt đầu phải trước ngày kết thúc');
  }

  if (discountType === 'percentage' && (voucherDiscount <= 0 || voucherDiscount > 100)) {
    throw new BadRequestError('Phần trăm giảm giá phải lớn hơn 0 và không vượt quá 100');
  }

  if (discountType === 'percentage' && (!maxDiscountAmount || maxDiscountAmount <= 0)) {
    throw new BadRequestError('Giá trị giảm giá tối đa phải lớn hơn 0 khi sử dụng phần trăm');
  }

  if (discountType === 'fixed' && voucherDiscount <= 0) {
    throw new BadRequestError('Giá trị giảm giá phải lớn hơn 0');
  }

  if (discountType === 'fixed' && voucherDiscount >= minimumOrderPrice) {
    throw new BadRequestError('Giá trị giảm giá phải nhỏ hơn giá trị đơn hàng tối thiểu');
  }

  existingVoucher.name = name;
  existingVoucher.voucherDiscount = voucherDiscount;
  existingVoucher.usagePerUser = usagePerUser;
  existingVoucher.startDate = startDate;
  existingVoucher.endDate = endDate;
  existingVoucher.maxUsage = maxUsage;
  existingVoucher.minimumOrderPrice = minimumOrderPrice;
  existingVoucher.status = status;
  existingVoucher.discountType = discountType || 'percentage';
  existingVoucher.maxDiscountAmount = discountType === 'percentage' ? maxDiscountAmount : 0;

  if (resetCode) {
    existingVoucher.code = generateCode();
  }

  await existingVoucher.save();

  return existingVoucher;
};


export const updateVoucherStatus = async (id) => {
  const existingVoucher = await voucher.findById(id);

  if (!existingVoucher) {
    throw new BadRequestError('Voucher không tồn tại');
  }

  existingVoucher.status = !existingVoucher.status;
  await existingVoucher.save();

  return existingVoucher;
};
