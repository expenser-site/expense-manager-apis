import { validationResult } from 'express-validator';
import prisma from '../config/database.js';
import logger from '../config/logger.js';
import { getOrCreateNoCategory } from '../utils/defaultCategories.js';
import { addExpenseLinks, addCollectionLinks, expenseLinks } from '../utils/hateoas.js';

const createExpense = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { title, amount, categoryId, description, date, currency } = req.body;

    // Validate title
    if (!title || title.trim().length === 0) {
      return res.status(400).json({ error: 'Title is required and cannot be empty' });
    }
    if (title.length > 255) {
      return res.status(400).json({ error: 'Title cannot exceed 255 characters' });
    }

    // Validate description length if provided
    if (description && description.length > 1000) {
      return res.status(400).json({ error: 'Description cannot exceed 1000 characters' });
    }

    // Validate amount
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount < 0) {
      return res.status(400).json({ error: 'Amount must be a valid non-negative number' });
    }
    if (numAmount > 999999999.99) {
      return res.status(400).json({ error: 'Amount exceeds maximum allowed value' });
    }

    // Validate currency
    const validCurrencies = ['USD', 'EUR', 'GBP', 'JPY', 'AUD', 'CAD', 'CHF', 'CNY', 'INR', 'BDT'];
    const finalCurrency = (currency || 'USD').toUpperCase();
    if (!validCurrencies.includes(finalCurrency)) {
      return res.status(400).json({
        error: `Invalid currency. Supported currencies: ${validCurrencies.join(', ')}`
      });
    }

    let finalCategoryId = categoryId;

    // If no category is provided, assign to "No Category"
    if (!categoryId) {
      finalCategoryId = await getOrCreateNoCategory(req.userId);
    } else {
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
    }

    // Validate and parse date if provided
    let expenseDate = new Date();
    if (date) {
      expenseDate = new Date(date);
      if (isNaN(expenseDate.getTime())) {
        return res.status(400).json({ error: 'Invalid date format' });
      }
      // Prevent future dates beyond reasonable limit
      const maxFutureDate = new Date();
      maxFutureDate.setFullYear(maxFutureDate.getFullYear() + 1);
      if (expenseDate > maxFutureDate) {
        return res.status(400).json({ error: 'Date cannot be more than 1 year in the future' });
      }
    }

    const expense = await prisma.expense.create({
      data: {
        title,
        amount: numAmount,
        currency: finalCurrency,
        categoryId: finalCategoryId,
        description,
        date: expenseDate,
        userId: req.userId
      },
      include: {
        category: true
      }
    });

    res.status(201).json({
      message: 'Expense created successfully',
      expense: addExpenseLinks(expense),
      _links: [expenseLinks.self(expense.id), expenseLinks.collection()]
    });
  } catch (error) {
    logger.logError(error, null, { context: 'create-expense' });
    res.status(500).json({ error: 'Internal server error' });
  }
};

