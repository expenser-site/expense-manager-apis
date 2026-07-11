/**
 * Budget Alert Service
 * Handles budget threshold alerts (80%, 100%)
 * Prevents duplicate alerts using BudgetAlert tracking
 */
import prisma from '../config/database.js';
import emailService from './email/index.js';
import { budgetAlertTemplate } from './email/templates/index.js';
import logger from '../config/logger.js';

class BudgetAlertService {
  /**
   * Check budget spending and send alerts if thresholds are reached
   * @param {string} budgetId - Budget ID to check
   * @param {number} spentAmount - Current amount spent
   * @param {number} spentPercent - Current spending percentage
   */
  async checkAndSendAlerts(budgetId, spentAmount, spentPercent) {
    try {
      // Get budget with user info and categories
      const budget = await prisma.budget.findUnique({
        where: { id: budgetId },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              name: true
            }
          },
          categories: {
            include: {
              category: {
                select: {
                  name: true
                }
              }
            }
          },
          alerts: true // Get existing alerts
        }
      });

      if (!budget) {
        logger.warn('Budget not found for alert check', { budgetId });
        return;
      }

      // Check if user email is available
      if (!budget.user.email) {
        logger.warn('User email not available for budget alerts', {
          userId: budget.user.id,
          budgetId
        });
        return;
      }

      // Determine which thresholds to check
      const thresholdsToCheck = [];

      if (budget.alertAt80 && spentPercent >= 80 && spentPercent < 100) {
        thresholdsToCheck.push(80);
      }

      if (budget.alertAt100 && spentPercent >= 100) {
        thresholdsToCheck.push(100);
      }

      // Send alerts for thresholds that haven't been notified yet
      for (const threshold of thresholdsToCheck) {
        await this.sendAlertIfNeeded(budget, threshold, spentAmount, spentPercent);
      }
    } catch (error) {
      logger.logError(error, null, {
        context: 'budget-alert-check',
        budgetId,
        spentAmount,
        spentPercent
      });
    }
  }

  /**
   * Send alert for a specific threshold if not already sent
   * @param {Object} budget - Budget object with user and alerts
   * @param {number} threshold - Threshold percentage (80 or 100)
   * @param {number} spentAmount - Current amount spent
   * @param {number} spentPercent - Current spending percentage
   */
  async sendAlertIfNeeded(budget, threshold, spentAmount, spentPercent) {
    try {
      // Check if alert already sent for this threshold
      const existingAlert = budget.alerts?.find(alert => alert.threshold === threshold);

      if (existingAlert) {
        logger.debug('Alert already sent for threshold', {
          budgetId: budget.id,
          threshold,
          sentAt: existingAlert.sentAt
        });
        return;
      }

      // Prepare email data
      const categoryNames = budget.categories.map(bc => bc.category.name);
      const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'];

      const emailData = {
        name: budget.user.name || 'User',
        budgetName: budget.name,
        budgetAmount: budget.amount,
        spentAmount,
        spentPercent,
        currency: budget.currency,
        threshold,
        period: budget.period,
        month: budget.month,
        year: budget.year,
        categoryNames,
        dashboardUrl: process.env.FRONTEND_URL || 'https://app.expenser.site/dashboard'
      };

      // Generate email template
      const emailContent = budgetAlertTemplate(emailData);

      // Send email
      await emailService.sendEmail(
        budget.user.email,
        emailContent.subject,
        emailContent.html,
        emailContent.text
      );

      // Record alert in database
      await prisma.budgetAlert.create({
        data: {
          budgetId: budget.id,
          threshold,
          spentAmount,
          spentPercent
        }
      });

      logger.info('Budget alert sent successfully', {
        budgetId: budget.id,
        userId: budget.user.id,
        threshold,
        spentPercent: spentPercent.toFixed(2),
        email: budget.user.email
      });
    } catch (error) {
      logger.logError(error, null, {
        context: 'send-budget-alert',
        budgetId: budget.id,
        threshold
      });
    }
  }

  /**
   * Reset alerts for a budget (useful when budget is reset or new period starts)
   * @param {string} budgetId - Budget ID
   */
  async resetAlerts(budgetId) {
    try {
      await prisma.budgetAlert.deleteMany({
        where: { budgetId }
      });

      logger.info('Budget alerts reset', { budgetId });
    } catch (error) {
      logger.logError(error, null, {
        context: 'reset-budget-alerts',
        budgetId
      });
    }
  }

  /**
   * Check all active budgets and send alerts if needed
   * This can be called periodically (e.g., via cron job)
   */
  async checkAllBudgets() {
    try {
      const currentDate = new Date();
      const currentYear = currentDate.getFullYear();
      const currentMonth = currentDate.getMonth() + 1; // 1-12

      // Get all budgets for current period
      const budgets = await prisma.budget.findMany({
        where: {
          OR: [
            // Monthly budgets for current month
            {
              period: 'monthly',
              year: currentYear,
              month: currentMonth
            },
            // Yearly budgets for current year
            {
              period: 'yearly',
              year: currentYear
            }
          ]
        },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              name: true
            }
          },
          categories: {
            include: {
              category: {
                select: {
                  id: true,
                  name: true
                }
              }
            }
          },
          alerts: true
        }
      });

      logger.info(`Checking ${budgets.length} budgets for alerts`);

      for (const budget of budgets) {
        // Calculate spending for this budget
        const { spentAmount, spentPercent } = await this.calculateBudgetSpending(budget);

        // Check and send alerts
        await this.checkAndSendAlerts(budget.id, spentAmount, spentPercent);
      }

      logger.info('Budget alert check completed', { budgetsChecked: budgets.length });
    } catch (error) {
      logger.logError(error, null, { context: 'check-all-budgets' });
    }
  }

  /**
   * Calculate spending for a budget
   * @param {Object} budget - Budget object
   * @returns {Object} - { spentAmount, spentPercent }
   */
  async calculateBudgetSpending(budget) {
    try {
      const startDate = new Date(budget.year, budget.month ? budget.month - 1 : 0, 1);
      const endDate = budget.period === 'monthly'
        ? new Date(budget.year, budget.month, 0, 23, 59, 59, 999)
        : new Date(budget.year, 11, 31, 23, 59, 59, 999);

      const categoryIds = budget.categories.map(bc => bc.category.id);

      const where = {
        userId: budget.userId,
        date: {
          gte: startDate,
          lte: endDate
        }
      };

      // If budget has specific categories, filter by them
      if (categoryIds.length > 0) {
        where.categoryId = { in: categoryIds };
      }

      const result = await prisma.expense.aggregate({
        where,
        _sum: {
          amount: true
        }
      });

      const spentAmount = result._sum.amount || 0;
      const spentPercent = budget.amount > 0 ? (spentAmount / budget.amount) * 100 : 0;

      return { spentAmount, spentPercent };
    } catch (error) {
      logger.logError(error, null, {
        context: 'calculate-budget-spending',
        budgetId: budget.id
      });
      return { spentAmount: 0, spentPercent: 0 };
    }
  }
}

export default new BudgetAlertService();
