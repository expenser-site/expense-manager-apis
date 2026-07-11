import express from 'express';
import {
  ensureUserDefaultCategories,
  migrateDefaultCategories,
  checkMigrationStatus,
  fixOrphanExpenses
} from '../controllers/migrationController.js';
import authMiddleware from '../middleware/auth.js';
import adminMiddleware from '../middleware/adminAuth.js';

const router = express.Router();

/**
 * @route   POST /api/v1/migration/ensure-categories
 * @desc    Ensure current user has default categories (call after login)
 * @access  Private
 */
router.post('/ensure-categories', authMiddleware, ensureUserDefaultCategories);

/**
 * @route   POST /api/v1/migration/default-categories
 * @desc    Migrate all users to have default categories
 * @access  Admin Only
 */
router.post('/default-categories', authMiddleware, adminMiddleware, migrateDefaultCategories);

/**
 * @route   GET /api/v1/migration/status
 * @desc    Check migration status
 * @access  Admin Only
 */
router.get('/status', authMiddleware, adminMiddleware, checkMigrationStatus);

/**
 * @route   POST /api/v1/migration/fix-orphan-expenses
 * @desc    Fix expenses without categories
 * @access  Admin Only
 */
router.post('/fix-orphan-expenses', authMiddleware, adminMiddleware, fixOrphanExpenses);

export default router;
