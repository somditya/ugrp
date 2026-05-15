import { z } from 'zod';
import { Role } from '@prisma/client';

const VALID_ROLES = [
  Role.STUDENT,
  Role.TEACHING,
  Role.NON_TEACHING,
  Role.COMMITTEE,
  Role.ADMIN,
  Role.REGISTRAR,
  Role.HOD,
];

export const registerValidator = z.object({
  universityId: z.string().min(4).max(20),
  role: z.enum(VALID_ROLES),
  mobile: z.string().regex(/^[6-9]\d{9}$/, 'Invalid mobile number'),
  email: z.string().email(),
});

export const verifyOtpValidator = z.object({
  universityId: z.string().min(4).max(20),
  otp: z.string().regex(/^\d{6}$/, 'OTP must be 6 digits'),
});

export const refreshValidator = z.object({
  refreshToken: z.string().min(10),
});

export const logoutValidator = z.object({
  refreshToken: z.string().min(10),
});

export const ssoValidator = z.object({
  universityId: z.string().min(4).max(20),
  password: z.string().min(1),
});

export function validateBody(schema: z.ZodSchema) {
  return (req: any, _res: any, next: (err?: any) => void) => {
    try {
      req.body = schema.parse(req.body);
      next();
    } catch (err: any) {
      err.status = 422;
      err.code = 'VALIDATION_ERROR';
      err.details = err.issues || err.errors || undefined;
      next(err);
    }
  };
}