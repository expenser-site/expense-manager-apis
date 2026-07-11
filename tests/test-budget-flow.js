/**
 * Budget API Test Script
 * 
 * This script tests the budget API endpoints to ensure they're working correctly.
 * Run this after starting the server: npm run dev
 * 
 * Usage: node tests/test-budget-flow.js
 */

const BASE_URL = process.env.API_URL || 'http://localhost:3000/api/v1';

// ANSI color codes for console output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

let authToken = '';
let userId = '';
let categoryId = '';
let budgetId = '';

// Test data
const testUser = {
  email: `budget-test-${Date.now()}@example.com`,
  password: 'TestPassword123!',
  name: 'Budget Test User'
};

// Helper function to make HTTP requests
async function makeRequest(endpoint, options = {}) {
  const url = `${BASE_URL}${endpoint}`;
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers
  };

  if (authToken && !options.skipAuth) {
    headers.Authorization = `Bearer ${authToken}`;
  }

  try {
    const response = await fetch(url, {
      ...options,
      headers
    });

    const data = await response.json();
    return { status: response.status, data };
  } catch (error) {
    console.error(`${colors.red}✗ Request failed: ${error.message}${colors.reset}`);
    throw error;
  }
}

// Test functions
async function registerUser() {
  console.log(`\n${colors.cyan}=== User Registration ===${colors.reset}`);
  const { status, data } = await makeRequest('/auth/register', {
    method: 'POST',
    skipAuth: true,
    body: JSON.stringify(testUser)
  });

  if (status === 201 || status === 200) {
    authToken = data.token;
    userId = data.user?.id;
    console.log(`${colors.green}✓ User registered successfully${colors.reset}`);
    console.log(`  User ID: ${userId}`);
    return true;
  } else {
    console.log(`${colors.red}✗ Registration failed: ${data.error}${colors.reset}`);
    return false;
  }
}

async function createCategory() {
  console.log(`\n${colors.cyan}=== Create Category ===${colors.reset}`);
  const { status, data } = await makeRequest('/categories', {
    method: 'POST',
    body: JSON.stringify({
      name: 'Budget Test Category',
      color: '#FF5733',
      icon: '💰'
    })
  });

  if (status === 201) {
    categoryId = data.category.id;
    console.log(`${colors.green}✓ Category created successfully${colors.reset}`);
    console.log(`  Category ID: ${categoryId}`);
    return true;
  } else {
    console.log(`${colors.red}✗ Category creation failed: ${data.error}${colors.reset}`);
    return false;
  }
}

async function createMonthlyBudget() {
  console.log(`\n${colors.cyan}=== Create Monthly Budget ===${colors.reset}`);

  const currentDate = new Date();
  const month = currentDate.getMonth() + 1;
  const year = currentDate.getFullYear();

  const { status, data } = await makeRequest('/budgets', {
    method: 'POST',
    body: JSON.stringify({
      amount: 1000,
      period: 'monthly',
      month,
      year,
      notes: 'Test monthly budget'
    })
  });

  if (status === 201) {
    budgetId = data.budget.id;
    console.log(`${colors.green}✓ Monthly budget created successfully${colors.reset}`);
    console.log(`  Budget ID: ${budgetId}`);
    console.log(`  Amount: ${data.budget.amount} ${data.budget.currency}`);
    console.log(`  Period: ${data.budget.period} (${data.budget.month}/${data.budget.year})`);
    return true;
  } else {
    console.log(`${colors.red}✗ Budget creation failed: ${data.error}${colors.reset}`);
    return false;
  }
}

async function createCategoryBudget() {
  console.log(`\n${colors.cyan}=== Create Category Budget ===${colors.reset}`);

  const currentDate = new Date();
  const month = currentDate.getMonth() + 1;
  const year = currentDate.getFullYear();

  const { status, data } = await makeRequest('/budgets', {
    method: 'POST',
    body: JSON.stringify({
      amount: 300,
      period: 'monthly',
      month,
      year,
      categoryId,
      notes: 'Test category budget'
    })
  });

  if (status === 201) {
    console.log(`${colors.green}✓ Category budget created successfully${colors.reset}`);
    console.log(`  Budget ID: ${data.budget.id}`);
    console.log(`  Amount: ${data.budget.amount} ${data.budget.currency}`);
    console.log(`  Category: ${data.budget.category?.name}`);
    return true;
  } else {
    console.log(`${colors.red}✗ Category budget creation failed: ${data.error}${colors.reset}`);
    return false;
  }
}

async function getAllBudgets() {
  console.log(`\n${colors.cyan}=== Get All Budgets ===${colors.reset}`);
  const { status, data } = await makeRequest('/budgets');

  if (status === 200) {
    console.log(`${colors.green}✓ Retrieved ${data.budgets.length} budgets${colors.reset}`);
    console.log(`  Total budgets: ${data.pagination.total}`);
    return true;
  } else {
    console.log(`${colors.red}✗ Failed to get budgets: ${data.error}${colors.reset}`);
    return false;
  }
}

async function getBudgetById() {
  console.log(`\n${colors.cyan}=== Get Budget by ID ===${colors.reset}`);
  const { status, data } = await makeRequest(`/budgets/${budgetId}`);

  if (status === 200) {
    console.log(`${colors.green}✓ Budget retrieved successfully${colors.reset}`);
    console.log(`  Budget ID: ${data.budget.id}`);
    console.log(`  Amount: ${data.budget.amount} ${data.budget.currency}`);
    return true;
  } else {
    console.log(`${colors.red}✗ Failed to get budget: ${data.error}${colors.reset}`);
    return false;
  }
}

