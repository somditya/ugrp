import { Router } from 'express';
import asyncHandler from '@utils/asyncHandler';
import { register } from '@controllers/auth.controller';
import { login } from '@controllers/auth.controller';
import { logout } from '@controllers/auth.controller';
import { me } from '@controllers/auth.controller';
import { validateRequest } from '@middleware/validateRequest';
import { z } from 'zod';

const router = Router();

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().min(2),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

router.post('/register', validateRequest(registerSchema), asyncHandler(register));
router.post('/login', validateRequest(loginSchema), asyncHandler(login));
router.post('/logout', asyncHandler(logout));
router.get('/me', asyncHandler(me));

export { router as authRouter };
