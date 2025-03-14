import { Router } from 'express';
import { colorControllers } from '../controllers/index.js';
import { authenticate } from '../middleware/authenticateMiddleware.js';
import { authorsize } from '../middleware/authorizeMiddleware.js';
import { ROLE } from '../constants/role.js';

import { createColorValidation, updateColorValidation } from '../validations/color/index.js';

const router = Router();

// @Get
router.get('/all', colorControllers.getAllColors);
router.get('/:id', colorControllers.getDetailedColor);

// @Patch
router.patch('/:id', authenticate, authorsize(ROLE.ADMIN), [updateColorValidation], colorControllers.updateColor);

// @Post
router.post('/', authenticate, authorsize(ROLE.ADMIN), [createColorValidation], colorControllers.createColor);
export default router;
