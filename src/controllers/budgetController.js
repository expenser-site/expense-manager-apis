import { validationResult } from 'express-validator';
import prisma from '../config/database.js';
import logger from '../config/logger.js';

/**
 * Create a new budget
 * POST /api/v1/budgets
 */
const createBudget = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const {
      amount,
      currency = 'USD',
      period,
      month,
      year,
      categoryId,
      alertAt80 = true,
      alertAt100 = true,
      notes
    } = req.body;

    // Validate required fields
    if (!amount || amount <= 0) {
      return res.status(400).json({ error: 'Amount must be a positive number' });
    }

    if (!period || !['monthly', 'yearly'].includes(period)) {
      return res.status(400).json({ error: 'Period must be either "monthly" or "yearly"' });
    }

    if (!year || year < 2000 || year > 2100) {
      return res.status(400).json({ error: 'Year must be between 2000 and 2100' });
    }

    // Validate month for monthly budgets
    if (period === 'monthly') {
      if (!month || month < 1 || month > 12) {
        return res.status(400).json({ error: 'Month must be between 1 and 12 for monthly budgets' });
      }
    }

    // Validate currency
    const validCurrencies = ['USD', 'EUR', 'GBP', 'JPY', 'AUD', 'CAD', 'CHF', 'CNY', 'INR', 'BDT'];
    const finalCurrency = (currency || 'USD').toUpperCase();
    if (!validCurrencies.includes(finalCurrency)) {
      return res.status(400).json({
        error: `Invalid currency. Supported currencies: ${validCurrencies.join(', ')}`
      });
    }

    // Validate category if provided
    if (categoryId) {
      const category = await prisma.category.findFirst({
        where: {
          id: categoryId,
          userId: req.userId
        }
      });

      if (!category) {
        return res.status(404).json({ error: 'Category not found' });
      }
    }

    // Check for existing budget with same parameters
    const existingBudget = await prisma.budget.findUnique({
      where: {
        userId_categoryId_period_month_year: {
          userId: req.userId,
          categoryId: categoryId || null,
          period,
          month: period === 'monthly' ? month : null,
          year
        }
      }
    });

    if (existingBudget) {
      return res.status(409).json({
        error: 'A budget with these parameters already exists. Please update the existing budget instead.'
      });
    }

    // Create the budget
    const budget = await prisma.budget.create({
      data: {
        amount: parseFloat(amount),
        currency: finalCurrency,
        period,
        month: period === 'monthly' ? month : null,
        year,
        categoryId: categoryId || null,
        userId: req.userId,
        alertAt80: alertAt80 !== undefined ? alertAt80 : true,
        alertAt100: alertAt100 !== undefined ? alertAt100 : true,
        notes: notes || null
      },
      include: {
        category: true
      }
    });

    res.status(201).json({
      message: 'Budget created successfully',
      budget
    });
  } catch (error) {
    logger.logError(error, null, { context: 'create-budget' });
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Get all budgets for the authenticated user
 * GET /api/v1/budgets
 */
const getBudgets = async (req, res) => {
  try {
    const {
      period,
      year,
      month,
      categoryId,
      page = 1,
      limit = 50,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    // Limit maximum page size to prevent memory issues
    const maxLimit = 100;
    const safeLimit = Math.min(parseInt(limit), maxLimit);
    const safePage = Math.max(parseInt(page), 1);
    const skip = (safePage - 1) * safeLimit;

    // Validate year if provided
    if (year && (isNaN(parseInt(year)) || parseInt(year) < 2000 || parseInt(year) > 2100)) {
      return res.status(400).json({
        error: 'Invalid year parameter. Must be between 2000 and 2100'
      });
    }

    // Validate month if provided
    if (month && (isNaN(parseInt(month)) || parseInt(month) < 1 || parseInt(month) > 12)) {
      return res.status(400).json({
        error: 'Invalid month parameter. Must be between 1 and 12'
      });
    }

    // Build where clause
    const where = {
      userId: req.userId
    };

    if (period && ['monthly', 'yearly'].includes(period)) {
      where.period = period;
    }

    if (year) {
      where.year = parseInt(year);
    }

    if (month && period === 'monthly') {
      where.month = parseInt(month);
    }

    if (categoryId) {
      where.categoryId = categoryId;
    }

    // Build orderBy clause with validation
    const validSortFields = ['amount', 'year', 'month', 'createdAt', 'updatedAt'];
    const sortField = validSortFields.includes(sortBy) ? sortBy : 'createdAt';
    const order = sortOrder === 'asc' ? 'asc' : 'desc';

    // Create dynamic orderBy based on sortField
    let orderBy;
    if (sortField === 'year' || sortField === 'month') {
      // For year and month, use multiple sort fields for better ordering
      orderBy = [
        { year: order },
        { month: order },
        { createdAt: 'desc' }
      ];
    } else {
      orderBy = { [sortField]: order };
    }

    // Get budgets with pagination
    const [budgets, totalCount] = await Promise.all([
      prisma.budget.findMany({
        where,
        include: {
          category: {
            select: {
              id: true,
              name: true,
              color: true,
              icon: true
            }
          }
        },
        orderBy,
        skip,
        take: safeLimit
      }),
      prisma.budget.count({ where })
    ]);

    res.json({
      budgets,
      pagination: {
        total: totalCount,
        page: safePage,
        limit: safeLimit,
        totalPages: Math.ceil(totalCount / safeLimit)
      }
    });
  } catch (error) {
    logger.logError(error, null, { context: 'get-budgets' });
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Get a single budget by ID
 * GET /api/v1/budgets/:id
 */
const getBudgetById = async (req, res) => {
  try {
    const { id } = req.params;

    const budget = await prisma.budget.findFirst({
      where: {
        id,
        userId: req.userId
      },
      include: {
        category: true
      }
    });

    if (!budget) {
      return res.status(404).json({ error: 'Budget not found' });
    }

    res.json({ budget });
  } catch (error) {
    logger.logError(error, null, { context: 'get-budget-by-id' });
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Update a budget
 * PUT /api/v1/budgets/:id
 */
const updateBudget = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      amount,
      currency,
      period,
      month,
      year,
      categoryId,
      alertAt80,
      alertAt100,
      notes
    } = req.body;

    // Check if budget exists and belongs to user
    const existingBudget = await prisma.budget.findFirst({
      where: {
        id,
        userId: req.userId
      }
    });

    if (!existingBudget) {
      return res.status(404).json({ error: 'Budget not found' });
    }

    // Validate amount if provided
    if (amount !== undefined && amount <= 0) {
      return res.status(400).json({ error: 'Amount must be a positive number' });
    }

    // Validate period if provided
    if (period && !['monthly', 'yearly'].includes(period)) {
      return res.status(400).json({ error: 'Period must be either "monthly" or "yearly"' });
    }

    // Validate year if provided
    if (year !== undefined && (year < 2000 || year > 2100)) {
      return res.status(400).json({ error: 'Year must be between 2000 and 2100' });
    }

    // Validate month if provided
    const finalPeriod = period || existingBudget.period;
    if (finalPeriod === 'monthly' && month !== undefined && (month < 1 || month > 12)) {
      return res.status(400).json({ error: 'Month must be between 1 and 12 for monthly budgets' });
    }

    // Validate currency if provided
    if (currency) {
      const validCurrencies = ['USD', 'EUR', 'GBP', 'JPY', 'AUD', 'CAD', 'CHF', 'CNY', 'INR', 'BDT'];
      const finalCurrency = currency.toUpperCase();
      if (!validCurrencies.includes(finalCurrency)) {
        return res.status(400).json({
          error: `Invalid currency. Supported currencies: ${validCurrencies.join(', ')}`
        });
      }
    }

    // Validate category if provided
    if (categoryId !== undefined && categoryId !== null) {
      const category = await prisma.category.findFirst({
        where: {
          id: categoryId,
          userId: req.userId
        }
      });

      if (!category) {
        return res.status(404).json({ error: 'Category not found' });
      }
    }

    // Build update data
    const updateData = {};
    if (amount !== undefined) updateData.amount = parseFloat(amount);
    if (currency !== undefined) updateData.currency = currency.toUpperCase();
    if (period !== undefined) updateData.period = period;
    if (month !== undefined) updateData.month = finalPeriod === 'monthly' ? month : null;
    if (year !== undefined) updateData.year = year;
    if (categoryId !== undefined) updateData.categoryId = categoryId || null;
    if (alertAt80 !== undefined) updateData.alertAt80 = alertAt80;
    if (alertAt100 !== undefined) updateData.alertAt100 = alertAt100;
    if (notes !== undefined) updateData.notes = notes || null;

    // Update the budget
    const updatedBudget = await prisma.budget.update({
      where: { id },
      data: updateData,
      include: {
        category: true
      }
    });

    res.json({
      message: 'Budget updated successfully',
      budget: updatedBudget
    });
  } catch (error) {
    // Handle unique constraint violation
    if (error.code === 'P2002') {
      return res.status(409).json({
        error: 'A budget with these parameters already exists'
      });
    }
    logger.logError(error, null, { context: 'update-budget' });
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Delete a budget
 * DELETE /api/v1/budgets/:id
 */
const deleteBudget = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if budget exists and belongs to user
    const budget = await prisma.budget.findFirst({
      where: {
        id,
        userId: req.userId
      }
    });

    if (!budget) {
      return res.status(404).json({ error: 'Budget not found' });
    }

    // Delete the budget
    await prisma.budget.delete({
      where: { id }
    });

    res.json({ message: 'Budget deleted successfully' });
  } catch (error) {
    logger.logError(error, null, { context: 'delete-budget' });
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Get budget status with actual spending comparison
 * GET /api/v1/budgets/status
 */
const getBudgetStatus = async (req, res) => {
  try {
    const { year, month, categoryId } = req.query;

    // Default to current year/month if not provided
    const currentDate = new Date();
    const targetYear = year ? parseInt(year) : currentDate.getFullYear();
    const targetMonth = month ? parseInt(month) : currentDate.getMonth() + 1;

    // Validate year parameter
    if (year && (isNaN(targetYear) || targetYear < 2000 || targetYear > 2100)) {
      return res.status(400).json({
        error: 'Invalid year parameter. Must be between 2000 and 2100'
      });
    }

    // Validate month parameter
    if (month && (isNaN(targetMonth) || targetMonth < 1 || targetMonth > 12)) {
      return res.status(400).json({
        error: 'Invalid month parameter. Must be between 1 and 12'
      });
    }

    // Build where clause for budgets
    const budgetWhere = {
      userId: req.userId,
      year: targetYear
    };

    if (categoryId) {
      // Verify category exists and belongs to user
      const category = await prisma.category.findFirst({
        where: {
          id: categoryId,
          userId: req.userId
        }
      });

      if (!category) {
        return res.status(404).json({ error: 'Category not found' });
      }

      budgetWhere.categoryId = categoryId;
    }

    // Get all relevant budgets (monthly and yearly)
    const budgets = await prisma.budget.findMany({
      where: budgetWhere,
      include: {
        category: {
          select: {
            id: true,
            name: true,
            color: true,
            icon: true
          }
        }
      }
    });

    // Calculate spending for each budget
    const budgetStatusList = await Promise.all(
      budgets.map(async (budget) => {
        // Determine date range based on budget period
        let startDate, endDate;

        if (budget.period === 'monthly') {
          // Skip if budget month doesn't match target month
          if (budget.month !== targetMonth) {
            return null;
          }
          startDate = new Date(targetYear, targetMonth - 1, 1);
          endDate = new Date(targetYear, targetMonth, 0, 23, 59, 59, 999);
        } else {
          // Yearly budget
          startDate = new Date(targetYear, 0, 1);
          endDate = new Date(targetYear, 11, 31, 23, 59, 59, 999);
        }

        // Build expense query
        const expenseWhere = {
          userId: req.userId,
          date: {
            gte: startDate,
            lte: endDate
          }
        };

        // Add category filter if budget is category-specific
        if (budget.categoryId) {
          expenseWhere.categoryId = budget.categoryId;
        }

        // Calculate total spending
        const totalSpending = await prisma.expense.aggregate({
          where: expenseWhere,
          _sum: { amount: true }
        });

        const spent = totalSpending._sum.amount || 0;
        const remaining = budget.amount - spent;
        const percentageUsed = budget.amount > 0 ? (spent / budget.amount) * 100 : 0;

        // Determine alert status
        const alerts = [];
        if (budget.alertAt80 && percentageUsed >= 80 && percentageUsed < 100) {
          alerts.push({
            type: 'warning',
            message: `You've used ${percentageUsed.toFixed(1)}% of your budget`
          });
        }
        if (budget.alertAt100 && percentageUsed >= 100) {
          alerts.push({
            type: 'danger',
            message: `You've exceeded your budget by ${Math.abs(remaining).toFixed(2)} ${budget.currency}`
          });
        }

        return {
          budgetId: budget.id,
          budgetAmount: budget.amount,
          currency: budget.currency,
          period: budget.period,
          month: budget.month,
          year: budget.year,
          category: budget.category,
          spent: parseFloat(spent.toFixed(2)),
          remaining: parseFloat(remaining.toFixed(2)),
          percentageUsed: parseFloat(percentageUsed.toFixed(2)),
          isOverBudget: remaining < 0,
          alerts
        };
      })
    );

    // Filter out null entries (monthly budgets not matching target month)
    const filteredStatus = budgetStatusList.filter(status => status !== null);

    // Calculate overall summary (excluding category-specific budgets)
    const overallBudgets = filteredStatus.filter(status => !status.category);
    const categoryBudgets = filteredStatus.filter(status => status.category);

    const overallSummary = overallBudgets.length > 0 ? {
      totalBudget: parseFloat(overallBudgets.reduce((sum, b) => sum + b.budgetAmount, 0).toFixed(2)),
      totalSpent: parseFloat(overallBudgets.reduce((sum, b) => sum + b.spent, 0).toFixed(2)),
      totalRemaining: parseFloat(overallBudgets.reduce((sum, b) => sum + b.remaining, 0).toFixed(2))
    } : null;

    res.json({
      year: targetYear,
      month: targetMonth,
      overallSummary,
      budgetStatus: filteredStatus,
      categoryBreakdown: categoryBudgets
    });
  } catch (error) {
    logger.logError(error, null, { context: 'get-budget-status' });
    res.status(500).json({ error: 'Internal server error' });
  }
};

export {
  createBudget,
  getBudgets,
  getBudgetById,
  updateBudget,
  deleteBudget,
  getBudgetStatus
};
