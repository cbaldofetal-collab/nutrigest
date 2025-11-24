import express, { Router } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import rateLimit from 'express-rate-limit';

import { errorHandler } from '../middleware/error.middleware';
import { authLocalRouter } from '../controllers/auth-local.controller';
import { userRouter } from '../controllers/user.controller';
import { sheetsRouter } from '../controllers/sheets.controller';
import { analyticsRouter } from '../controllers/analytics.controller';
import { adminRouter } from '../controllers/admin.controller';
import { webhookRouter } from '../controllers/webhook.controller';
import { ENV } from '../config/constants';
import { logger, requestLogger } from '../utils/logger';
import glucoseRoutes from './glucose.routes';
import nutritionRoutes from './nutrition.routes';
import privacyRoutes from './privacy.routes';
import reportsRoutes from './reports.routes';

const app = Router();

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
}));

// CORS configuration
app.use(cors({
  origin: ENV.FRONTEND_URL,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: ENV.RATE_LIMIT_WINDOW_MS,
  max: ENV.RATE_LIMIT_MAX_REQUESTS,
  message: {
    success: false,
    error: {
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Too many requests from this IP, please try again later.',
    },
    timestamp: new Date().toISOString(),
  },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use('/api/', limiter);

// Body parsing middleware
app.use(compression());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Logging
app.use(morgan('combined', { stream: { write: (message) => logger.info(message.trim()) } }));
app.use(requestLogger);

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    data: {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: ENV.NODE_ENV,
      version: process.env.npm_package_version || '1.0.0',
    },
  });
});

// API routes
app.use('/auth', authLocalRouter);
app.use('/user', userRouter);
app.use('/sheets', sheetsRouter);
app.use('/analytics', analyticsRouter);
app.use('/admin', adminRouter);
app.use('/webhook', webhookRouter);
app.use('/glucose', glucoseRoutes);
app.use('/nutrition', nutritionRoutes);
app.use('/privacy', privacyRoutes);
app.use('/reports', reportsRoutes);

// Error handling middleware (must be last)
app.use(errorHandler);

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: {
      code: 'NOT_FOUND',
      message: 'The requested resource was not found',
      path: req.originalUrl,
    },
    timestamp: new Date().toISOString(),
  });
});

export default app;