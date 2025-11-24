import { ENV, validateEnv } from './constants';
import { logger } from '../utils/logger';

// Validate environment variables on startup
validateEnv();

export const config = {
  // Application
  app: {
    name: 'Leitor de Planilhas API',
    version: '1.0.0',
    env: ENV.NODE_ENV,
    port: ENV.PORT,
    frontendUrl: ENV.FRONTEND_URL,
  },

  // Security
  security: {
    bcryptRounds: ENV.BCRYPT_ROUNDS,
    jwtSecret: ENV.JWT_SECRET,
    jwtAccessExpiresIn: ENV.JWT_ACCESS_TOKEN_EXPIRES_IN,
    jwtRefreshExpiresIn: ENV.JWT_REFRESH_TOKEN_EXPIRES_IN,
    rateLimitWindowMs: ENV.RATE_LIMIT_WINDOW_MS,
    rateLimitMaxRequests: ENV.RATE_LIMIT_MAX_REQUESTS,
  },

  // Database
  database: {
    supabaseUrl: ENV.SUPABASE_URL,
    supabaseAnonKey: ENV.SUPABASE_ANON_KEY,
    supabaseServiceRoleKey: ENV.SUPABASE_SERVICE_ROLE_KEY,
  },

  // Cache
  cache: {
    redisUrl: ENV.REDIS_URL,
    redisHost: ENV.REDIS_HOST,
    redisPort: ENV.REDIS_PORT,
    redisPassword: ENV.REDIS_PASSWORD,
    redisDb: ENV.REDIS_DB,
    defaultTtl: ENV.CACHE_TTL_SECONDS,
    analyticsTtl: ENV.ANALYTICS_CACHE_TTL_SECONDS,
  },

  // File Upload
  upload: {
    maxFileSize: ENV.MAX_FILE_SIZE,
    uploadDir: ENV.UPLOAD_DIR,
  },

  // AI
  ai: {
    openaiApiKey: ENV.OPENAI_API_KEY,
    model: ENV.AI_MODEL,
    maxTokens: ENV.AI_MAX_TOKENS,
    temperature: ENV.AI_TEMPERATURE,
  },

  // Email
  email: {
    sendgridApiKey: ENV.SENDGRID_API_KEY,
    fromEmail: ENV.FROM_EMAIL,
  },

  // Payment
  payment: {
    stripeSecretKey: ENV.STRIPE_SECRET_KEY,
    stripeWebhookSecret: ENV.STRIPE_WEBHOOK_SECRET,
  },

  // Logging
  logging: {
    level: ENV.LOG_LEVEL,
    file: ENV.LOG_FILE,
  },

  // Admin
  admin: {
    emails: ENV.ADMIN_EMAILS,
  },
};

export default config;