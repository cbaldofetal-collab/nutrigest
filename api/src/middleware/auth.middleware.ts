import { Request, Response, NextFunction } from 'express';
import jwt, { VerifyErrors } from 'jsonwebtoken';
import { AppError, createError } from './error.middleware';
import { JWTPayload } from '../types/user.types';

export interface AuthRequest extends Request {
  user?: JWTPayload;
}

export const authenticateToken = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      throw createError('Access token required', 401);
    }

    const secret = process.env.JWT_SECRET;
    if (!secret) {
      throw createError('JWT secret not configured', 500);
    }

    jwt.verify(token, secret, (err: VerifyErrors | null, decoded: object | string | undefined) => {
      if (err) {
        if (err.name === 'TokenExpiredError') {
          throw createError('Token expired', 401);
        }
        throw createError('Invalid token', 401);
      }

      req.user = decoded as JWTPayload;
      next();
    });
  } catch (error) {
    next(error);
  }
};

export const requireRole = (roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    try {
      if (!req.user) {
        throw createError('Authentication required', 401);
      }

      // For now, we'll implement a simple role check based on plan
      // In a real application, you might have a more complex role system
      const userRole = req.user.plan === 'premium' ? 'premium' : 'user';
      
      if (!roles.includes(userRole) && !roles.includes('admin')) {
        throw createError('Insufficient permissions', 403);
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};

export const requireAdmin = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void => {
  try {
    if (!req.user) {
      throw createError('Authentication required', 401);
    }

    // Simple admin check - in production, you'd have a proper admin role
    const adminEmails = process.env.ADMIN_EMAILS?.split(',') || [];
    if (!adminEmails.includes(req.user.email)) {
      throw createError('Admin access required', 403);
    }

    next();
  } catch (error) {
    next(error);
  }
};