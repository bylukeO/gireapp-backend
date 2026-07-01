import { Router } from 'express';
import { register, login, logout } from '../controllers/auth.controller';
import { authLimiter } from '../middlewares/rateLimit.middleware';

const router = Router();

// /api/auth/register
router.post('/register', authLimiter, register);

// /api/auth/login
router.post('/login', authLimiter, login);

// /api/auth/logout
router.post('/logout', logout);

export default router;
