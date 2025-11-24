import { Router } from 'express';
import { body } from 'express-validator';
import jwt from 'jsonwebtoken';
import { supabase } from '../config/database';
import { hashPassword, comparePassword, generateTokens, sanitizeEmail, isValidEmail, isStrongPassword } from '../utils/auth';
import { asyncHandler } from '../middleware/error.middleware';
import { validateRequest } from '../middleware/validation.middleware';
import { rateLimitByIP } from '../middleware/validation.middleware';
import { logger } from '../utils/logger';
import { User, CreateUserRequest, LoginRequest, AuthResponse, JWTPayload } from '../types/user.types';

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
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must contain at least one uppercase letter, one lowercase letter, and one number'),
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
    const { email, password, name }: CreateUserRequest = req.body;

    // Check if user already exists
    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('email', sanitizeEmail(email))
      .single();

    if (existingUser) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'USER_EXISTS',
          message: 'User already exists with this email address',
        },
        timestamp: new Date().toISOString(),
      });
    }

    // Hash password
    const passwordHash = await hashPassword(password);

    // Create user
    const { data: user, error } = await supabase
      .from('users')
      .insert([{
        email: sanitizeEmail(email),
        password_hash: passwordHash,
        name: name.trim(),
        plan: 'free',
        metadata: {
          registrationSource: 'web',
          registrationIp: req.ip,
        },
      }])
      .select()
      .single();

    if (error) {
      logger.error('Error creating user:', error);
      throw new Error('Failed to create user');
    }

    // Generate tokens
    const tokens = generateTokens({
      userId: user.id,
      email: user.email,
      plan: user.plan,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60), // 24 hours
    });

    logger.info('User registered successfully', { userId: user.id, email: user.email });

    const response: AuthResponse = {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        plan: user.plan,
        emailVerified: user.email_verified,
        createdAt: new Date(user.created_at),
        updatedAt: new Date(user.updated_at),
      },
      tokens,
    };

    res.status(201).json({
      success: true,
      data: response,
      timestamp: new Date().toISOString(),
    });
  })
);

// Login user
router.post('/login',
  authRateLimit,
  loginValidation,
  validateRequest,
  asyncHandler(async (req: any, res: any) => {
    const { email, password }: LoginRequest = req.body;

    // Find user by email
    const { data: user } = await supabase
      .from('users')
      .select('*')
      .eq('email', sanitizeEmail(email))
      .single();

    if (!user) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'INVALID_CREDENTIALS',
          message: 'Invalid email or password',
        },
        timestamp: new Date().toISOString(),
      });
    }

    // Verify password
    const isPasswordValid = await comparePassword(password, user.password_hash);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'INVALID_CREDENTIALS',
          message: 'Invalid email or password',
        },
        timestamp: new Date().toISOString(),
      });
    }

    // Update last login
    await supabase
      .from('users')
      .update({ last_login_at: new Date().toISOString() })
      .eq('id', user.id);

    // Generate tokens
    const tokens = generateTokens({
      userId: user.id,
      email: user.email,
      plan: user.plan,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60), // 24 hours
    });

    logger.info('User logged in successfully', { userId: user.id, email: user.email });

    const response: AuthResponse = {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        plan: user.plan,
        emailVerified: user.email_verified,
        ...(user.last_login_at && { lastLoginAt: new Date(user.last_login_at) }), // Only include if exists
        metadata: user.metadata || {},
        createdAt: new Date(user.created_at),
        updatedAt: new Date(user.updated_at),
      },
      tokens,
    };

    res.status(200).json({
      success: true,
      data: response,
      timestamp: new Date().toISOString(),
    });
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
      const payload = jwt.verify(refreshToken, process.env.JWT_SECRET!) as JWTPayload;
      
      // Generate new tokens
      const newTokens = generateTokens({
        userId: payload.userId,
        email: payload.email,
        plan: payload.plan,
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60), // 24 hours
      });

      res.status(200).json({
        success: true,
        data: { tokens: newTokens },
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
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

export { router as authRouter };