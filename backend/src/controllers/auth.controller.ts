import { Request, Response, NextFunction } from 'express';
import { prisma } from '@database/prisma/client';
import { Role } from '@prisma/client';
import {
  validateUniversityId,
  validateRoleMatch,
  checkOtpRateLimit,
  generateAndStoreOtp,
  verifyStoredOtp,
  signTokenPair,
  verifyRefreshToken,
  verifyAccessToken,
  isTokenBlocked,
  blocklistToken,
  revokeRefreshTokenHash,
  hashToken,
  storeRefreshTokenHash,
  getStoredRefreshHash,
} from '@services/authService';

// ── Register (step 1) ──
export async function register(req: Request, res: Response, next: NextFunction) {
  try {
    const { universityId, role, mobile, email } = req.body;

    const erpUser = validateUniversityId(universityId);
    if (!erpUser) {
      const err = new Error('University ID not found in our records') as any;
      err.status = 422;
      return next(err);
    }

    if (!validateRoleMatch(universityId, role)) {
      const err = new Error('Role does not match university records') as any;
      err.status = 400;
      return next(err);
    }

    const allowed = await checkOtpRateLimit(mobile);
    if (!allowed) {
      const err = new Error('Too many OTP requests. Try again in 1 hour.') as any;
      err.status = 429;
      return next(err);
    }

    const otp = await generateAndStoreOtp(universityId);

    console.log(`[OTP] universityId=${universityId} otp=${otp} expires=600s`);

    res.status(200).json({
      message: 'OTP sent',
      expiresIn: 600,
    });
  } catch (err) {
    next(err);
  }
}

// ── Verify OTP (step 2) ──
export async function verifyOtp(req: Request, res: Response, next: NextFunction) {
  try {
    const { universityId, otp } = req.body;

    const result = await verifyStoredOtp(universityId, otp);
    if (!result.valid) {
      const err = new Error(result.error === 'expired' ? 'OTP expired or not found' : 'Invalid OTP') as any;
      err.status = 401;
      if (result.lockedUntil) (err as any).lockedUntil = result.lockedUntil;
      return next(err);
    }

    const erpUser = validateUniversityId(universityId);
    if (!erpUser) {
      const err = new Error('University ID not found') as any;
      err.status = 404;
      return next(err);
    }

    let user = await prisma.user.findUnique({ where: { universityId } });
    if (!user) {
      user = await prisma.user.create({
        data: {
          universityId,
          role: erpUser.role,
          name: erpUser.name,
          email: erpUser.email,
          mobile: erpUser.mobile,
          passwordHash: '',
          department: {
            connect: { code: erpUser.department },
          },
        },
      });
    } else {
      await prisma.user.update({
        where: { universityId },
        data: {
          name: erpUser.name,
          email: erpUser.email,
          mobile: erpUser.mobile,
          role: erpUser.role,
        },
      });
      user = await prisma.user.findUniqueOrThrow({ where: { universityId } });
    }

    const tokenPair = signTokenPair({
      sub: user.id,
      universityId: user.universityId,
      role: user.role,
      departmentId: user.departmentId,
    });

    const tokenHash = await hashToken(tokenPair.refreshToken);
    await storeRefreshTokenHash(user.id, tokenHash);

    res.json({
      accessToken: tokenPair.accessToken,
      refreshToken: tokenPair.refreshToken,
      user: {
        id: user.id,
        name: user.name,
        role: user.role,
        department: user.department?.name || null,
      },
    });
  } catch (err: any) {
    if (err.code === 'P2025') {
      err.status = 404;
      err.message = 'User not found';
    }
    next(err);
  }
}

// ── Refresh Access Token ──
export async function refresh(req: Request, res: Response, next: NextFunction) {
  try {
    const { refreshToken } = req.body;

    let payload: any;
    try {
      payload = verifyRefreshToken(refreshToken);
    } catch (e) {
      const err = new Error('Invalid or expired refresh token') as any;
      err.status = 401;
      return next(err);
    }

    if (payload.jti && (await isTokenBlocked(payload.jti))) {
      const err = new Error('Refresh token revoked') as any;
      err.status = 401;
      return next(err);
    }

    const storedHash = await getStoredRefreshHash(payload.sub);
    const providedHash = await hashToken(refreshToken);

    if (!storedHash || storedHash !== providedHash) {
      const err = new Error('Invalid refresh token') as any;
      err.status = 401;
      return next(err);
    }

    const newTokenPair = signTokenPair({
      sub: payload.sub,
      universityId: payload.universityId,
      role: payload.role,
      departmentId: payload.departmentId,
    });

    const newHash = await hashToken(newTokenPair.refreshToken);
    await storeRefreshTokenHash(payload.sub, newHash);
    await blocklistToken(payload.jti, 7 * 24 * 3600);

    res.json({
      accessToken: newTokenPair.accessToken,
      refreshToken: newTokenPair.refreshToken,
    });
  } catch (err: any) {
    err.status = 401;
    err.message = err.message || 'Invalid or expired refresh token';
    next(err);
  }
}

// ── Logout ──
export async function logout(req: Request, res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      const err = new Error('No token provided') as any;
      err.status = 400;
      return next(err);
    }

    const accessToken = authHeader.split(' ')[1];

    try {
      const payload = verifyAccessToken(accessToken);

      if (payload.jti) {
        const now = Math.floor(Date.now() / 1000);
        const expiresAt = payload.exp as number;
        const remainingTtl = Math.max(0, expiresAt - now);

        if (remainingTtl > 0) {
          await blocklistToken(payload.jti as string, remainingTtl);
        }
      }
    } catch {
      // Token expired — nothing to block
    }

    if (req.body.refreshToken) {
      try {
        const payload = verifyRefreshToken(req.body.refreshToken);
        await revokeRefreshTokenHash(payload.sub as string);
        if (payload.jti) {
          await blocklistToken(payload.jti as string, 7 * 24 * 3600);
        }
      } catch {
        // Invalid refresh token — continue with logout
      }
    }

    res.json({ message: 'Logged out' });
  } catch (err) {
    next(err);
  }
}

// ── SSO Login (stub) ──
export async function ssoLogin(req: Request, res: Response, next: NextFunction) {
  try {
    const { universityId, password } = req.body;

    const erpUser = validateUniversityId(universityId);
    if (!erpUser) {
      const err = new Error('Invalid credentials') as any;
      err.status = 401;
      return next(err);
    }

    // Stub: password check disabled for mock
    // In production: verify against LDAP

    let user = await prisma.user.findUnique({ where: { universityId } });
    if (!user) {
      user = await prisma.user.create({
        data: {
          universityId,
          role: erpUser.role,
          name: erpUser.name,
          email: erpUser.email,
          mobile: erpUser.mobile,
          passwordHash: '',
          department: {
            connect: { code: erpUser.department },
          },
        },
      });
    }

    const tokenPair = signTokenPair({
      sub: user.id,
      universityId: user.universityId,
      role: user.role,
      departmentId: user.departmentId,
    });

    const tokenHash = await hashToken(tokenPair.refreshToken);
    await storeRefreshTokenHash(user.id, tokenHash);

    res.json({
      accessToken: tokenPair.accessToken,
      refreshToken: tokenPair.refreshToken,
      user: {
        id: user.id,
        name: user.name,
        role: user.role,
        department: user.department?.name || null,
      },
    });
  } catch (err) {
    next(err);
  }
}