import express from 'express';
import { ENV } from './config/constants';
import apiRoutes from './routes/index';
import { logger } from './utils/logger';
import { cacheService } from './services/cache.service';

const app = express();
const PORT = ENV.PORT;

// Global error handlers
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at: ' + JSON.stringify(promise) + ' reason: ' + JSON.stringify(reason));
  process.exit(1);
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('SIGTERM received, shutting down gracefully');
  // cacheService.disconnect() is not needed for in-memory cache
  process.exit(0);
});

process.on('SIGINT', async () => {
  logger.info('SIGINT received, shutting down gracefully');
  // cacheService.disconnect() is not needed for in-memory cache
  process.exit(0);
});

// Start server
async function startServer() {
  try {
    // In-memory cache is ready to use, no connection needed
    logger.info('Cache service ready');

    // Use API routes
    app.use('/api', apiRoutes);

    // Serve static files in production
    if (ENV.NODE_ENV === 'production') {
      app.use(express.static('public'));
      
      app.get('*', (req, res) => {
        res.sendFile('index.html', { root: 'public' });
      });
    }

    // Start listening
    const server = app.listen(PORT, () => {
      logger.info(`🚀 Server running on port ${PORT}`);
      logger.info(`📊 Environment: ${ENV.NODE_ENV}`);
      logger.info(`🔧 API Base URL: http://localhost:${PORT}/api`);
      logger.info(`📚 API Documentation: http://localhost:${PORT}/api/docs`);
    });

    return server;
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Start the server
if (require.main === module) {
  startServer();
}

export default app;