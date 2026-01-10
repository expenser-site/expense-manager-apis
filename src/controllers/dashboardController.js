import prisma from '../config/database.js';
import logger from '../config/logger.js';
import { dashboardLinks, addExpenseLinks } from '../utils/hateoas.js';

const getDashboardSummary = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

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
      ...dateFilter
    };

    // Use aggregation instead of loading all records
    const [totalExpenses, expenseCount, categoryBreakdown] = await Promise.all([
      prisma.expense.aggregate({
        where,
        _sum: { amount: true }
      }),
      prisma.expense.count({ where }),
      // Use groupBy aggregation instead of loading all expenses
      prisma.expense.groupBy({
        by: ['categoryId'],
        where,
        _sum: { amount: true }
      })
    ]);

    // Fetch category names for the grouped results (only unique categories)
    const categoryIds = categoryBreakdown.map(item => item.categoryId);
    const categories = await prisma.category.findMany({
      where: { id: { in: categoryIds } },
      select: { id: true, name: true }
    });

    const categoryMap = categories.reduce((acc, cat) => {
      acc[cat.id] = cat.name;
      return acc;
    }, {});

    const categoryBreakdownByName = categoryBreakdown.reduce((acc, item) => {
      const categoryName = categoryMap[item.categoryId] || 'Unknown';
      acc[categoryName] = item._sum.amount || 0;
      return acc;
    }, {});

    const averageExpense = expenseCount > 0 ? (totalExpenses._sum.amount || 0) / expenseCount : 0;

    res.json({
      summary: {
        totalAmount: totalExpenses._sum.amount || 0,
        totalCount: expenseCount,
        averageExpense: parseFloat(averageExpense.toFixed(2)),
        categoryBreakdown: categoryBreakdownByName
      },
      _links: [
        dashboardLinks.summary(),
        dashboardLinks.categoryAnalytics(),
        dashboardLinks.monthlyTrends(),
        dashboardLinks.recentExpenses(),
        dashboardLinks.expenses(),
        dashboardLinks.categories()
      ]
    });
  } catch (error) {
    logger.logError(error, null, { context: 'dashboard-summary' });
    res.status(500).json({ error: 'Internal server error' });
  }
};

const getCategoryAnalytics = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

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
      ...dateFilter
    };

    // Use groupBy aggregation instead of loading all expenses
    const groupedExpenses = await prisma.expense.groupBy({
      by: ['categoryId'],
      where,
      _sum: { amount: true },
      _count: { id: true }
    });

    // Fetch category details only for categories that have expenses
    const categoryIds = groupedExpenses.map(item => item.categoryId);
    const categories = await prisma.category.findMany({
      where: { id: { in: categoryIds } },
      select: { id: true, name: true, color: true, icon: true }
    });

    const categoryMap = categories.reduce((acc, cat) => {
      acc[cat.id] = cat;
      return acc;
    }, {});

    const categoryAnalytics = groupedExpenses.map(item => {
      const category = categoryMap[item.categoryId] || {};
      const totalAmount = item._sum.amount || 0;
      const count = item._count.id || 0;

      return {
        categoryId: item.categoryId,
        categoryName: category.name || 'Unknown',
        color: category.color,
        icon: category.icon,
        totalAmount,
        count,
        averageAmount: count > 0 ? parseFloat((totalAmount / count).toFixed(2)) : 0
      };
    });

    res.json({
      categoryAnalytics,
      _links: [
        dashboardLinks.categoryAnalytics(),
        dashboardLinks.summary(),
        dashboardLinks.categories()
      ]
    });
  } catch (error) {
    logger.logError(error, null, { context: 'category-analytics' });
    res.status(500).json({ error: 'Internal server error' });
  }
};