async function updateBudget() {
  console.log(`\n${colors.cyan}=== Update Budget ===${colors.reset}`);
  const { status, data } = await makeRequest(`/budgets/${budgetId}`, {
    method: 'PUT',
    body: JSON.stringify({
      amount: 1200,
      notes: 'Updated test budget'
    })
  });

  if (status === 200) {
    console.log(`${colors.green}✓ Budget updated successfully${colors.reset}`);
    console.log(`  New amount: ${data.budget.amount} ${data.budget.currency}`);
    console.log(`  Notes: ${data.budget.notes}`);
    return true;
  } else {
    console.log(`${colors.red}✗ Failed to update budget: ${data.error}${colors.reset}`);
    return false;
  }
}

async function getBudgetStatus() {
  console.log(`\n${colors.cyan}=== Get Budget Status ===${colors.reset}`);

  const currentDate = new Date();
  const month = currentDate.getMonth() + 1;
  const year = currentDate.getFullYear();

  const { status, data } = await makeRequest(`/budgets/status?year=${year}&month=${month}`);

  if (status === 200) {
    console.log(`${colors.green}✓ Budget status retrieved successfully${colors.reset}`);
    console.log(`  Year: ${data.year}, Month: ${data.month}`);

    if (data.overallSummary) {
      console.log(`  Overall Budget: ${data.overallSummary.totalBudget}`);
      console.log(`  Total Spent: ${data.overallSummary.totalSpent}`);
      console.log(`  Remaining: ${data.overallSummary.totalRemaining}`);
    }

    console.log(`  Budget items: ${data.budgetStatus.length}`);
    return true;
  } else {
    console.log(`${colors.red}✗ Failed to get budget status: ${data.error}${colors.reset}`);
    return false;
  }
}

async function getDashboardWithBudget() {
  console.log(`\n${colors.cyan}=== Get Dashboard Summary ===${colors.reset}`);
  const { status, data } = await makeRequest('/dashboard/summary');

  if (status === 200) {
    console.log(`${colors.green}✓ Dashboard retrieved successfully${colors.reset}`);
    console.log(`  Total expenses: ${data.summary.totalAmount}`);
    console.log(`  Expense count: ${data.summary.totalCount}`);

    if (data.budgetComparison) {
      console.log(`  Has budget: ${data.budgetComparison.hasBudget}`);

      if (data.budgetComparison.overall) {
        const budget = data.budgetComparison.overall;
        console.log(`  Budget amount: ${budget.budgetAmount} ${budget.currency}`);
        console.log(`  Spent: ${budget.spent}`);
        console.log(`  Remaining: ${budget.remaining}`);
        console.log(`  Usage: ${budget.percentageUsed}%`);
        console.log(`  Alert status: ${budget.alertStatus}`);
      }
    }
    return true;
  } else {
    console.log(`${colors.red}✗ Failed to get dashboard: ${data.error}${colors.reset}`);
    return false;
  }
}

async function deleteBudget() {
  console.log(`\n${colors.cyan}=== Delete Budget ===${colors.reset}`);
  const { status, data } = await makeRequest(`/budgets/${budgetId}`, {
    method: 'DELETE'
  });

  if (status === 200) {
    console.log(`${colors.green}✓ Budget deleted successfully${colors.reset}`);
    return true;
  } else {
    console.log(`${colors.red}✗ Failed to delete budget: ${data.error}${colors.reset}`);
    return false;
  }
}

// Main test runner
async function runTests() {
  console.log(`${colors.blue}╔════════════════════════════════════════════╗${colors.reset}`);
  console.log(`${colors.blue}║      Budget API Integration Tests         ║${colors.reset}`);
  console.log(`${colors.blue}╚════════════════════════════════════════════╝${colors.reset}`);
  console.log(`\nTesting against: ${BASE_URL}`);

  const tests = [
    registerUser,
    createCategory,
    createMonthlyBudget,
    createCategoryBudget,
    getAllBudgets,
    getBudgetById,
    updateBudget,
    getBudgetStatus,
    getDashboardWithBudget,
    deleteBudget
  ];

  let passed = 0;
  let failed = 0;

  for (const test of tests) {
    try {
      const result = await test();
      if (result) {
        passed++;
      } else {
        failed++;
      }
    } catch (error) {
      console.log(`${colors.red}✗ Test error: ${error.message}${colors.reset}`);
      failed++;
    }
  }

  // Summary
  console.log(`\n${colors.blue}╔════════════════════════════════════════════╗${colors.reset}`);
  console.log(`${colors.blue}║              Test Summary                  ║${colors.reset}`);
  console.log(`${colors.blue}╚════════════════════════════════════════════╝${colors.reset}`);
  console.log(`${colors.green}✓ Passed: ${passed}${colors.reset}`);
  console.log(`${colors.red}✗ Failed: ${failed}${colors.reset}`);
  console.log(`Total: ${passed + failed}\n`);

  if (failed === 0) {
    console.log(`${colors.green}🎉 All tests passed!${colors.reset}\n`);
  } else {
    console.log(`${colors.yellow}⚠ Some tests failed. Please check the output above.${colors.reset}\n`);
  }
}

// Run tests
runTests().catch(error => {
  console.error(`${colors.red}Fatal error: ${error.message}${colors.reset}`);
  process.exit(1);
});
