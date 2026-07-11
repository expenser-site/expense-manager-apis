/**
 * HATEOAS (Hypermedia as the Engine of Application State) Helper
 * Provides utilities for adding hypermedia links to API responses
 */

import { validate as validateUUID } from 'uuid';
import logger from '../config/logger.js';

const BASE_URL = process.env.API_BASE_URL || 'https://api.expenser.site/api';

// Static link cache for performance
const STATIC_LINK_CACHE = new Map();

/**
 * Get or create a cached static link
 * @param {string} cacheKey - Unique cache identifier
 * @param {Function} generator - Function that creates the link
 */
const getCachedStaticLink = (cacheKey, generator) => {
  if (STATIC_LINK_CACHE.has(cacheKey)) {
    return STATIC_LINK_CACHE.get(cacheKey);
  }

  const link = generator();
  STATIC_LINK_CACHE.set(cacheKey, link);
  return link;
};

/**
 * Generate a link object
 * @param {string} rel - The relation type (self, collection, update, delete, etc.)
 * @param {string} href - The URL
 * @param {string} method - HTTP method (GET, POST, PUT, DELETE)
 * @param {string} description - Optional description of what this link does
 */
const createLink = (rel, href, method = 'GET', description = '') => {
  // Validate required parameters
  if (!rel || typeof rel !== 'string') {
    throw new Error('Link relation (rel) is required and must be a string');
  }

  if (!href || typeof href !== 'string') {
    throw new Error('Link href is required and must be a string');
  }

  // Ensure BASE_URL is configured
  if (!BASE_URL) {
    throw new Error('API_BASE_URL environment variable is not configured');
  }

  const link = {
    rel,
    href: `${BASE_URL}${href}`,
    method: method.toUpperCase()
  };

  if (description) {
    link.description = description;
  }

  return link;
};

/**
 * Generate links for expense resources
 */
const expenseLinks = {
  self: expenseId => {
    if (!validateUUID(expenseId)) {
      logger.warn(`Invalid expense ID for HATEOAS link: ${expenseId}`);
      return null;
    }
    return createLink('self', `/v1/expenses/${expenseId}`, 'GET', 'Get this expense');
  },

  update: expenseId => {
    if (!validateUUID(expenseId)) {
      logger.warn(`Invalid expense ID for update link: ${expenseId}`);
      return null;
    }
    return createLink('update', `/v1/expenses/${expenseId}`, 'PUT', 'Update this expense');
  },

  delete: expenseId => {
    if (!validateUUID(expenseId)) {
      logger.warn(`Invalid expense ID for delete link: ${expenseId}`);
      return null;
    }
    return createLink('delete', `/v1/expenses/${expenseId}`, 'DELETE', 'Delete this expense');
  },

  collection: () =>
    getCachedStaticLink('expense:collection', () =>
      createLink('collection', '/v1/expenses', 'GET', 'Get all expenses')
    ),

  create: () =>
    getCachedStaticLink('expense:create', () =>
      createLink('create', '/v1/expenses', 'POST', 'Create a new expense')
    ),

  category: categoryId => {
    if (!validateUUID(categoryId)) {
      logger.warn(`Invalid category ID for HATEOAS link: ${categoryId}`);
      return null;
    }
    return createLink(
      'category',
      `/v1/categories/${categoryId}`,
      'GET',
      'Get the category for this expense'
    );
  },

  bulkDelete: () =>
    getCachedStaticLink('expense:bulk-delete', () =>
      createLink('bulk-delete', '/v1/expenses/bulk-delete', 'POST', 'Delete multiple expenses')
    )
};

/**
 * Generate links for category resources
 */
