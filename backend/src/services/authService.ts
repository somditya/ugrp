import crypto from 'crypto';
import { getRedis } from '@utils/redis';
import { Role } from '@prisma/client';
import jwt from 'jsonwebtoken';

const JWT_ACCESS_SECRET = process.env.JWT_SECRET || 'change-me-access';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'change-me-refresh';
const JWT_ACCESS_EXPIRATION = '8h';
const JWT_REFRESH_EXPIRATION = '7d';

const RATE_LIMIT_WINDOW = 3600;
const RATE_LIMIT_MAX = 10;
const MAX_OTP_ATTEMPTS = 5;
const LOGIN_LOCKOUT_SECONDS = 1800;

interface ErpUser {
  universityId: string;
  name: string;
  role: Role;
  department: string;
  email: string;
  mobile: string;
}

const erpUsers: Record<string, ErpUser> = require('@mocks/erp-users.json');

export function validateUniversityId(universityId: string): ErpUser | null {
  const user = erpUsers[universityId];
  return user || null;
}

export function validateRoleMatch(universityId: string, role: Role): boolean {
  const erpUser = validateUniversityId(universityId);
  return erpUser?.role === role;
}

export async function checkOtpRateLimit(mobile: string): Promise<boolean> {
  const redis = getRedis();
  const key = `otp_rate:${mobile}`;
  const current = await redis.incr(key);
  if (current === 1) {
    await redis.expire(key, RATE_LIMIT_WINDOW);
  }
  return current <= RATE_LIMIT_MAX;
}

export async function generateAndStoreOtp(universityId: string): Promise<string> {
  const otp = crypto.randomInt(100000, 999999).toString();
  const redis = getRedis();
  await redis.set(`otp:${universityId}`, JSON.stringify({ otp, attempts: 0 }), 'EX', 600);
  return otp;
}

export async function verifyStoredOtp(
  universityId: string,
  otp: string
): Promise<{ valid: boolean; error?: 'expired' | 'too_many_attempts' | 'invalid'; lockedUntil?: number }> {
  const redis = getRedis();
  const raw = await redis.get(`otp:${universityId}`);

  if (!raw) {
    return { valid: false, error: 'expired' };
  }

  const record = JSON.parse(raw);

  const locked = await redis.get(`otp_lock:${universityId}`);
  if (locked) {
    return { valid: false, error: 'too_many_attempts', lockedUntil: Date.now() + LOGIN_LOCKOUT_SECONDS * 1000 };
  }

  if (record.attempts >= MAX_OTP_ATTEMPTS) {
    await redis.set(`otp_lock:${universityId}`, '1', 'EX', LOGIN_LOCKOUT_SECONDS);
    await redis.del(`otp:${universityId}`);
    return { valid: false, error: 'too_many_attempts', lockedUntil: Date.now() + LOGIN_LOCKOUT_SECONDS * 1000 };
  }

  record.attempts += 1;

  if (record.otp !== otp) {
    await redis.set(`otp:${universityId}`, JSON.stringify(record), 'EX', 600);
    return { valid: false, error: 'invalid' };
  }

  await redis.del(`otp:${universityId}`);
  return { valid: true };
}

export function signAccessToken(payload: { sub: string; universityId: string; role: Role; departmentId?: string | null }): string {
  const jti = crypto.randomUUID();
  const token = jwt.sign({ ...payload, jti }, JWT_ACCESS_SECRET, { expiresIn: JWT_ACCESS_EXPIRATION });
  return token;
}

export function signRefreshToken(payload: { sub: string; universityId: string; role: Role; departmentId?: string | null }): string {
  const jti = crypto.randomUUID();
  const token = jwt.sign({ ...payload, jti }, JWT_REFRESH_SECRET, { expiresIn: JWT_REFRESH_EXPIRATION });
  return token;
}

export function signTokenPair(payload: { sub: string; universityId: string; role: Role; departmentId?: string | null }) {
  return {
    accessToken: signAccessToken(payload),
    refreshToken: signRefreshToken(payload),
  };
}

export function verifyAccessToken(token: string): jwt.JwtPayload {
  return jwt.verify(token, JWT_ACCESS_SECRET) as jwt.JwtPayload;
}

export function verifyRefreshToken(token: string): jwt.JwtPayload {
  return jwt.verify(token, JWT_REFRESH_SECRET) as jwt.JwtPayload;
}

export async function storeRefreshTokenHash(userId: string, tokenHash: string, ttlSeconds: number = 7 * 24 * 3600): Promise<void> {
  const redis = getRedis();
  await redis.hset(`refresh:${userId}`, 'hash', tokenHash);
  await redis.expire(`refresh:${userId}`, ttlSeconds);
}

export async function getStoredRefreshHash(userId: string): Promise<string | null> {
  const redis = getRedis();
  return redis.hget(`refresh:${userId}`, 'hash');
}

export async function revokeRefreshTokenHash(userId: string): Promise<void> {
  const redis = getRedis();
  await redis.del(`refresh:${userId}`);
}

export async function blocklistToken(jti: string, ttl: number): Promise<void> {
  const redis = getRedis();
  await redis.set(`blocklist:${jti}`, '1', 'EX', ttl);
}

export async function isTokenBlocked(jti: string): Promise<boolean> {
  const redis = getRedis();
  return (await redis.get(`blocklist:${jti}`)) === '1';
}

export async function hashToken(token: string): Promise<string> {
  return crypto.createHash('sha256').update(token).digest('hex');
}

export async function getRateLimitRemaining(mobile: string): Promise<number> {
  const redis = getRedis();
  const count = await redis.get(`otp_rate:${mobile}`);
  return Math.max(0, RATE_LIMIT_MAX - parseInt(count || '0', 10));
}

export async function isOtpLocked(universityId: string): Promise<number | null> {
  const redis = getRedis();
  const ttl = await redis.ttl(`otp_lock:${universityId}`);
  return ttl > 0 ? ttl : null;
}