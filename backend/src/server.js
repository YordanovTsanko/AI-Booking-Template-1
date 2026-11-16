import 'dotenv/config';
import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';

import { connectDB, disconnectDB } from './config/db.js';
import ApiError from './utils/ApiError.js';
import ApiResponse from './utils/ApiResponse.js';
import { apiLimiter } from './middlewares/rateLimit.middleware.js';
import requireDb from './middlewares/requireDb.middleware.js';
import { apiNotFound, notFound, errorHandler } from './middlewares/error.middleware.js';

import healthRoutes from './routes/health.routes.js';
import authRoutes from './routes/auth.routes.js';
import servicesRoutes from './routes/services.routes.js';
import staffRoutes from './routes/staff.routes.js';
import bookingsRoutes from './routes/bookings.routes.js';
import aiRoutes from './routes/ai.routes.js';

// ---------- Crash handlers (registered first) ----------
process.on('uncaughtException', (err) => {
  console.error('💥 UNCAUGHT EXCEPTION – shutting down...', err);
  process.exit(1);
});

const PORT = Number(process.env.PORT) || 5000;
const DEFAULT_CLIENT_URL = 'http://localhost:5173';

const allowedOrigins = ((process.env.CLIENT_URL || '').trim() || DEFAULT_CLIENT_URL)
  .split(',')
  .map((o) => o.trim().replace(/\/$/, ''))
  .filter(Boolean);

const app = express();
app.set('trust proxy', 1);
app.disable('x-powered-by');

// ---------- Security & parsing ----------
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  })
);

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow server-to-server tools (curl, Postman) without an Origin header
      if (!origin || allowedOrigins.includes(origin.replace(/\/$/, ''))) return callback(null, true);
      return callback(
        ApiError.forbidden(`CORS: достъпът от адрес ${origin} не е разрешен. Добави го в CLIENT_URL в backend/.env.`)
      );
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

app.use(express.json({ limit: '100kb' }));
app.use(express.urlencoded({ extended: true, limit: '100kb' }));
app.use(cookieParser());

// ---------- Routes ----------
// Health is lightweight, not rate-limited and works even when the DB is down.
app.use('/api/health', healthRoutes);

app.use('/api', apiLimiter);
app.use('/api', requireDb);

app.use('/api/auth', authRoutes);
app.use('/api/services', servicesRoutes);
app.use('/api/staff', staffRoutes);
app.use('/api/bookings', bookingsRoutes);
app.use('/api/ai', aiRoutes);

app.get('/', (_req, res) =>
  ApiResponse.ok(res, 'AI-Booking-Template-1 API работи. Използвай /api/health за проверка.', {
    name: 'AI-Booking-Template-1',
    version: '1.0.0',
  })
);

// ---------- 404 + errors ----------
app.use('/api', apiNotFound);
app.use(notFound);
app.use(errorHandler);

// ---------- Start ----------
const server = app.listen(PORT, () => {
  console.log('==============================================');
  console.log(`🚀 AI-Booking-Template-1 API is ready on http://localhost:${PORT}`);
  console.log(`❤️  Health check:  http://localhost:${PORT}/api/health`);
  console.log(`🌐 Allowed origins: ${allowedOrigins.join(', ')}`);
  console.log(`🤖 AI mode: ${(process.env.OPENAI_API_KEY || '').trim() ? 'OpenAI' : 'mock (no OPENAI_API_KEY)'}`);
  console.log('==============================================');
});

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`❌ Port ${PORT} is already in use. Change PORT in backend/.env or stop the other process.`);
  } else {
    console.error('❌ Server error:', err);
  }
  process.exit(1);
});

connectDB();

// ---------- Graceful shutdown ----------
const shutdown = (signal, code = 0) => {
  console.log(`\n👋 ${signal} received – closing server...`);
  server.close(async () => {
    await disconnectDB();
    process.exit(code);
  });
  setTimeout(() => process.exit(code), 10000).unref();
};

process.on('unhandledRejection', (reason) => {
  console.error('💥 UNHANDLED REJECTION – shutting down...', reason);
  shutdown('unhandledRejection', 1);
});
process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

export default app;
