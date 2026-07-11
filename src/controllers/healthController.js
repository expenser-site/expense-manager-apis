import prisma from '../config/database.js';
import logger from '../config/logger.js';
import { STATIC_LINK_CACHE, createLink } from '../utils/hateoas.js';

export const getHealth = async (req, res) => {
  try {
    const healthCheck = {
      status: 'ok',
      message: 'Expenser API is running',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || 'development'
    };

    res.json(healthCheck);
  } catch (error) {
    logger.logError(error, req, { context: 'health-check' });
    res.status(503).json({
      status: 'error',
      message: 'Service unavailable',
      timestamp: new Date().toISOString()
    });
  }
};

export const getHealthDetailed = async (req, res) => {
  try {
    // Check database connectivity
    let databaseStatus = 'connected';
    let databaseMessage = 'Database is operational';

    try {
      // Add 5 second timeout to prevent hanging
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Database check timeout')), 5000)
      );
      const dbCheckPromise = prisma.$queryRaw`SELECT 1`;
      await Promise.race([dbCheckPromise, timeoutPromise]);
    } catch (error) {
      databaseStatus = 'disconnected';
      databaseMessage =
        error.message === 'Database check timeout'
          ? 'Database connection timeout'
          : 'Database connection failed';
    }

    // Check HATEOAS health
    let hateoasStatus = 'ok';
    let hateoasMessage = 'HATEOAS links are operational';
    let hateoasDetails = {};

    try {
      const baseUrl = process.env.API_BASE_URL;
      if (!baseUrl) {
        hateoasStatus = 'warning';
        hateoasMessage = 'API_BASE_URL not configured, using default';
      }

      // Verify link generation works
      const testLink = createLink('test', '/test', 'GET', 'Test link');
      if (!testLink.href || !testLink.href.includes('api')) {
        hateoasStatus = 'degraded';
        hateoasMessage = 'Link generation producing invalid URLs';
      }

      // Check static link cache
      const cacheSize = STATIC_LINK_CACHE.size;
      if (cacheSize > 100) {
        hateoasStatus = 'warning';
        hateoasMessage = `Static link cache unusually large: ${cacheSize} entries`;
      }

      hateoasDetails = {
        baseUrl: baseUrl || 'https://api.expenser.site/api',
        cacheSize,
        cacheEnabled: true
      };
    } catch (error) {
      hateoasStatus = 'error';
      hateoasMessage = `HATEOAS error: ${error.message}`;
    }

    const healthCheck = {
      status: databaseStatus === 'connected' && hateoasStatus === 'ok' ? 'ok' : 'degraded',
      message: 'Expenser API Health Check',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || 'development',
      services: {
        database: {
          status: databaseStatus,
          message: databaseMessage
        },
        api: {
          status: 'ok',
          message: 'API is operational'
        },
        hateoas: {
          status: hateoasStatus,
          message: hateoasMessage,
          ...hateoasDetails
        }
      },
      system: {
        platform: process.platform,
        nodeVersion: process.version,
        memory: {
          used: Math.round((process.memoryUsage().heapUsed / 1024 / 1024) * 100) / 100,
          total: Math.round((process.memoryUsage().heapTotal / 1024 / 1024) * 100) / 100,
          unit: 'MB',
          warning:
            process.memoryUsage().heapUsed / process.memoryUsage().heapTotal > 0.9
              ? 'Memory usage exceeds 90%'
              : null
        }
      }
    };

    const statusCode = databaseStatus === 'connected' && hateoasStatus !== 'error' ? 200 : 503;
    res.status(statusCode).json(healthCheck);
  } catch (error) {
    res.status(503).json({
      status: 'error',
      message: 'Service unavailable',
      timestamp: new Date().toISOString(),
      error: error.message
    });
  }
};
