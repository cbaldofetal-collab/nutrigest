import { Router } from 'express';
import { body } from 'express-validator';
import { asyncHandler } from '../middleware/error.middleware';
import { validateRequest } from '../middleware/validation.middleware';
import { rateLimitByIP } from '../middleware/validation.middleware';
import { logger } from '../utils/logger';
import authService from '../services/auth.service';

const router = Router();

// Rate limiting for auth endpoints
const authRateLimit = rateLimitByIP(15 * 60 * 1000, 5); // 5 requests per 15 minutes

// Validation rules
const registerValidation = [
  body('email')
    .isEmail()
    .withMessage('Please provide a valid email address')
    .normalizeEmail(),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long'),
  body('name')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Name must be between 2 and 100 characters'),
];

const loginValidation = [
  body('email')
    .isEmail()
    .withMessage('Please provide a valid email address')
    .normalizeEmail(),
  body('password')
    .notEmpty()
    .withMessage('Password is required'),
];

// Register new user
router.post('/register', 
  authRateLimit,
  registerValidation,
  validateRequest,
  asyncHandler(async (req: any, res: any) => {
    const { email, password, name } = req.body;

    try {
      const result = await authService.register({ email, password, name });
      
      logger.info('User registered successfully', { userId: result.user.id, email: result.user.email });
      
      res.status(201).json({
        success: true,
        data: result,
        timestamp: new Date().toISOString(),
      });
    } catch (error: any) {
      if (error.message.includes('already exists')) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'USER_EXISTS',
            message: 'User already exists with this email address',
          },
          timestamp: new Date().toISOString(),
        });
      }
      
      logger.error('Registration error:', error);
      throw new Error('Failed to create user');
    }
  })
);

// Login user
router.post('/login',
  authRateLimit,
  loginValidation,
  validateRequest,
  asyncHandler(async (req: any, res: any) => {
    const { email, password } = req.body;

    try {
      const result = await authService.login(email, password);
      
      logger.info('User logged in successfully', { userId: result.user.id, email: result.user.email });
      
      res.status(200).json({
        success: true,
        data: result,
        timestamp: new Date().toISOString(),
      });
    } catch (error: any) {
      if (error.message.includes('not found') || error.message.includes('incorrect')) {
        return res.status(401).json({
          success: false,
          error: {
            code: 'INVALID_CREDENTIALS',
            message: 'Invalid email or password',
          },
          timestamp: new Date().toISOString(),
        });
      }
      
      logger.error('Login error:', error);
      throw new Error('Failed to login user');
    }
  })
);

// Refresh token
router.post('/refresh',
  asyncHandler(async (req: any, res: any) => {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'TOKEN_REQUIRED',
          message: 'Refresh token is required',
        },
        timestamp: new Date().toISOString(),
      });
    }

    try {
      const result = await authService.refreshToken(refreshToken);

      res.status(200).json({
        success: true,
        data: result,
        timestamp: new Date().toISOString(),
      });
    } catch (error: any) {
      if (error.message.includes('not found')) {
        return res.status(404).json({
          success: false,
          error: {
            code: 'USER_NOT_FOUND',
            message: 'User not found',
          },
          timestamp: new Date().toISOString(),
        });
      }
      
      logger.error('Refresh token error:', error);
      return res.status(401).json({
        success: false,
        error: {
          code: 'INVALID_TOKEN',
          message: 'Invalid refresh token',
        },
        timestamp: new Date().toISOString(),
      });
    }
  })
);

// Logout
router.post('/logout',
  asyncHandler(async (req: any, res: any) => {
    // In a more complex system, you might want to blacklist the token
    // For now, we'll just return success
    res.status(200).json({
      success: true,
      message: 'Logged out successfully',
      timestamp: new Date().toISOString(),
    });
  })
);

export { router as authLocalRouter };