import Voucher from '../models/voucher.js';
import UsedVoucher from '../models/usedVoucher.js';
import User from '../models/user.js';
import { BadRequestError } from '../errors/customError.js';

export const checkVoucherIsValid = async (
  voucherCode,
  userId,
  totalPriceNoShip,
  shippingFee,
) => {
  const [voucherData, currentUser] = await Promise.all([
    Voucher.findOne({ code: voucherCode }).lean(),
    User.findById(userId).lean(),
  ]);

  if (!voucherCode) {
    return {
      voucherName: '',
      voucherDiscount: 0,
      code: '',
      discountType: '',
      maxDiscountAmount: 0,
      totalPrice: totalPriceNoShip,
      isNew: false,
    };
  }

  if (!voucherData) {
    throw new BadRequestError(`Voucher đã hết hạn quý khách vui lòng chọn voucher khác`);
  }

  if (!currentUser) {
    throw new BadRequestError(`Người dùng không tồn tại`);
  }

  

  const now = new Date();
  const startDate = new Date(voucherData.startDate);
  const endDate = new Date(voucherData.endDate);

  if (totalPriceNoShip < voucherData.minimumOrderPrice) {
    throw new BadRequestError(`Đơn hàng của bạn không đủ điều kiện sử dụng voucher ${voucherCode}`);
  }

  if (startDate > now || endDate < now) {
    throw new BadRequestError(`Voucher ${voucherCode} đã hết hạn quý khách vui lòng chọn voucher khác`);
  }

  if (voucherData.status === false) {
    throw new BadRequestError(`Voucher ${voucherCode} đã hết hạn quý khách vui lòng chọn voucher khác`);
  }

  const userVoucher = await UsedVoucher.findOne({ userId, voucherCode: voucherCode });

  if (!userVoucher) {
    await UsedVoucher.create({
      userId: userId,
      voucherCode: voucherCode,
      usageCount: 1,
    });
  } else {
    if (userVoucher && userVoucher.usageCount >= voucherData.usagePerUser) {
      throw new BadRequestError(`Voucher ${voucherCode} đã hết lượt sử dụng`);
    }
    userVoucher.usageCount = userVoucher.usageCount + 1;
    await userVoucher.save();
  }

  let actualDiscount = voucherData.voucherDiscount;
  if (voucherData.discountType === 'percentage') {
    const calculatedDiscount = Math.min(totalPriceNoShip * (voucherData.voucherDiscount / 100));

    if (voucherData.maxDiscountAmount > 0 && calculatedDiscount > voucherData.maxDiscountAmount) {
      actualDiscount = voucherData.maxDiscountAmount;
    } else {
      actualDiscount = calculatedDiscount;
    }
  }
  const totalPrice = totalPriceNoShip - actualDiscount + shippingFee;

  return {
    voucherName: voucherData.name,
    voucherDiscount: actualDiscount,
    code: voucherCode,
    discountType: voucherData.discountType,
    maxDiscountAmount: voucherData.maxDiscountAmount || 0,
    totalPrice,
    isNew: voucherData.isOnlyForNewUser,
  };
};


export const rollbackVoucher = async (voucherCode, userId) => {
  const usedVoucher = await UsedVoucher.findOne({
    userId: userId,
    voucherCode: voucherCode,
  });

  if (usedVoucher) {
    if (usedVoucher.usageCount > 1) {
      usedVoucher.usageCount = usedVoucher.usageCount - 1;
      await usedVoucher.save();
    } else {
      await UsedVoucher.deleteOne({ userId: userId, voucherCode: voucherCode });
    }
  }
};
