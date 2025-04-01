import { Router } from 'express';
import { reviewControllers } from '../controllers/index.js';
import { authenticate } from '../middleware/authenticateMiddleware.js';
import { authorsize } from '../middleware/authorizeMiddleware.js';
import { ROLE } from '../constants/role.js';

const ReviewRouter = Router();

// Get
ReviewRouter.get('/all', reviewControllers.getAllAdminReviews);
ReviewRouter.get('/detail/:id', reviewControllers.getProductDetailReviews);
ReviewRouter.get('/all/:id', reviewControllers.getAllReviewByProductId);

// Post
ReviewRouter.post('/', authenticate, authorsize(ROLE.ADMIN), reviewControllers.createReview);

export default ReviewRouter;
