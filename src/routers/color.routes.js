import { Router } from 'express';
import { colorControllers } from '../controllers/index.js';
import { authenticate } from '../middleware/authenticateMiddleware.js';
import { authorsize } from '../middleware/authorizeMiddleware.js';
import { ROLE } from '../constants/role.js';

import { createColorValidation, updateColorValidation } from '../validations/color/index.js';

const router = Router();

// @Get
router.get('/all', colorControllers.getAllColors);

export default router;
