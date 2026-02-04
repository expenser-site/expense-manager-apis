import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import compression from 'compression';
import session from 'express-session';
import passport from './config/passport.js';
import emailService from './services/email/index.js';
import healthRoutes from './routes/healthRoutes.js';
import authRoutes from './routes/authRoutes.js';
import expenseRoutes from './routes/expenseRoutes.js';
import dashboardRoutes from './routes/dashboardRoutes.js';
import categoryRoutes from './routes/categoryRoutes.js';
import budgetRoutes from './routes/budgetRoutes.js';
import migrationRoutes from './routes/migrationRoutes.js';
import { requestLogger, errorLogger } from './middleware/logging.js';
import { conditionalCache } from './middleware/etag.js';
import logger from './config/logger.js';

const app = express();
const PORT = process.env.PORT || 3000;

// Initialize email service
(async () => {
  try {
    await emailService.initialize(process.env.EMAIL_PROVIDER);
    logger.info(`Email service ready using ${emailService.getProviderName()} provider`);
  } catch (error) {
    logger.logError(error, null, { context: 'email-service-startup' });
  }
})();

// CORS configuration from environment variable
const allowedOrigins = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(',').map(origin => origin.trim())
  : process.env.NODE_ENV === 'production'
    ? ['https://app.expenser.site', 'https://expenser.site', 'https://www.expenser.site']
    : ['http://localhost:5173']; // Fallback based on environment

// Middleware
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps or curl)
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        logger.warn('CORS blocked request', { origin, allowedOrigins });
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true
  })
);

// Response compression (60-80% bandwidth reduction)
app.use(
  compression({
    level: 6, // Balanced compression (0-9, higher = more compression but slower)
    threshold: 1024, // Only compress responses > 1KB
    filter: (req, res) => {
      if (req.headers['x-no-compression']) {
        return false;
      }
      return compression.filter(req, res);
    }
  })
);

app.use(express.json());

// Session middleware (required for passport)
app.use(
  session({
    secret: process.env.SESSION_SECRET || process.env.JWT_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === 'production',
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000 // 24 hours
    }
  })
);

// Initialize Passport
app.use(passport.initialize());
app.use(passport.session());

// Request logging middleware
app.use(requestLogger);

// ETag caching for read-only routes (70-90% faster repeat requests)
// Apply to GET endpoints that return relatively stable data
app.use('/api/v1/expenses', (req, res, next) => {
  if (req.method === 'GET') {
    conditionalCache(req, res, next);
  } else {
    next();
  }
});

app.use('/api/v1/categories', (req, res, next) => {
  if (req.method === 'GET') {
    conditionalCache(req, res, next);
  } else {
    next();
  }
});

app.use('/api/v1/dashboard', (req, res, next) => {
  if (req.method === 'GET') {
    conditionalCache(req, res, next);
  } else {
    next();
  }
});

app.use('/api/v1/budgets', (req, res, next) => {
  if (req.method === 'GET') {
    conditionalCache(req, res, next);
  } else {
    next();
  }
});

// Routes
app.use('/api/v1/health', healthRoutes);
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/expenses', expenseRoutes);
app.use('/api/v1/dashboard', dashboardRoutes);
app.use('/api/v1/categories', categoryRoutes);
app.use('/api/v1/budgets', budgetRoutes);
app.use('/api/v1/migration', migrationRoutes);

// 404 handler
app.use((req, res) => {
  logger.warn('Route not found', {
    method: req.method,
    url: req.url,
    path: req.path,
    ip: req.ip || req.connection.remoteAddress
  });
  res.status(404).json({ error: 'Route not found' });
});

// Error logging middleware
app.use(errorLogger);

// Error handler
app.use((err, req, res, _next) => {
  res.status(err.status || 500).json({
    error: err.message || 'Something went wrong!',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

app.listen(PORT, () => {
  logger.info('Server started successfully', {
    port: PORT,
    nodeEnv: process.env.NODE_ENV || 'development'
  });
});