const getExpenses = async (req, res) => {
  try {
    const { page = 1, limit = 10, categoryId, startDate, endDate, search } = req.query;

    // Sanitize and validate search parameter
    let sanitizedSearch = '';
    if (search) {
      sanitizedSearch = search.toString().trim().substring(0, 100); // Limit search length
      // Remove potential SQL injection characters
      sanitizedSearch = sanitizedSearch.replace(/[;'"\\]/g, '');
    }

    // Limit maximum page size to prevent memory issues
    const maxLimit = 100;
    const safeLimit = Math.min(parseInt(limit), maxLimit);
    const skip = (page - 1) * safeLimit;

    // Build date filter - include entire end date
    let dateFilter = {};
    if (startDate && endDate) {
      const endDateTime = new Date(endDate);
      endDateTime.setHours(23, 59, 59, 999);
      dateFilter = {
        date: {
          gte: new Date(startDate),
          lte: endDateTime
        }
      };
    }

    const where = {
      userId: req.userId,
      ...(categoryId && { categoryId }),
      ...dateFilter,
      ...(sanitizedSearch && {
        OR: [
          { title: { contains: sanitizedSearch, mode: 'insensitive' } },
          { description: { contains: sanitizedSearch, mode: 'insensitive' } }
        ]
      })
    };

    const [expenses, total] = await Promise.all([
      prisma.expense.findMany({
        where,
        orderBy: { date: 'desc' },
        skip: parseInt(skip),
        take: safeLimit,
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
      }),
      prisma.expense.count({ where })
    ]);

    const expensesWithLinks = expenses.map(expense => addExpenseLinks(expense));

    res.json({
      expenses: expensesWithLinks,
      pagination: {
        page: parseInt(page),
        limit: safeLimit,
        total,
        pages: Math.ceil(total / safeLimit)
      },
      _links: addCollectionLinks('/expenses', {
        page: parseInt(page),
        limit: safeLimit,
        pages: Math.ceil(total / safeLimit)
      })
    });
  } catch (error) {
    logger.logError(error, null, { context: 'get-expenses' });
    res.status(500).json({ error: 'Internal server error' });
  }
};

const getExpenseById = async (req, res) => {
  try {
    const { id } = req.params;

    const expense = await prisma.expense.findFirst({
      where: {
        id,
        userId: req.userId
      },
      include: {
        category: true
      }
    });

    if (!expense) {
      return res.status(404).json({ error: 'Expense not found' });
    }

    res.json({
      expense: addExpenseLinks(expense)
    });
  } catch (error) {
    logger.logError(error, null, { context: 'get-expense-by-id' });
    res.status(500).json({ error: 'Internal server error' });
  }
};

const updateExpense = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;
    const { title, amount, categoryId, description, date, currency } = req.body;

    const existingExpense = await prisma.expense.findFirst({
      where: {
        id,
        userId: req.userId
      }
    });

    if (!existingExpense) {
      return res.status(404).json({ error: 'Expense not found' });
    }

    // Validate title if provided
    if (title !== undefined) {
      if (!title || title.trim().length === 0) {
        return res.status(400).json({ error: 'Title cannot be empty' });
      }
      if (title.length > 255) {
        return res.status(400).json({ error: 'Title cannot exceed 255 characters' });
      }
    }

    // Validate description length if provided
    if (description !== undefined && description && description.length > 1000) {
      return res.status(400).json({ error: 'Description cannot exceed 1000 characters' });
    }

    // Validate amount if provided
    if (amount !== undefined) {
      const numAmount = parseFloat(amount);
      if (isNaN(numAmount) || numAmount < 0) {
        return res.status(400).json({ error: 'Amount must be a valid non-negative number' });
      }
      if (numAmount > 999999999.99) {
        return res.status(400).json({ error: 'Amount exceeds maximum allowed value' });
      }
    }

    // Validate currency if provided
    const validCurrencies = ['USD', 'EUR', 'GBP', 'JPY', 'AUD', 'CAD', 'CHF', 'CNY', 'INR', 'BDT'];
    if (currency && !validCurrencies.includes(currency.toUpperCase())) {
      return res.status(400).json({
        error: `Invalid currency. Supported currencies: ${validCurrencies.join(', ')}`
      });
    }

    // If categoryId is being updated, verify it exists and belongs to user
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

    // Build update data object with proper handling of falsy values
    const updateData = {};
    if (title !== undefined) updateData.title = title;
    if (amount !== undefined) updateData.amount = parseFloat(amount);
    if (currency !== undefined) updateData.currency = currency.toUpperCase();
    if (categoryId !== undefined) updateData.categoryId = categoryId;
    if (description !== undefined) updateData.description = description;
    if (date !== undefined) {
      const parsedDate = new Date(date);
      if (isNaN(parsedDate.getTime())) {
        return res.status(400).json({ error: 'Invalid date format' });
      }
      // Prevent future dates beyond reasonable limit
      const maxFutureDate = new Date();
      maxFutureDate.setFullYear(maxFutureDate.getFullYear() + 1);
      if (parsedDate > maxFutureDate) {
        return res.status(400).json({ error: 'Date cannot be more than 1 year in the future' });
      }
      updateData.date = parsedDate;
    }

    // Check if there's anything to update
    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    const expense = await prisma.expense.update({
      where: { id },
      data: updateData,
      include: {
        category: true
      }
    });

    res.json({
      message: 'Expense updated successfully',
      expense: addExpenseLinks(expense)
    });
  } catch (error) {
    logger.logError(error, null, { context: 'update-expense' });
    res.status(500).json({ error: 'Internal server error' });
  }
};

const deleteExpense = async (req, res) => {
  try {
    const { id } = req.params;

    const existingExpense = await prisma.expense.findFirst({
      where: {
        id,
        userId: req.userId
      }
    });

    if (!existingExpense) {
      return res.status(404).json({ error: 'Expense not found' });
    }

    await prisma.expense.delete({
      where: { id }
    });

    res.json({
      message: 'Expense deleted successfully',
      _links: [expenseLinks.collection(), expenseLinks.create()]
    });
  } catch (error) {
    logger.logError(error, null, { context: 'delete-expense' });
    res.status(500).json({ error: 'Internal server error' });
  }
};

const bulkDeleteExpenses = async (req, res) => {
  try {
    const { expenseIds } = req.body;

    if (!Array.isArray(expenseIds) || expenseIds.length === 0) {
      return res.status(400).json({ error: 'expenseIds must be a non-empty array' });
    }

    // Limit bulk delete to prevent abuse
    if (expenseIds.length > 100) {
      return res.status(400).json({ error: 'Cannot delete more than 100 expenses at once' });
    }

    // Use transaction for atomic bulk delete
    const result = await prisma.expense.deleteMany({
      where: {
        id: { in: expenseIds },
        userId: req.userId
      }
    });

    if (result.count === 0) {
      return res.status(404).json({
        message: 'No expenses found to delete. They may not exist or not belong to you.',
        deletedCount: 0
      });
    }

    res.json({
      message: `${result.count} expense(s) deleted successfully`,
      deletedCount: result.count,
      requestedCount: expenseIds.length
    });
  } catch (error) {
    logger.logError(error, null, { context: 'bulk-delete-expenses' });
    res.status(500).json({ error: 'Internal server error' });
  }
};

export {
  createExpense,
  getExpenses,
  getExpenseById,
  updateExpense,
  deleteExpense,
  bulkDeleteExpenses
};
