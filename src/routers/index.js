import { Router } from 'express';
import productRouter from './product.routes.js';

import authRouter from './auth.routes.js';
import sizeRouter from './size.routes.js';

const router = Router();

router.use('/auth', authRouter);
router.use('/products', productRouter);
router.use('/sizes', sizeRouter);
router.use('/colors', colorRouter);
router.use('/users', userRouter);

export default router;
