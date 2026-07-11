import logger from '../config/logger.js';
import prisma from '../config/database.js';

/**
 * Admin authentication middleware
 * Checks if the authenticated user has admin privileges
 *
 * NOTE: This is a basic implementation. In production, you should:
 * 1. Add an 'isAdmin' or 'role' field to the User model
 * 2. Use a more sophisticated RBAC (Role-Based Access Control) system
 * 3. Consider using environment variables for admin email list as temporary solution
 */
export const adminMiddleware = async (req, res, next) => {
  try {
    // First, ensure user is authenticated
    if (!req.userId) {
      logger.warn('Admin access attempt without authentication', {
        ip: req.ip || req.connection.remoteAddress,
        url: req.url,
        method: req.method
      });
      return res.status(401).json({ error: 'Authentication required' });
    }

    // Get admin emails from environment variable (temporary solution)
    // In production, add isAdmin field to User model in database
    const adminEmails = process.env.ADMIN_EMAILS
      ? process.env.ADMIN_EMAILS.split(',').map(email => email.trim().toLowerCase())
      : [];

    if (adminEmails.length === 0) {
      logger.error('ADMIN_EMAILS not configured', {
        context: 'admin-middleware'
      });
      return res.status(500).json({
        error: 'Admin access not configured. Please contact system administrator.'
      });
    }

    // Get user from database
    const user = await prisma.user.findUnique({
      where: { id: req.userId },
      select: { email: true, id: true }
    });

    if (!user) {
      logger.warn('Admin access attempt with invalid user ID', {
        userId: req.userId,
        ip: req.ip || req.connection.remoteAddress
      });
      return res.status(404).json({ error: 'User not found' });
    }

    // Check if user email is in admin list
    if (!adminEmails.includes(user.email.toLowerCase())) {
      logger.warn('Unauthorized admin access attempt', {
        userId: req.userId,
        userEmail: user.email,
        ip: req.ip || req.connection.remoteAddress,
        url: req.url,
        method: req.method
      });
      return res.status(403).json({
        error: 'Forbidden. Admin privileges required.'
      });
    }

    // Log successful admin access
    logger.info('Admin access granted', {
      userId: req.userId,
      userEmail: user.email,
      url: req.url,
      method: req.method
    });

    next();
  } catch (error) {
    logger.logError(error, null, {
      context: 'admin-middleware',
      userId: req.userId
    });
    return res.status(500).json({ error: 'Internal server error' });
  }
};

export default adminMiddleware;
