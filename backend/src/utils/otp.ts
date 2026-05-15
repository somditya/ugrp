import crypto from 'crypto';
import { getRedis } from './redis';

const RATE_LIMIT_WINDOW = 3600; // 1 hour
const RATE_LIMIT_MAX = 10; // 10 OTP requests per mobile per hour
const MAX_OTP_ATTEMPTS = 5;
const LOGIN_LOCKOUT_SECONDS = 1800; // 30 minutes

// ── OTP Generation ──

export function generateOTP(): string {
  return crypto.randomInt(100000, 999999).toString();
}

// ── Rate Limiting (Redis-backed, survives restarts) ──

export async function checkOtpRateLimit(mobile: string): Promise<boolean> {
  const redis = getRedis();
  const key = `otp_rate:${mobile}`;
  const current = await redis.incr(key);
  if (current === 1) {
    await redis.expire(key, RATE_LIMIT_WINDOW);
  }
  return current <= RATE_LIMIT_MAX;
}

export async function getRateLimitRemaining(mobile: string): Promise<number> {
  const redis = getRedis();
  const count = await redis.get(`otp_rate:${mobile}`);
  return Math.max(0, RATE_LIMIT_MAX - parseInt(count || '0', 10));
}

// ── OTP Storage & Verification (with attempt counter) ──

export async function storeOtp(universityId: string, otp: string): Promise<void> {
  const redis = getRedis();
  await redis.set(`otp:${universityId}`, JSON.stringify({ otp, attempts: 0 }), 'EX', 600);
}

export async function verifyOtp(universityId: string, otp: string): Promise<{
  valid: boolean;
  error?: 'expired' | 'too_many_attempts' | 'invalid';
  lockedUntil?: number;
}> {
  const redis = getRedis();
  const raw = await redis.get(`otp:${universityId}`);

  if (!raw) {
    return { valid: false, error: 'expired' };
  }

  const record = JSON.parse(raw);

  // Brute-force check
  if (record.attempts >= MAX_OTP_ATTEMPTS) {
    // Lock the account
    await redis.set(`otp_lock:${universityId}`, '1', 'EX', LOGIN_LOCKOUT_SECONDS);
    await redis.del(`otp:${universityId}`);
    return {
      valid: false,
      error: 'too_many_attempts',
      lockedUntil: Date.now() + LOGIN_LOCKOUT_SECONDS * 1000,
    };
  }

  // Check if there's an active lock from a previous session
  const locked = await redis.get(`otp_lock:${universityId}`);
  if (locked) {
    return {
      valid: false,
      error: 'too_many_attempts',
      lockedUntil: Date.now() + LOGIN_LOCKOUT_SECONDS * 1000,
    };
  }

  // Increment attempt counter
  record.attempts += 1;

  if (record.otp !== otp) {
    // Update attempts, keep key alive
    await redis.set(`otp:${universityId}`, JSON.stringify(record), 'EX', 600);
    return { valid: false, error: 'invalid' };
  }

  // OTP matches — clean up
  await redis.del(`otp:${universityId}`);
  return { valid: true };
}

export async function generateAndStoreOtp(universityId: string): Promise<string> {
  const otp = generateOTP();
  await storeOtp(universityId, otp);
  return otp;
}

// ── Refresh Token Storage (Redis hash) ──

export async function storeRefreshTokenHash(userId: string, tokenHash: string, ttlSeconds: number): Promise<void> {
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

// ── Token Blocklist ──

export async function blocklistToken(jti: string, ttl: number): Promise<void> {
  const redis = getRedis();
  await redis.set(`blocklist:${jti}`, '1', 'EX', ttl);
}

export async function isTokenBlocked(jti: string): Promise<boolean> {
  const redis = getRedis();
  return (await redis.get(`blocklist:${jti}`)) === '1';
}

// ── OTP Lock Status ──

export async function isOtpLocked(universityId: string): Promise<number | null> {
  const redis = getRedis();
  const ttl = await redis.ttl(`otp_lock:${universityId}`);
  return ttl > 0 ? ttl : null;
}