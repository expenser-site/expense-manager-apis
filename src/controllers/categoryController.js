import { validationResult } from 'express-validator';
import prisma from '../config/database.js';
import logger from '../config/logger.js';
import { addCategoryLinks, addCollectionLinks, categoryLinks } from '../utils/hateoas.js';

const createCategory = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, color, icon } = req.body;

    // Validate category name
    if (!name || name.trim().length === 0) {
      return res.status(400).json({ error: 'Category name is required and cannot be empty' });
    }
    if (name.length > 100) {
      return res.status(400).json({ error: 'Category name cannot exceed 100 characters' });
    }

    // Check if category with same name already exists for this user
    const existingCategory = await prisma.category.findUnique({
      where: {
        userId_name: {
          userId: req.userId,
          name
        }
      }
    });

    if (existingCategory) {
      return res.status(409).json({
        error: 'Category with this name already exists'
      });
    }

    const category = await prisma.category.create({
      data: {
        name,
        color,
        icon,
        userId: req.userId
      }
    });

    res.status(201).json({
      message: 'Category created successfully',
      category: addCategoryLinks(category),
      _links: [categoryLinks.self(category.id), categoryLinks.collection()]
    });
  } catch (error) {
    logger.logError(error, null, { context: 'create-category' });
    res.status(500).json({ error: 'Internal server error' });
  }
};

const getCategories = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 50,
      search = '',
      sortBy = 'updatedAt',
      sortOrder = 'desc'
    } = req.query;
    const skip = (page - 1) * limit;

    // Sanitize search parameter
    const sanitizedSearch = search
      ? search
          .toString()
          .trim()
          .substring(0, 100)
          .replace(/[;'"\\]/g, '')
      : '';

    // Build where clause
    const where = {
      userId: req.userId,
      ...(sanitizedSearch && {
        name: {
          contains: sanitizedSearch,
          mode: 'insensitive'
        }
      })
    };

    // Build orderBy clause
    const validSortFields = ['name', 'createdAt', 'updatedAt'];
    const sortField = validSortFields.includes(sortBy) ? sortBy : 'updatedAt';
    const order = sortOrder === 'asc' ? 'asc' : 'desc';

    // Calculate date ranges for growth percentage
    const now = new Date();
    const currentMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);

    const [categories, total, totalAmounts, currentMonthAmounts, lastMonthAmounts] =
      await Promise.all([
        prisma.category.findMany({
          where,
          skip: parseInt(skip),
          take: parseInt(limit),
          orderBy: {
            [sortField]: order
          },
          include: {
            _count: {
              select: { expenses: true }
            }
          }
        }),
        prisma.category.count({
          where
        }),
        // Single query for all total amounts grouped by category
        prisma.expense.groupBy({
          by: ['categoryId'],
          where: {
            userId: req.userId
          },
          _sum: {
            amount: true
          }
        }),
        // Single query for current month amounts grouped by category
        prisma.expense.groupBy({
          by: ['categoryId'],
          where: {
            userId: req.userId,
            date: {
              gte: currentMonth
            }
          },
          _sum: {
            amount: true
          }
        }),
        // Single query for last month amounts grouped by category
        prisma.expense.groupBy({
          by: ['categoryId'],
          where: {
            userId: req.userId,
            date: {
              gte: lastMonth,
              lte: lastMonthEnd
            }
          },
          _sum: {
            amount: true
          }
        })
      ]);

    // Create lookup maps for O(1) access
    const totalAmountMap = new Map(
      totalAmounts.map(item => [item.categoryId, item._sum.amount || 0])
    );
    const currentMonthMap = new Map(
      currentMonthAmounts.map(item => [item.categoryId, item._sum.amount || 0])
    );
    const lastMonthMap = new Map(
      lastMonthAmounts.map(item => [item.categoryId, item._sum.amount || 0])
    );

    // Enrich categories with calculated data
    const enrichedCategories = categories.map(category => {
      const totalAmount = totalAmountMap.get(category.id) || 0;
      const currentMonthAmount = currentMonthMap.get(category.id) || 0;
      const lastMonthAmount = lastMonthMap.get(category.id) || 0;

      // Calculate growth percentage
      let growthPercentage = 0;
      if (lastMonthAmount > 0) {
        growthPercentage = ((currentMonthAmount - lastMonthAmount) / lastMonthAmount) * 100;
      } else if (currentMonthAmount > 0) {
        growthPercentage = 100; // 100% growth if went from 0 to something
      }

      return {
        ...category,
        totalAmount: parseFloat(totalAmount.toFixed(2)),
        growthPercentage: parseFloat(growthPercentage.toFixed(1))
      };
    });

    const categoriesWithLinks = enrichedCategories.map(category => addCategoryLinks(category));

    res.json({
      categories: categoriesWithLinks,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / limit)
      },
      _links: addCollectionLinks('/categories', {
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / limit)
      })
    });
  } catch (error) {
    logger.logError(error, null, { context: 'get-categories' });
    res.status(500).json({ error: 'Internal server error' });
  }
};

