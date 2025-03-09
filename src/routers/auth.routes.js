import { Router } from "express";
import { authControllers } from '../controllers/index.js';

const router = Router();

// @Post
router.post("/register", authControllers.register);
router.post("/login", authControllers.login);

export default router;
