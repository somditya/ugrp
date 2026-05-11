import IORedis from 'ioredis';
import { logger } from './logger';

let redis: IORedis | null = null;

export async function connectRedis(): Promise<IORedis> {
  if (redis) return redis;

  redis = new IORedis(process.env.REDIS_URL || 'redis://localhost:6379');

  redis.on('error', (err) => {
    logger.error('Redis error:', err);
  });

  redis.on('connect', () => {
    logger.info('Redis connected');
  });

  await redis.ping();
  return redis;
}

export function getRedis(): IORedis {
  if (!redis) throw new Error('Redis not initialized. Call connectRedis() first.');
  return redis;
}