const getMonthlyTrends = async (req, res) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { year, startDate, endDate } = req.query;

    // Determine date range
    let dateStart, dateEnd;
    if (year) {
      // If year is provided, show data for that specific year
      const yearToUse = parseInt(year);

      // Validate year parameter
      if (isNaN(yearToUse) || yearToUse < 1900 || yearToUse > 2100) {
        return res.status(400).json({
          error: 'Invalid year parameter. Must be between 1900 and 2100'
        });
      }

      dateStart = new Date(`${yearToUse}-01-01`);
      dateEnd = new Date(`${yearToUse}-12-31T23:59:59.999Z`);
    } else if (startDate && endDate) {
      // If custom date range is provided
      dateStart = new Date(startDate);
      dateEnd = new Date(endDate);
      dateEnd.setHours(23, 59, 59, 999);
    } else {
      // Default: show last 12 months from today
      dateEnd = new Date();
      dateStart = new Date();
      dateStart.setMonth(dateStart.getMonth() - 11);
      dateStart.setDate(1); // Start from the 1st of the month
      dateStart.setHours(0, 0, 0, 0);
    }

    // Use raw query for better performance with large datasets
    const monthlyTrends = await prisma.$queryRaw`
      SELECT 
        TO_CHAR(date, 'YYYY-MM') as month,
        COUNT(*)::INTEGER as count,
        COALESCE(SUM(amount), 0)::DECIMAL as "totalAmount"
      FROM "public"."expenses"
      WHERE "userId" = ${req.userId}
        AND date >= ${dateStart}
        AND date <= ${dateEnd}
      GROUP BY TO_CHAR(date, 'YYYY-MM')
      ORDER BY month
    `;

    // Create a map for quick lookup
    const trendsMap = new Map(
      monthlyTrends
        .map(t => ({
          key: t.month,
          value: {
            totalAmount: parseFloat(t.totalAmount),
            count: t.count
          }
        }))
        .map(item => [item.key, item.value])
    );

    // Build complete monthly data array for the date range
    const monthlyData = [];
    const currentDate = new Date(dateStart);

    while (currentDate <= dateEnd) {
      const monthKey = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`;
      const data = trendsMap.get(monthKey) || { totalAmount: 0, count: 0 };

      monthlyData.push({
        month: monthKey,
        total: data.totalAmount,
        count: data.count
      });

      // Move to next month
      currentDate.setMonth(currentDate.getMonth() + 1);
    }

    res.json({
      trends: monthlyData,
      _links: [dashboardLinks.monthlyTrends(), dashboardLinks.summary(), dashboardLinks.expenses()]
    });
  } catch (error) {
    logger.logError(error, null, {
      context: 'monthly-trends',
      userId: req.userId,
      query: req.query,
      errorMessage: error.message,
      errorStack: error.stack
    });
    res.status(500).json({
      error: 'Internal server error',
      ...(process.env.NODE_ENV === 'development' && { details: error.message })
    });
  }
};

const getRecentExpenses = async (req, res) => {
  try {
    const { limit = 5 } = req.query;

    // Enforce maximum limit to prevent abuse
    const maxLimit = 50;
    const safeLimit = Math.min(parseInt(limit) || 5, maxLimit);

    const expenses = await prisma.expense.findMany({
      where: { userId: req.userId },
      orderBy: [
        { date: 'desc' },
        { createdAt: 'desc' } // Secondary sort for same-day expenses
      ],
      take: safeLimit,
      select: {
        id: true,
        title: true,
        amount: true,
        currency: true,
        date: true,
        description: true,
        createdAt: true,
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

    const expensesWithLinks = expenses.map(expense => addExpenseLinks(expense));

    res.json({
      expenses: expensesWithLinks,
      _links: [dashboardLinks.recentExpenses(), dashboardLinks.summary(), dashboardLinks.expenses()]
    });
  } catch (error) {
    logger.logError(error, null, { context: 'recent-expenses' });
    res.status(500).json({ error: 'Internal server error' });
  }
};

export { getDashboardSummary, getCategoryAnalytics, getMonthlyTrends, getRecentExpenses };
