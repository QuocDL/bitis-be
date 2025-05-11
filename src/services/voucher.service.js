/**
 * Service to create a new voucher
 * @param {Object} voucherData - Voucher data
 * @returns {Promise<Object>} - Created voucher
 */
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
    isOnlyForNewUser = false,
  } = voucherData;

  const currentDate = new Date();

  const existingVoucherByName = await Voucher.findOne({ name, isOnlyForNewUser });
 

  const newVoucher = await Voucher.create({
    startDate,
    endDate,
    name,
    voucherDiscount,
    minimumOrderPrice,
    status,
    isOnlyForNewUser,
    code: code || generateVoucherCode(),
    maxUsage,
    usagePerUser,
    discountType: discountType || 'percentage',
    maxDiscountAmount: discountType === 'percentage' ? maxDiscountAmount : 0,
  });

  return newVoucher;
};