const categoryLinks = {
  self: categoryId => {
    if (!validateUUID(categoryId)) {
      logger.warn(`Invalid category ID for HATEOAS link: ${categoryId}`);
      return null;
    }
    return createLink('self', `/v1/categories/${categoryId}`, 'GET', 'Get this category');
  },

  update: categoryId => {
    if (!validateUUID(categoryId)) {
      logger.warn(`Invalid category ID for update link: ${categoryId}`);
      return null;
    }
    return createLink('update', `/v1/categories/${categoryId}`, 'PUT', 'Update this category');
  },

  delete: categoryId => {
    if (!validateUUID(categoryId)) {
      logger.warn(`Invalid category ID for delete link: ${categoryId}`);
      return null;
    }
    return createLink('delete', `/v1/categories/${categoryId}`, 'DELETE', 'Delete this category');
  },

  collection: () =>
    getCachedStaticLink('category:collection', () =>
      createLink('collection', '/v1/categories', 'GET', 'Get all categories')
    ),

  create: () =>
    getCachedStaticLink('category:create', () =>
      createLink('create', '/v1/categories', 'POST', 'Create a new category')
    ),

  expenses: categoryId => {
    if (!validateUUID(categoryId)) {
      logger.warn(`Invalid category ID for expenses link: ${categoryId}`);
      return null;
    }
    return createLink(
      'expenses',
      `/v1/expenses?categoryId=${categoryId}`,
      'GET',
      'Get all expenses in this category'
    );
  }
};

/**
 * Generate links for budget resources
 */
const budgetLinks = {
  self: budgetId => {
    if (!budgetId) return null;
    return createLink('self', `/v1/budgets/${budgetId}`, 'GET', 'Get this budget');
  },

  update: budgetId => {
    if (!budgetId) return null;
    return createLink('update', `/v1/budgets/${budgetId}`, 'PUT', 'Update this budget');
  },

  delete: budgetId => {
    if (!budgetId) return null;
    return createLink('delete', `/v1/budgets/${budgetId}`, 'DELETE', 'Delete this budget');
  },

  collection: () =>
    getCachedStaticLink('budget:collection', () =>
      createLink('collection', '/v1/budgets', 'GET', 'Get all budgets')
    ),

  create: () =>
    getCachedStaticLink('budget:create', () =>
      createLink('create', '/v1/budgets', 'POST', 'Create a new budget')
    ),

  status: () =>
    getCachedStaticLink('budget:status', () =>
      createLink('status', '/v1/budgets/status', 'GET', 'Get budget status and spending comparison')
    )
};

/**
 * Generate links for dashboard resources
 */
const dashboardLinks = {
  summary: () =>
    getCachedStaticLink('dashboard:summary', () =>
      createLink('summary', '/v1/dashboard/summary', 'GET', 'Get dashboard summary')
    ),

  categoryAnalytics: () =>
    getCachedStaticLink('dashboard:category-analytics', () =>
      createLink(
        'category-analytics',
        '/v1/dashboard/category-analytics',
        'GET',
        'Get category analytics'
      )
    ),

  monthlyTrends: () =>
    getCachedStaticLink('dashboard:monthly-trends', () =>
      createLink('monthly-trends', '/v1/dashboard/monthly-trends', 'GET', 'Get monthly trends')
    ),

  recentExpenses: () =>
    getCachedStaticLink('dashboard:recent-expenses', () =>
      createLink('recent-expenses', '/v1/dashboard/recent-expenses', 'GET', 'Get recent expenses')
    ),

  expenses: () =>
    getCachedStaticLink('dashboard:expenses', () =>
      createLink('expenses', '/v1/expenses', 'GET', 'View all expenses')
    ),

  categories: () =>
    getCachedStaticLink('dashboard:categories', () =>
      createLink('categories', '/v1/categories', 'GET', 'View all categories')
    )
};

/**
 * Generate links for user/auth resources
 */
