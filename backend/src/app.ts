import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import { connectRedis } from './utils/redis';
import { errorHandler } from './middleware/errorHandler';
import { notFoundHandler } from './middleware/notFoundHandler';
import { healthRouter } from './routes/health.routes';
import { authRouter } from './routes/auth.routes';
import { postRouter } from './routes/post.routes';
import { logger } from './utils/logger';

dotenv.config();

const app = express();
const PORT = process.env.APP_PORT || 3001;

// --- Middleware ---
app.use(helmet());
app.use(cors({ origin: process.env.APP_URL || 'http://localhost:3000', credentials: true }));
app.use(express.json({ limit: process.env.UPLOAD_MAX_SIZE || '5mb' }));
app.use(express.urlencoded({ extended: true }));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api/', limiter);

// --- Routes ---
app.use('/api/health', healthRouter);
app.use('/api/auth', authRouter);
app.use('/api/posts', postRouter);

// --- Error handling ---
app.use(notFoundHandler);
app.use(errorHandler);

// --- Start ---
async function bootstrap() {
  try {
    await connectRedis();
    logger.info('Redis connected');
  } catch (err) {
    logger.error('Redis connection failed:', err);
  }

  app.listen(PORT, () => {
    logger.info(`Server running on port ${PORT} in ${process.env.NODE_ENV || 'development'} mode`);
  });
}

bootstrap();

export default app;