const getCategoryById = async (req, res) => {
  try {
    const { id } = req.params;

    const category = await prisma.category.findFirst({
      where: {
        id,
        userId: req.userId
      },
      include: {
        _count: {
          select: { expenses: true }
        }
      }
    });

    if (!category) {
      return res.status(404).json({ error: 'Category not found' });
    }

    res.json({
      category: addCategoryLinks(category)
    });
  } catch (error) {
    logger.logError(error, null, { context: 'get-category-by-id' });
    res.status(500).json({ error: 'Internal server error' });
  }
};

const updateCategory = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;
    const { name, color, icon } = req.body;

    // Check if category exists and belongs to user
    const existingCategory = await prisma.category.findFirst({
      where: {
        id,
        userId: req.userId
      }
    });

    if (!existingCategory) {
      return res.status(404).json({ error: 'Category not found' });
    }

    // Validate category name if provided
    if (name !== undefined) {
      if (!name || name.trim().length === 0) {
        return res.status(400).json({ error: 'Category name cannot be empty' });
      }
      if (name.length > 100) {
        return res.status(400).json({ error: 'Category name cannot exceed 100 characters' });
      }
    }

    // Check if new name conflicts with another category
    if (name && name !== existingCategory.name) {
      const nameConflict = await prisma.category.findUnique({
        where: {
          userId_name: {
            userId: req.userId,
            name
          }
        }
      });

      if (nameConflict) {
        return res.status(409).json({
          error: 'Category with this name already exists'
        });
      }
    }

    const category = await prisma.category.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(color !== undefined && { color }),
        ...(icon !== undefined && { icon })
      }
    });

    res.json({
      message: 'Category updated successfully',
      category: addCategoryLinks(category)
    });
  } catch (error) {
    logger.logError(error, null, { context: 'update-category' });
    res.status(500).json({ error: 'Internal server error' });
  }
};

const deleteCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const { reassignToCategoryId } = req.query;

    // Check if category exists and belongs to user
    const category = await prisma.category.findFirst({
      where: {
        id,
        userId: req.userId
      },
      select: {
        id: true,
        name: true,
        _count: {
          select: { expenses: true }
        }
      }
    });

    if (!category) {
      return res.status(404).json({ error: 'Category not found' });
    }

    // Prevent deletion of "No Category"
    if (category.name === 'No Category') {
      return res.status(400).json({
        error: 'Cannot delete "No Category". This is a system category.'
      });
    }

    // Prevent circular reassignment
    if (reassignToCategoryId && reassignToCategoryId === id) {
      return res.status(400).json({
        error: 'Cannot reassign expenses to the same category being deleted'
      });
    }

    // Use transaction to handle category deletion with expense reassignment
    await prisma.$transaction(async tx => {
      // If category has expenses, reassign them
      if (category._count.expenses > 0) {
        let targetCategoryId = reassignToCategoryId;

        // If no reassignment category provided, use or create "No Category"
        if (!targetCategoryId) {
          const noCategory = await tx.category.findFirst({
            where: {
              userId: req.userId,
              name: 'No Category'
            }
          });

          if (noCategory) {
            targetCategoryId = noCategory.id;
          } else {
            // Create "No Category" if it doesn't exist
            const newNoCategory = await tx.category.create({
              data: {
                name: 'No Category',
                color: '#9CA3AF',
                icon: '📋',
                userId: req.userId
              }
            });
            targetCategoryId = newNoCategory.id;
          }
        } else {
          // Verify reassignment category exists and belongs to user
          const reassignCategory = await tx.category.findFirst({
            where: {
              id: reassignToCategoryId,
              userId: req.userId
            }
          });

          if (!reassignCategory) {
            throw new Error('Reassignment category not found');
          }
        }

        // Reassign all expenses to the target category
        await tx.expense.updateMany({
          where: {
            categoryId: id,
            userId: req.userId
          },
          data: {
            categoryId: targetCategoryId
          }
        });
      }

      // Delete the category
      await tx.category.delete({
        where: { id }
      });
    });

    res.json({
      message: 'Category deleted successfully',
      reassignedExpenses: category._count.expenses
    });
  } catch (error) {
    if (error.message === 'Reassignment category not found') {
      return res.status(404).json({ error: error.message });
    }
    logger.logError(error, null, { context: 'delete-category' });
    res.status(500).json({ error: 'Internal server error' });
  }
};

export default {
  createCategory,
  getCategories,
  getCategoryById,
  updateCategory,
  deleteCategory
};
