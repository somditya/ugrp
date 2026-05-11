import { Request, Response, NextFunction } from 'express';

export function notFoundHandler(_req: Request, _res: Response, next: NextFunction) {
  const err = new Error(`Not Found — ${_req.originalUrl}`) as any;
  err.status = 404;
  next(err);
}
