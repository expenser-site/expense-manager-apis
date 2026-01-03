import prisma from '../config/database.js';
import logger from '../config/logger.js';

const getDashboardSummary = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    const where = {
      userId: req.userId,
      ...(startDate &&
        endDate && {
        date: {
          gte: new Date(startDate),
          lte: new Date(endDate)
        }
      })
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
      }
    });
  } catch (error) {
    logger.logError(error, null, { context: 'dashboard-summary' });
    res.status(500).json({ error: 'Internal server error' });
  }
};

const getCategoryAnalytics = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    const where = {
      userId: req.userId,
      ...(startDate &&
        endDate && {
        date: {
          gte: new Date(startDate),
          lte: new Date(endDate)
        }
      })
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

    res.json({ categoryAnalytics });
  } catch (error) {
    logger.logError(error, null, { context: 'category-analytics' });
    res.status(500).json({ error: 'Internal server error' });
  }
};

const getMonthlyTrends = async (req, res) => {
  try {
    const { year = new Date().getFullYear() } = req.query;

    const expenses = await prisma.expense.findMany({
      where: {
        userId: req.userId,
        date: {
          gte: new Date(`${year}-01-01`),
          lte: new Date(`${year}-12-31`)
        }
      },
      orderBy: { date: 'asc' }
    });

    const monthlyData = Array.from({ length: 12 }, (_, i) => ({
      month: i + 1,
      monthName: new Date(year, i).toLocaleString('default', { month: 'long' }),
      totalAmount: 0,
      count: 0
    }));

    expenses.forEach(expense => {
      const month = new Date(expense.date).getMonth();
      monthlyData[month].totalAmount += expense.amount;
      monthlyData[month].count += 1;
    });

    res.json({ trends: monthlyData });
  } catch (error) {
    logger.logError(error, null, { context: 'monthly-trends' });
    res.status(500).json({ error: 'Internal server error' });
  }
};

const getRecentExpenses = async (req, res) => {
  try {
    const { limit = 5 } = req.query;

    const expenses = await prisma.expense.findMany({
      where: { userId: req.userId },
      orderBy: { date: 'desc' },
      take: parseInt(limit),
      include: {
        category: true
      }
    });

    res.json({ expenses });
  } catch (error) {
    logger.logError(error, null, { context: 'recent-expenses' });
    res.status(500).json({ error: 'Internal server error' });
  }
};

export { getDashboardSummary, getCategoryAnalytics, getMonthlyTrends, getRecentExpenses };
