/**
 * local server entry file, for local development
 */
import app from './app';

/**
 * start server with port
 */
const PORT = process.env.PORT || 3001;

let server: any = null;
if (process.env.NODE_ENV !== 'test') {
  server = app.listen(PORT, () => {
    console.log(`Server ready on port ${PORT}`);
  });
}

/**
 * close server
 */
if (server) {
  process.on('SIGTERM', () => {
    console.log('SIGTERM signal received');
    server.close(() => {
      console.log('Server closed');
      process.exit(0);
    });
  });

  process.on('SIGINT', () => {
    console.log('SIGINT signal received');
    server.close(() => {
      console.log('Server closed');
      process.exit(0);
    });
  });
}

export default app;