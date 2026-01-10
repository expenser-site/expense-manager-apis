import prisma from '../config/database.js';
import logger from '../config/logger.js';
import {
  createDefaultCategories,
  assignNoCategoryToOrphanExpenses
} from '../utils/defaultCategories.js';

/**
 * Ensure current logged-in user has default categories
 * This endpoint is called after login to handle old users without default categories
 */
const ensureUserDefaultCategories = async (req, res) => {
  try {
    const userId = req.userId;

    // Check if user has any categories
    const categoriesCount = await prisma.category.count({
      where: { userId }
    });

    // If user already has categories, return success
    if (categoriesCount > 0) {
      // Still check for "No Category" and orphan expenses
      const hasNoCategory = await prisma.category.findFirst({
        where: {
          userId,
          name: 'No Category'
        }
      });

      let noCategoryCreated = false;
      if (!hasNoCategory) {
        await prisma.category.create({
          data: {
            name: 'No Category',
            color: '#9CA3AF',
            icon: '📋',
            userId
          }
        });
        noCategoryCreated = true;
      }

      // Fix any orphan expenses
      const orphanExpensesFixed = await assignNoCategoryToOrphanExpenses(userId);

      return res.json({
        success: true,
        message: 'User categories verified',
        alreadyMigrated: true,
        noCategoryCreated,
        orphanExpensesFixed
      });
    }

    // User has no categories - create default ones
    const { categories } = await createDefaultCategories(userId);

    // Fix any orphan expenses
    const orphanExpensesFixed = await assignNoCategoryToOrphanExpenses(userId);

    logger.info(`Created default categories for user ${userId}`, {
      userId,
      categoriesCount: categories.length,
      orphanExpensesFixed
    });

    res.json({
      success: true,
      message: 'Default categories created successfully',
      alreadyMigrated: false,
      categoriesCreated: categories.length,
      orphanExpensesFixed
    });
  } catch (error) {
    logger.logError(error, null, {
      context: 'ensure-user-default-categories',
      userId: req.userId
    });
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Migrate all existing users to have default categories
 * and assign orphan expenses to "No Category"
 * ADMIN ONLY - Migrates all users in the system
 */
const migrateDefaultCategories = async (req, res) => {
  try {
    // Get all users
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        categories: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });

    const results = {
      total: users.length,
      usersWithCategories: 0,
      usersWithoutCategories: 0,
      categoriesCreated: 0,
      expensesUpdated: 0,
      errors: []
    };

    for (const user of users) {
      try {
        // Check if user already has categories
        if (user.categories.length === 0) {
          // User has no categories, create default ones
          const { categories } = await createDefaultCategories(user.id);
          results.usersWithoutCategories++;
          results.categoriesCreated += categories.length;

          logger.info(`Created default categories for user ${user.email}`, {
            userId: user.id,
            categoriesCount: categories.length
          });
        } else {
          // Check if user has "No Category"
          const hasNoCategory = user.categories.some(cat => cat.name === 'No Category');

          if (!hasNoCategory) {
            // Create only "No Category" for this user
            await prisma.category.create({
              data: {
                name: 'No Category',
                color: '#9CA3AF',
                icon: '📋',
                userId: user.id
              }
            });
            results.categoriesCreated++;
          }

          results.usersWithCategories++;
        }

        // Assign orphan expenses to "No Category"
        const updatedCount = await assignNoCategoryToOrphanExpenses(user.id);
        results.expensesUpdated += updatedCount;
      } catch (error) {
        logger.logError(error, null, {
          context: 'migrate-user-categories',
          userId: user.id
        });
        results.errors.push({
          userId: user.id,
          email: user.email,
          error: error.message
        });
      }
    }

    res.json({
      success: true,
      message: 'Migration completed',
      results
    });
  } catch (error) {
    logger.logError(error, null, { context: 'migrate-default-categories' });
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Check migration status
 */
const checkMigrationStatus = async (req, res) => {
  try {
    const [totalUsers, usersWithCategories, totalExpenses] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({
        where: {
          categories: {
            some: {}
          }
        }
      }),
      prisma.expense.count()
    ]);

    // Get count of users with "No Category"
    const usersWithNoCategory = await prisma.user.count({
      where: {
        categories: {
          some: {
            name: 'No Category'
          }
        }
      }
    });

    // Get count of categories
    const totalCategories = await prisma.category.count();

    res.json({
      users: {
        total: totalUsers,
        withCategories: usersWithCategories,
        withoutCategories: totalUsers - usersWithCategories,
        withNoCategory: usersWithNoCategory
      },
      expenses: {
        total: totalExpenses
      },
      categories: {
        total: totalCategories,
        averagePerUser: totalUsers > 0 ? (totalCategories / totalUsers).toFixed(2) : 0
      }
    });
  } catch (error) {
    logger.logError(error, null, { context: 'check-migration-status' });
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Fix orphan expenses for all users
 */
const fixOrphanExpenses = async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      select: { id: true, email: true }
    });

    let totalUpdated = 0;
    const errors = [];

    for (const user of users) {
      try {
        const updatedCount = await assignNoCategoryToOrphanExpenses(user.id);
        totalUpdated += updatedCount;
      } catch (error) {
        logger.logError(error, null, {
          context: 'fix-orphan-expenses',
          userId: user.id
        });
        errors.push({
          userId: user.id,
          email: user.email,
          error: error.message
        });
      }
    }

    res.json({
      success: true,
      message: 'Orphan expenses fixed',
      totalExpensesUpdated: totalUpdated,
      usersProcessed: users.length,
      errors
    });
  } catch (error) {
    logger.logError(error, null, { context: 'fix-orphan-expenses' });
    res.status(500).json({ error: 'Internal server error' });
  }
};

export {
  ensureUserDefaultCategories,
  migrateDefaultCategories,
  checkMigrationStatus,
  fixOrphanExpenses
};
