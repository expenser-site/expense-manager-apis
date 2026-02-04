import express from 'express';
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
router.post('/', createBudget);
router.get('/', getBudgets);
router.get('/status', getBudgetStatus); // Must be before /:id to avoid conflict
router.get('/:id', getBudgetById);
router.put('/:id', updateBudget);
router.delete('/:id', deleteBudget);

export default router;
