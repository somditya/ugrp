import { Router } from 'express';
import asyncHandler from '@utils/asyncHandler';
import {
  register,
  verifyOtp,
  refresh,
  logout,
  ssoLogin,
} from '@controllers/authController';
import {
  validateBody,
  registerValidator,
  verifyOtpValidator,
  refreshValidator,
  logoutValidator,
  ssoValidator,
} from '@validators/authValidator';

const router = Router();

router.post('/register', validateBody(registerValidator), asyncHandler(register));
router.post('/verify-otp', validateBody(verifyOtpValidator), asyncHandler(verifyOtp));
router.post('/refresh', validateBody(refreshValidator), asyncHandler(refresh));
router.post('/logout', validateBody(logoutValidator), asyncHandler(logout));
router.post('/sso', validateBody(ssoValidator), asyncHandler(ssoLogin));

export { router as authRouter };