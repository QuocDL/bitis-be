import express from 'express';
import { authenticate } from '../middleware/authenticateMiddleware.js';
import * as voucherController from '../controllers/voucher.controllers.js';

const router = express.Router();

// User accessible routes
router.get('/all', authenticate, voucherController.getAllVouchers);
router.get('/details/:id', authenticate, voucherController.getVoucherById);
router.get('/admin/all', authenticate, voucherController.getAllVouchers); // You may want to add authorization here

// Admin/management routes
router.post('/create', authenticate, voucherController.createVoucher);
router.put('/update/:id', authenticate, voucherController.updateVoucher);
router.patch('/update-status/:id', authenticate, voucherController.updateVoucherStatus);
router.delete('/:id', authenticate, voucherController.deleteVoucher);

export default router;
