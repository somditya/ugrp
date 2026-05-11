import { Request, Response, NextFunction } from 'express';
import { ZodSchema } from 'zod';

export function validateRequest(schema: ZodSchema) {
  return (req: Request, _res: Response, next: NextFunction) => {
    try {
      req.body = schema.parse(req.body);
      next();
    } catch (err: any) {
      err.status = 400;
      next(err);
    }
  };
}
