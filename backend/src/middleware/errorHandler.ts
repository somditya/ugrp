import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';

export function errorHandler(
  err: Error & { status?: number; code?: string; details?: any },
  _req: Request,
  res: Response,
  _next: NextFunction
) {
  const status = err.status || 500;
  const message = status === 500 ? 'Internal Server Error' : err.message;

  logger.error(`${status} — ${err.message}`, { stack: err.stack });

  res.status(status).json({
    error: message,
    ...(err.code && { code: err.code }),
    ...(err.details && { details: err.details }),
    ...(process.env.NODE_ENV !== 'production' && { stack: err.stack }),
  });
}
