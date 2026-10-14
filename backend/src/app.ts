import express, { Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { env } from './config/env';
import { requestLogger } from './middleware/request-logger.middleware';
import { notFoundHandler } from './middleware/not-found.middleware';
import { errorHandler } from './middleware/error.middleware';
import { apiV1Routes } from './routes';

export const createApp = (): Application => {
  const app = express();

  // Security headers
  app.use(helmet());

  // Strict CORS configuration
  const allowedOrigins = env.CORS_ORIGIN.split(',').map((origin) => origin.trim());
  app.use(
    cors({
      origin: (origin, callback) => {
        // Allow requests with no origin (e.g. server-to-server or curl/supertest in dev)
        if (!origin || allowedOrigins.includes(origin) || allowedOrigins.includes('*')) {
          callback(null, true);
        } else {
          callback(new Error(`Origin ${origin} not allowed by CORS policy`));
        }
      },
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    })
  );

  // Request body parsing with strict size limits
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // Safe structured request logging
  app.use(requestLogger);

  // Root welcome / status
  app.get('/', (req, res) => {
    res.json({
      service: 'WholesaleHub Ethiopia API',
      version: '1.0.0',
      status: 'active',
      docs: `${env.API_PREFIX}/health`,
    });
  });

  // API v1 Master Router
  app.use(env.API_PREFIX, apiV1Routes);

  // 404 and Centralized Error Handling
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
};

export const app = createApp();
