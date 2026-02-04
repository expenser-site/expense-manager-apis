import express from 'express';
import { body, param, query } from 'express-validator';
import {
  createBudget,
  getBudgets,
  getBudgetById,
  updateBudget,
  deleteBudget,
  getBudgetStatus
} from '../controllers/budgetController.js';
import authMiddleware from '../middleware/auth.js';

const router = express.Router();

// All routes require authentication
router.use(authMiddleware);

// Budget CRUD endpoints
router.post(
  '/',
  [
    body('amount')
      .isFloat({ min: 0.01 })
      .withMessage('Amount must be a positive number'),
    body('month')
      .isInt({ min: 1, max: 12 })
      .withMessage('Month must be between 1 and 12'),
    body('currency')
      .isIn(['USD', 'EUR', 'GBP', 'JPY', 'AUD', 'CAD', 'CHF', 'CNY', 'INR', 'BDT'])
      .withMessage('Invalid currency code'),
    body('period')
      .optional()
      .isIn(['monthly', 'yearly'])
      .withMessage('Period must be either "monthly" or "yearly"'),
    body('year')
      .optional()
      .isInt({ min: 2000, max: 2100 })
      .withMessage('Year must be between 2000 and 2100'),
    body('categoryIds')
      .optional()
      .isArray()
      .withMessage('Category IDs must be an array'),
    body('categoryIds.*')
      .optional()
      .isUUID()
      .withMessage('Each category ID must be a valid UUID'),
    body('notes')
      .optional()
      .trim()
      .isLength({ max: 500 })
      .withMessage('Notes cannot exceed 500 characters')
  ],
  createBudget
);

router.get(
  '/',
  [
    query('period')
      .optional()
      .isIn(['monthly', 'yearly'])
      .withMessage('Period must be either "monthly" or "yearly"'),
    query('year')
      .optional()
      .isInt({ min: 2000, max: 2100 })
      .withMessage('Year must be between 2000 and 2100'),
    query('month')
      .optional()
      .isInt({ min: 1, max: 12 })
      .withMessage('Month must be between 1 and 12'),
    query('categoryId')
      .optional()
      .isUUID()
      .withMessage('Category ID must be a valid UUID'),
    query('page')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Page must be a positive integer'),
    query('limit')
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage('Limit must be between 1 and 100')
  ],
  getBudgets
);

router.get(
  '/status',
  [
    query('year')
      .optional()
      .isInt({ min: 2000, max: 2100 })
      .withMessage('Year must be between 2000 and 2100'),
    query('month')
      .optional()
      .isInt({ min: 1, max: 12 })
      .withMessage('Month must be between 1 and 12'),
    query('categoryId')
      .optional()
      .isUUID()
      .withMessage('Category ID must be a valid UUID')
  ],
  getBudgetStatus
);

router.get(
  '/:id',
  [param('id').isUUID().withMessage('Budget ID must be a valid UUID')],
  getBudgetById
);

router.put(
  '/:id',
  [
    param('id').isUUID().withMessage('Budget ID must be a valid UUID'),
    body('amount')
      .optional()
      .isFloat({ min: 0.01 })
      .withMessage('Amount must be a positive number'),
    body('currency')
      .optional()
      .isIn(['USD', 'EUR', 'GBP', 'JPY', 'AUD', 'CAD', 'CHF', 'CNY', 'INR', 'BDT'])
      .withMessage('Invalid currency code'),
    body('period')
      .optional()
      .isIn(['monthly', 'yearly'])
      .withMessage('Period must be either "monthly" or "yearly"'),
    body('month')
      .optional()
      .isInt({ min: 1, max: 12 })
      .withMessage('Month must be between 1 and 12'),
    body('year')
      .optional()
      .isInt({ min: 2000, max: 2100 })
      .withMessage('Year must be between 2000 and 2100'),
    body('categoryIds')
      .optional()
      .isArray()
      .withMessage('Category IDs must be an array'),
    body('categoryIds.*')
      .optional()
      .isUUID()
      .withMessage('Each category ID must be a valid UUID'),
    body('name')
      .optional()
      .trim()
      .isLength({ max: 100 })
      .withMessage('Budget name cannot exceed 100 characters'),
    body('notes')
      .optional()
      .trim()
      .isLength({ max: 500 })
      .withMessage('Notes cannot exceed 500 characters')
  ],
  updateBudget
);

router.delete(
  '/:id',
  [param('id').isUUID().withMessage('Budget ID must be a valid UUID')],
  deleteBudget
);

export default router;