const userLinks = {
  self: () =>
    getCachedStaticLink('user:self', () =>
      createLink('self', '/v1/auth/profile', 'GET', 'Get current user profile')
    ),

  update: () =>
    getCachedStaticLink('user:update', () =>
      createLink('update', '/v1/auth/profile', 'PUT', 'Update user profile')
    ),

  changePassword: () =>
    getCachedStaticLink('user:change-password', () =>
      createLink('change-password', '/v1/auth/change-password', 'POST', 'Change password')
    ),

  deleteAccount: () =>
    getCachedStaticLink('user:delete-account', () =>
      createLink('delete-account', '/v1/auth/delete-account', 'DELETE', 'Delete account')
    ),

  logout: () =>
    getCachedStaticLink('user:logout', () =>
      createLink('logout', '/v1/auth/logout', 'POST', 'Logout')
    ),

  dashboard: () =>
    getCachedStaticLink('user:dashboard', () =>
      createLink('dashboard', '/v1/dashboard/summary', 'GET', 'View dashboard')
    )
};

/**
 * Add links to a single expense object
 */
const addExpenseLinks = expense => {
  if (!expense || !expense.id) {
    logger.warn('Cannot add links to invalid expense object');
    return expense;
  }

  const links = [
    expenseLinks.self(expense.id),
    expenseLinks.update(expense.id),
    expenseLinks.delete(expense.id),
    expenseLinks.collection()
  ].filter(Boolean); // Remove null links from invalid IDs

  if (expense.categoryId) {
    const categoryLink = expenseLinks.category(expense.categoryId);
    if (categoryLink) {
      links.push(categoryLink);
    }
  }

  return {
    ...expense,
    _links: links
  };
};

/**
 * Add links to a single category object
 */
const addCategoryLinks = category => {
  if (!category || !category.id) {
    logger.warn('Cannot add links to invalid category object');
    return category;
  }

  return {
    ...category,
    _links: [
      categoryLinks.self(category.id),
      categoryLinks.update(category.id),
      categoryLinks.delete(category.id),
      categoryLinks.collection(),
      categoryLinks.expenses(category.id)
    ].filter(Boolean) // Remove null links from invalid IDs
  };
};

/**
 * Add links to a single budget object
 */
const addBudgetLinks = budget => {
  if (!budget || !budget.id) {
    logger.warn('Cannot add links to invalid budget object');
    return budget;
  }

  return {
    ...budget,
    _links: [
      budgetLinks.self(budget.id),
      budgetLinks.update(budget.id),
      budgetLinks.delete(budget.id),
      budgetLinks.collection(),
      budgetLinks.status()
    ].filter(Boolean) // Remove null links from invalid IDs
  };
};

/**
 * Add links to a collection response
 */
const addCollectionLinks = (baseUrl, pagination) => {
  const links = [createLink('self', baseUrl, 'GET', 'Current page')];

  // Add pagination links
  if (pagination) {
    const { page, limit, pages } = pagination;

    // First page
    if (page > 1) {
      links.push(createLink('first', `${baseUrl}?page=1&limit=${limit}`, 'GET', 'First page'));
    }

    // Previous page
    if (page > 1) {
      links.push(
        createLink('prev', `${baseUrl}?page=${page - 1}&limit=${limit}`, 'GET', 'Previous page')
      );
    }

    // Next page
    if (page < pages) {
      links.push(
        createLink('next', `${baseUrl}?page=${page + 1}&limit=${limit}`, 'GET', 'Next page')
      );
    }

    // Last page
    if (page < pages) {
      links.push(createLink('last', `${baseUrl}?page=${pages}&limit=${limit}`, 'GET', 'Last page'));
    }
  }

  return links;
};

/**
 * Add links to user profile
 */
const addUserLinks = user => {
  if (!user) {
    logger.warn('Cannot add links to invalid user object');
    return user;
  }

  return {
    ...user,
    _links: [
      userLinks.self(),
      userLinks.update(),
      userLinks.changePassword(),
      userLinks.deleteAccount(),
      userLinks.dashboard()
    ].filter(Boolean)
  };
};

export {
  createLink,
  expenseLinks,
  categoryLinks,
  budgetLinks,
  dashboardLinks,
  userLinks,
  addExpenseLinks,
  addCategoryLinks,
  addBudgetLinks,
  addCollectionLinks,
  addUserLinks,
  STATIC_LINK_CACHE // For monitoring/health checks
};
