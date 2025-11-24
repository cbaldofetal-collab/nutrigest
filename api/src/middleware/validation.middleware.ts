import { Request, Response, NextFunction } from 'express';
import { validationResult } from 'express-validator';
import { ZodError } from 'zod';
import { AppError, createError } from './error.middleware';

export const validateRequest = (req: Request, res: Response, next: NextFunction): void => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    const errorDetails = errors.array().map(error => ({
      field: error.type === 'field' ? error.path : error.type,
      message: error.msg,
      value: 'value' in error ? error.value : undefined,
    }));

    throw createError('Validation failed', 400);
  }

  next();
};

export const validateZodSchema = (schema: any) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      schema.parse(req.body);
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const errorDetails = error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message,
          value: err.code,
        }));

        throw createError('Validation failed', 400);
      }
      next(error);
    }
  };
};

export const rateLimitByIP = (windowMs: number, max: number) => {
  return require('express-rate-limit')({
    windowMs,
    max,
    message: 'Too many requests from this IP, please try again later.',
    standardHeaders: true,
    legacyHeaders: false,
  });
};

export const rateLimitByUser = (windowMs: number, max: number) => {
  return require('express-rate-limit')({
    windowMs,
    max,
    keyGenerator: (req: Request) => {
      return (req as any).user?.userId || req.ip;
    },
    message: 'Too many requests for this user, please try again later.',
    standardHeaders: true,
    legacyHeaders: false,
  });
};