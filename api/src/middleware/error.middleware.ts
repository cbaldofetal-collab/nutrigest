import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { ApiResponse, ErrorResponse } from '../types/api.types';

export class AppError extends Error {
  public statusCode: number;
  public isOperational: boolean;

  constructor(message: string, statusCode: number) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

export const errorHandler = (
  err: Error | AppError,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  let statusCode = 500;
  let errorResponse: ErrorResponse['error'] = {
    code: 'INTERNAL_SERVER_ERROR',
    message: 'Internal server error',
  };

  if (err instanceof AppError) {
    statusCode = err.statusCode;
    errorResponse = {
      code: err.message.replace(/\s+/g, '_').toUpperCase(),
      message: err.message,
    };
  } else if (err instanceof ZodError) {
    statusCode = 400;
    errorResponse = {
      code: 'VALIDATION_ERROR',
      message: 'Validation failed',
      details: (err as any).errors?.map((error: any) => ({
        field: error.path?.join('.'),
        message: error.message,
        value: error.code,
      })) || [],
    };
  } else if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    errorResponse = {
      code: 'INVALID_TOKEN',
      message: 'Invalid authentication token',
    };
  } else if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    errorResponse = {
      code: 'TOKEN_EXPIRED',
      message: 'Authentication token has expired',
    };
  }

  const response: ApiResponse<null> = {
    success: false,
    error: errorResponse,
    timestamp: new Date().toISOString(),
  };

  console.error(`[ERROR] ${req.method} ${req.url} - ${err.message}`, {
    statusCode,
    stack: err.stack,
    url: req.url,
    method: req.method,
    ip: req.ip,
  });

  res.status(statusCode).json(response);
};

export const asyncHandler = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

export const createError = (message: string, statusCode: number): AppError => {
  return new AppError(message, statusCode);
};