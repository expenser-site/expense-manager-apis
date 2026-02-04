import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import compression from 'compression';
import session from 'express-session';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
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

// Security middleware - Helmet (must come early)
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ['\'self\''],
        styleSrc: ['\'self\'', '\'unsafe-inline\''],
        scriptSrc: ['\'self\''],
        imgSrc: ['\'self\'', 'data:', 'https:'],
        connectSrc: ['\'self\''],
        fontSrc: ['\'self\''],
        objectSrc: ['\'none\''],
        mediaSrc: ['\'self\''],
        frameSrc: ['\'none\'']
      }
    },
    crossOriginEmbedderPolicy: false, // Allow embedding if needed
    hsts: {
      maxAge: 31536000, // 1 year
      includeSubDomains: true,
      preload: true
    }
  })
);

// Rate limiters
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  handler: (req, res) => {
    logger.warn('Rate limit exceeded', {
      ip: req.ip,
      path: req.path,
      userId: req.userId
    });
    res.status(429).json({
      error: 'Too many requests, please try again later.'
    });
  }
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 login/register attempts per windowMs
  message: 'Too many authentication attempts, please try again later.',
  skipSuccessfulRequests: true, // Don't count successful requests
  handler: (req, res) => {
    logger.warn('Auth rate limit exceeded', {
      ip: req.ip,
      path: req.path,
      email: req.body?.email
    });
    res.status(429).json({
      error: 'Too many authentication attempts, please try again in 15 minutes.'
    });
  }
});

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

// Request size limits (prevent payload attacks)
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

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
app.use('/api/v1/auth', authLimiter, authRoutes); // Apply strict rate limit to auth
app.use('/api/v1/expenses', generalLimiter, expenseRoutes);
app.use('/api/v1/dashboard', generalLimiter, dashboardRoutes);
app.use('/api/v1/categories', generalLimiter, categoryRoutes);
app.use('/api/v1/budgets', generalLimiter, budgetRoutes);
app.use('/api/v1/migration', generalLimiter, migrationRoutes);

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

const server = app.listen(PORT, () => {
  logger.info('Server started successfully', {
    port: PORT,
    nodeEnv: process.env.NODE_ENV || 'development'
  });
});

// Graceful shutdown handlers
const gracefulShutdown = (signal) => {
  logger.info(`${signal} signal received: closing HTTP server`);

  server.close(() => {
    logger.info('HTTP server closed');

    // Close database connections
    import('./config/database.js').then(({ prisma }) => {
      prisma.$disconnect()
        .then(() => {
          logger.info('Database connection closed');
          process.exit(0);
        })
        .catch((err) => {
          logger.logError(err, null, { context: 'database-disconnect' });
          process.exit(1);
        });
    });
  });

  // Force shutdown after 30 seconds
  setTimeout(() => {
    logger.error('Could not close connections in time, forcefully shutting down');
    process.exit(1);
  }, 30000);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  logger.logError(error, null, { context: 'uncaught-exception' });
  gracefulShutdown('UNCAUGHT_EXCEPTION');
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', { promise, reason });
  gracefulShutdown('UNHANDLED_REJECTION');
});
