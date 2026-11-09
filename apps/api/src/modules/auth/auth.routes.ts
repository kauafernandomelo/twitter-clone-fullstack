import { Router } from 'express';

import { authRateLimit } from '../../middlewares/rate-limit';
import { requireAuth } from '../../middlewares/require-auth';
import * as authController from './auth.controller';

export const authRouter = Router();

authRouter.post('/register', authRateLimit, authController.register);
authRouter.post('/login', authRateLimit, authController.login);
authRouter.post('/demo', authRateLimit, authController.loginAsDemo);
authRouter.post('/refresh', authController.refresh);
authRouter.post('/logout', authController.logout);
authRouter.get('/me', requireAuth, authController.me);
