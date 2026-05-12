import { Router } from 'express';
import asyncHandler from '@utils/asyncHandler';
import { register, login, logout, me } from '@controllers/auth.controller';
import { validateRequest } from '@middleware/validateRequest';
import { z } from 'zod';

const router = Router();

const registerSchema = z.object({
  universityId: z.string(),
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().min(2),
  role: z.enum(['STUDENT', 'TEACHING', 'NON_TEACHING', 'COMMITTEE', 'ADMIN', 'REGISTRAR', 'HOD']),
  departmentId: z.string().optional(),
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
