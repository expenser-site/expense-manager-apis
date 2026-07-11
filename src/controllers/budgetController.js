import { validationResult } from 'express-validator';
import prisma from '../config/database.js';
import logger from '../config/logger.js'; import budgetAlertService from '../services/budgetAlertService.js'; import { budgetLinks, addBudgetLinks, addCollectionLinks } from '../utils/hateoas.js';

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
      currency,
      period = 'monthly',
      month,
      year,
      categoryIds, // Now accepts array of category IDs
      name, // Optional budget name for multiple budgets
      alertAt80 = true,
      alertAt100 = true,
      notes
    } = req.body;

    // Set defaults
    const currentYear = new Date().getFullYear();
    const finalYear = year || currentYear;
    const finalCurrency = (currency || 'USD').toUpperCase();
    const finalPeriod = period || 'monthly';
    const finalCategoryIds = categoryIds || [];

    // Validate required fields
    if (!amount || amount <= 0) {
      return res.status(400).json({ error: 'Amount must be a positive number' });
    }

    if (!month || month < 1 || month > 12) {
      return res.status(400).json({ error: 'Month must be between 1 and 12' });
    }

    if (!currency) {
      return res.status(400).json({ error: 'Currency is required' });
    }

    // Validate name length if provided
    if (name && name.trim().length > 100) {
      return res.status(400).json({ error: 'Budget name cannot exceed 100 characters' });
    }

    // Validate currency
    const validCurrencies = ['USD', 'EUR', 'GBP', 'JPY', 'AUD', 'CAD', 'CHF', 'CNY', 'INR', 'BDT'];
    if (!validCurrencies.includes(finalCurrency)) {
      return res.status(400).json({
        error: `Invalid currency. Supported currencies: ${validCurrencies.join(', ')}`
      });
    }

    // Validate categories if provided
    if (finalCategoryIds.length > 0) {
      const categories = await prisma.category.findMany({
        where: {
          id: { in: finalCategoryIds },
          userId: req.userId
        }
      });

      if (categories.length !== finalCategoryIds.length) {
        return res.status(404).json({ error: 'One or more categories not found' });
      }
    }

    // Create the budget with categories
    const budget = await prisma.budget.create({
      data: {
        amount: parseFloat(amount),
        currency: finalCurrency,
        period: finalPeriod,
        month: finalPeriod === 'monthly' ? month : null,
        year: finalYear,
        name: name?.trim() || null,
        userId: req.userId,
        alertAt80: alertAt80 !== undefined ? alertAt80 : true,
        alertAt100: alertAt100 !== undefined ? alertAt100 : true,
        notes: notes || null,
        categories: {
          create: finalCategoryIds.map((categoryId) => ({
            categoryId
          }))
        }
      },
      include: {
        categories: {
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
        }
      }
    });

    res.status(201).json({
      message: 'Budget created successfully',
      budget: addBudgetLinks(budget),
      _links: [budgetLinks.self(budget.id), budgetLinks.collection(), budgetLinks.status()]
    });
  } catch (error) {
    logger.logError(error, req, { context: 'create-budget' });
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
          categories: {
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
          }
        },
        orderBy,
        skip,
        take: safeLimit
      }),
      prisma.budget.count({ where })
    ]);

    const pagination = {
      total: totalCount,
      page: safePage,
      limit: safeLimit,
      pages: Math.ceil(totalCount / safeLimit)
    };

    res.json({
      budgets: budgets.map(budget => addBudgetLinks(budget)),
      pagination,
      _links: [
        ...addCollectionLinks('/v1/budgets', pagination),
        budgetLinks.create(),
        budgetLinks.status()
      ]
    });
  } catch (error) {
    logger.logError(error, req, { context: 'get-budgets' });
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
        categories: {
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
        }
      }
    });

    if (!budget) {
      return res.status(404).json({ error: 'Budget not found' });
    }

    res.json({
      budget: addBudgetLinks(budget),
      _links: [
        budgetLinks.self(budget.id),
        budgetLinks.update(budget.id),
        budgetLinks.delete(budget.id),
        budgetLinks.collection(),
        budgetLinks.status()
      ]
    });
  } catch (error) {
    logger.logError(error, req, { context: 'get-budget-by-id' });
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
      categoryIds,
      name,
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

    // Validate name length if provided
    if (name !== undefined && name && name.trim().length > 100) {
      return res.status(400).json({ error: 'Budget name cannot exceed 100 characters' });
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

    // Validate categories if provided
    if (categoryIds !== undefined && categoryIds.length > 0) {
      const categories = await prisma.category.findMany({
        where: {
          id: { in: categoryIds },
          userId: req.userId
        }
      });

      if (categories.length !== categoryIds.length) {
        return res.status(404).json({ error: 'One or more categories not found' });
      }
    }

    // Build update data
    const updateData = {};
    if (amount !== undefined) updateData.amount = parseFloat(amount);
    if (currency !== undefined) updateData.currency = currency.toUpperCase();
    if (period !== undefined) updateData.period = period;
    if (month !== undefined) updateData.month = finalPeriod === 'monthly' ? month : null;
    if (year !== undefined) updateData.year = year;
    if (name !== undefined) updateData.name = name?.trim() || null;
    if (alertAt80 !== undefined) updateData.alertAt80 = alertAt80;
    if (alertAt100 !== undefined) updateData.alertAt100 = alertAt100;
    if (notes !== undefined) updateData.notes = notes || null;

    // Handle category updates
    if (categoryIds !== undefined) {
      // Delete existing category associations
      await prisma.budgetCategory.deleteMany({
        where: { budgetId: id }
      });

      // Create new category associations
      if (categoryIds.length > 0) {
        updateData.categories = {
          create: categoryIds.map((categoryId) => ({
            categoryId
          }))
        };
      }
    }

    // Update the budget
    const updatedBudget = await prisma.budget.update({
      where: { id },
      data: updateData,
      include: {
        categories: {
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
        }
      }
    });

    res.json({
      message: 'Budget updated successfully',
      budget: addBudgetLinks(updatedBudget),
      _links: [
        budgetLinks.self(updatedBudget.id),
        budgetLinks.delete(updatedBudget.id),
        budgetLinks.collection(),
        budgetLinks.status()
      ]
    });
  } catch (error) {
    logger.logError(error, req, { context: 'update-budget' });
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

    res.json({
      message: 'Budget deleted successfully',
      _links: [budgetLinks.collection(), budgetLinks.create(), budgetLinks.status()]
    });
  } catch (error) {
    logger.logError(error, req, { context: 'delete-budget' });
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Get budget status with actual spending comparison
 * GET /api/v1/budgets/status
 * OPTIMIZED: Fixed N+1 query issue by batching expense aggregations
 * NOW: Works with many-to-many budget-category relationships
 */
const getBudgetStatus = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { year, month, categoryId } = req.query;

    // Default to current year/month if not provided
    const currentDate = new Date();
    const targetYear = year ? parseInt(year) : currentDate.getFullYear();
    const targetMonth = month ? parseInt(month) : currentDate.getMonth() + 1;

    // Build where clause for budgets
    const budgetWhere = {
      userId: req.userId,
      year: targetYear
    };

    // If filtering by categoryId, we need to filter budgets that include this category
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

      // Filter budgets that have this category in their many-to-many relationship
      budgetWhere.categories = {
        some: {
          categoryId
        }
      };
    }

    // Get all relevant budgets (monthly and yearly) with their categories
    const budgets = await prisma.budget.findMany({
      where: budgetWhere,
      include: {
        categories: {
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
        }
      }
    });

    if (budgets.length === 0) {
      return res.json({
        year: targetYear,
        month: targetMonth,
        overallSummary: null,
        budgetStatus: [],
        categoryBreakdown: []
      });
    }

    // OPTIMIZATION: Batch all expense aggregations into a single query
    // Group budgets by their date ranges and categories to minimize queries
    const monthlyBudgets = budgets.filter(b => b.period === 'monthly' && b.month === targetMonth);
    const yearlyBudgets = budgets.filter(b => b.period === 'yearly');

    // Build date ranges
    const monthStart = new Date(targetYear, targetMonth - 1, 1);
    const monthEnd = new Date(targetYear, targetMonth, 0, 23, 59, 59, 999);
    const yearStart = new Date(targetYear, 0, 1);
    const yearEnd = new Date(targetYear, 11, 31, 23, 59, 59, 999);

    // Collect all unique category IDs from all budgets
    const allCategoryIds = new Set();
    budgets.forEach(budget => {
      budget.categories.forEach(bc => {
        allCategoryIds.add(bc.categoryId);
      });
    });

    // Aggregate expenses in batches (max 2 queries instead of N queries)
    const [monthlyExpenses, yearlyExpenses] = await Promise.all([
      // Monthly expenses grouped by category
      monthlyBudgets.length > 0 && allCategoryIds.size > 0
        ? prisma.expense.groupBy({
          by: ['categoryId'],
          where: {
            userId: req.userId,
            date: {
              gte: monthStart,
              lte: monthEnd
            },
            categoryId: {
              in: Array.from(allCategoryIds)
            }
          },
          _sum: { amount: true }
        })
        : Promise.resolve([]),

      // Yearly expenses grouped by category
      yearlyBudgets.length > 0 && allCategoryIds.size > 0
        ? prisma.expense.groupBy({
          by: ['categoryId'],
          where: {
            userId: req.userId,
            date: {
              gte: yearStart,
              lte: yearEnd
            },
            categoryId: {
              in: Array.from(allCategoryIds)
            }
          },
          _sum: { amount: true }
        })
        : Promise.resolve([])
    ]);

    // Create lookup maps for O(1) access
    const monthlyExpenseMap = new Map(
      monthlyExpenses.map(e => [e.categoryId, e._sum.amount || 0])
    );
    const yearlyExpenseMap = new Map(
      yearlyExpenses.map(e => [e.categoryId, e._sum.amount || 0])
    );

    // Build budget status from preloaded data
    const budgetStatusList = budgets
      .filter(budget => {
        // Filter monthly budgets by target month
        if (budget.period === 'monthly') {
          return budget.month === targetMonth;
        }
        return true;
      })
      .map(budget => {
        // Calculate total spent across ALL categories in this budget
        const expenseMap = budget.period === 'monthly' ? monthlyExpenseMap : yearlyExpenseMap;

        // Sum up spending from all categories associated with this budget
        const spent = budget.categories.reduce((total, bc) => {
          const categorySpent = expenseMap.get(bc.categoryId) || 0;
          return total + categorySpent;
        }, 0);

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
          categories: budget.categories.map(bc => bc.category), // Return array of categories
          spent: parseFloat(spent.toFixed(2)),
          remaining: parseFloat(remaining.toFixed(2)),
          percentageUsed: parseFloat(percentageUsed.toFixed(2)),
          isOverBudget: remaining < 0,
          alerts
        };
      });

    // Calculate overall summary
    const overallSummary = {
      totalBudget: parseFloat(budgetStatusList.reduce((sum, b) => sum + b.budgetAmount, 0).toFixed(2)),
      totalSpent: parseFloat(budgetStatusList.reduce((sum, b) => sum + b.spent, 0).toFixed(2)),
      totalRemaining: parseFloat(budgetStatusList.reduce((sum, b) => sum + b.remaining, 0).toFixed(2))
    };

    // FEATURE: Check budgets and send alerts if thresholds are reached
    // This is done asynchronously to avoid blocking the response
    budgetStatusList.forEach(status => {
      if (status.budgetId && status.percentageUsed >= 80) {
        budgetAlertService.checkAndSendAlerts(
          status.budgetId,
          status.spent,
          status.percentageUsed
        ).catch(err => {
          logger.logError(err, req, {
            context: 'budget-alert-trigger',
            budgetId: status.budgetId
          });
        });
      }
    });

    res.json({
      year: targetYear,
      month: targetMonth,
      overallSummary,
      budgetStatus: budgetStatusList.map(status => ({
        ...status,
        _links: status.budgetId ? [budgetLinks.self(status.budgetId)] : []
      })),
      _links: [
        budgetLinks.status(),
        budgetLinks.collection(),
        budgetLinks.create()
      ]
    });
  } catch (error) {
    logger.logError(error, req, { context: 'get-budget-status' });
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
