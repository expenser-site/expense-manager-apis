import crypto from 'crypto';
import logger from '../config/logger.js';

/**
 * ETag middleware for conditional caching
 * Generates ETag based on response body and handles If-None-Match requests
 * Returns 304 Not Modified if content hasn't changed
 */
export const conditionalCache = (req, res, next) => {
  // Skip for non-GET requests
  if (req.method !== 'GET') {
    return next();
  }

  // Store original json method
  const originalJson = res.json;

  // Override json method
  res.json = function (data) {
    // Generate ETag from response body
    const content = JSON.stringify(data);
    const etag = crypto.createHash('md5').update(content).digest('hex');

    // Set caching headers
    res.setHeader('ETag', `"${etag}"`);
    res.setHeader('Cache-Control', 'private, must-revalidate, max-age=60');

    // Check if client has cached version
    const clientEtag = req.headers['if-none-match'];
    if (clientEtag === `"${etag}"`) {
      logger.info('ETag cache hit', {
        path: req.path,
        method: req.method,
        etag
      });
      return res.status(304).end();
    }

    // Return full response
    return originalJson.call(this, data);
  };

  next();
};

/**
 * Apply conditional caching to specific routes
 * Use for read-only endpoints that benefit from caching
 */
export const cacheableRoute = conditionalCache;
