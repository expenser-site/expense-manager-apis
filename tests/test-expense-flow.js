/**
 * Comprehensive Expense Flow Test Script
 * Tests all expense endpoints to verify everything works correctly
 */
import http from 'http';

const API_BASE = 'http://localhost:3000/api/v1';
let authToken = null;
let categoryId = null;
let expenseId = null;
const testEmail = `expense-test-${Date.now()}@example.com`;
const testPassword = 'TestPassword123';

// Color codes for console output
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[36m',
  reset: '\x1b[0m'
};

function log(message, type = 'info') {
  const timestamp = new Date().toISOString();
  const color = type === 'success' ? colors.green : type === 'error' ? colors.red : type === 'warning' ? colors.yellow : colors.blue;
  console.log(`${color}[${timestamp}] ${message}${colors.reset}`);
}

async function makeRequest(endpoint, options = {}) {
  const url = new URL(`${API_BASE}${endpoint}`);
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers
  };

  if (authToken && !options.noAuth) {
    headers['Authorization'] = `Bearer ${authToken}`;
  }

  if (options.body) {
    headers['Content-Length'] = Buffer.byteLength(options.body);
  }

  return new Promise((resolve) => {
    const reqOptions = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      method: options.method || 'GET',
      headers
    };

    const req = http.request(reqOptions, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        try {
          const jsonData = JSON.parse(data);
          resolve({
            ok: res.statusCode >= 200 && res.statusCode < 300,
            status: res.statusCode,
            data: jsonData
          });
        } catch (error) {
          resolve({
            ok: false,
            status: res.statusCode,
            error: 'Failed to parse response',
            rawResponse: data
          });
        }
      });
    });

    req.on('error', (error) => {
      resolve({
        ok: false,
        status: 500,
        error: error.message
      });
    });

    if (options.body) {
      req.write(options.body);
    }

    req.end();
  });
}

async function setup() {
  log('\n========== SETUP: Register Test User & Create Category ==========', 'info');

  // Register user
  const registerResult = await makeRequest('/auth/register', {
    method: 'POST',
    noAuth: true,
    body: JSON.stringify({
      email: testEmail,
      password: testPassword,
      name: 'Expense Test User'
    })
  });

  if (registerResult.ok && registerResult.data && registerResult.data.token) {
    authToken = registerResult.data.token;
    log('✓ Test user registered successfully', 'success');
  } else {
    log('✗ Failed to register test user', 'error');
    return false;
  }

  // Create test category
  const categoryResult = await makeRequest('/categories', {
    method: 'POST',
    body: JSON.stringify({
      name: 'Test Expenses',
      color: '#FF5733',
      icon: '📊'
    })
  });

  if (categoryResult.ok && categoryResult.data && categoryResult.data.category) {
    categoryId = categoryResult.data.category.id;
    log('✓ Test category created successfully', 'success');
    return true;
  } else {
    log('✗ Failed to create test category', 'error');
    return false;
  }
}

async function test1_CreateExpense() {
  log('\n========== TEST 1: Create Expense ==========', 'info');

  const result = await makeRequest('/expenses', {
    method: 'POST',
    body: JSON.stringify({
      title: 'Grocery Shopping',
      amount: 125.50,
      categoryId,
      description: 'Weekly grocery shopping at supermarket',
      currency: 'USD',
      date: new Date().toISOString()
    })
  });

  if (result.ok && result.data && result.data.expense) {
    expenseId = result.data.expense.id;
    log('✓ Expense created successfully', 'success');
    log(`  ID: ${expenseId}`, 'info');
    log(`  Title: ${result.data.expense.title}`, 'info');
    log(`  Amount: ${result.data.expense.amount} ${result.data.expense.currency}`, 'info');
    log(`  Category: ${result.data.expense.category.name}`, 'info');
    return true;
  } else {
    const errorMsg = result.data ? (result.data.error || JSON.stringify(result.data)) : result.error || 'Unknown error';
    log(`✗ Expense creation failed: ${errorMsg}`, 'error');
    return false;
  }
}

async function test2_CreateExpenseWithoutCategory() {
  log('\n========== TEST 2: Create Expense Without Category ==========', 'info');

  const result = await makeRequest('/expenses', {
    method: 'POST',
    body: JSON.stringify({
      title: 'Uncategorized Expense',
      amount: 50.00,
      description: 'This should go to "No Category"'
    })
  });

  if (result.ok && result.data && result.data.expense) {
    log('✓ Expense created successfully', 'success');
    log(`  Category: ${result.data.expense.category.name}`, 'info');
    return true;
  } else {
    const errorMsg = result.data ? (result.data.error || JSON.stringify(result.data)) : result.error || 'Unknown error';
    log(`✗ Expense creation failed: ${errorMsg}`, 'error');
    return false;
  }
}

async function test3_CreateExpenseInvalidAmount() {
  log('\n========== TEST 3: Create Expense with Invalid Amount (Should Fail) ==========', 'info');

  const result = await makeRequest('/expenses', {
    method: 'POST',
    body: JSON.stringify({
      title: 'Invalid Expense',
      amount: -50.00,
      categoryId
    })
  });

  if (!result.ok && result.status === 400) {
    log('✓ Correctly rejected negative amount', 'success');
    return true;
  } else {
    log('✗ Should have rejected negative amount', 'error');
    return false;
  }
}

async function test4_CreateExpenseWithoutTitle() {
  log('\n========== TEST 4: Create Expense Without Title (Should Fail) ==========', 'info');

  const result = await makeRequest('/expenses', {
    method: 'POST',
    body: JSON.stringify({
      amount: 100.00,
      categoryId
    })
  });

  if (!result.ok && result.status === 400) {
    log('✓ Correctly rejected expense without title', 'success');
    return true;
  } else {
    log('✗ Should have rejected expense without title', 'error');
    return false;
  }
}

async function test5_GetAllExpenses() {
  log('\n========== TEST 5: Get All Expenses ==========', 'info');

  const result = await makeRequest('/expenses', {
    method: 'GET'
  });

  if (result.ok && result.data && result.data.expenses) {
    log('✓ Expenses retrieved successfully', 'success');
    log(`  Total expenses: ${result.data.expenses.length}`, 'info');
    log(`  Total count: ${result.data.pagination.total}`, 'info');
    return true;
  } else {
    const errorMsg = result.data ? (result.data.error || JSON.stringify(result.data)) : result.error || 'Unknown error';
    log(`✗ Failed to get expenses: ${errorMsg}`, 'error');
    return false;
  }
}

async function test6_GetExpenseById() {
  log('\n========== TEST 6: Get Expense By ID ==========', 'info');

  if (!expenseId) {
    log('✗ No expense ID available', 'error');
    return false;
  }

  const result = await makeRequest(`/expenses/${expenseId}`, {
    method: 'GET'
  });

  if (result.ok && result.data && result.data.expense) {
    log('✓ Expense retrieved successfully', 'success');
    log(`  Title: ${result.data.expense.title}`, 'info');
    log(`  Amount: ${result.data.expense.amount}`, 'info');
    log(`  Category: ${result.data.expense.category.name}`, 'info');
    return true;
  } else {
    const errorMsg = result.data ? (result.data.error || JSON.stringify(result.data)) : result.error || 'Unknown error';
    log(`✗ Failed to get expense: ${errorMsg}`, 'error');
    return false;
  }
}

async function test7_UpdateExpense() {
  log('\n========== TEST 7: Update Expense ==========', 'info');

  if (!expenseId) {
    log('✗ No expense ID available', 'error');
    return false;
  }

  const result = await makeRequest(`/expenses/${expenseId}`, {
    method: 'PUT',
    body: JSON.stringify({
      title: 'Updated Grocery Shopping',
      amount: 150.75,
      description: 'Updated weekly grocery shopping'
    })
  });

  if (result.ok && result.data && result.data.expense) {
    log('✓ Expense updated successfully', 'success');
    log(`  New title: ${result.data.expense.title}`, 'info');
    log(`  New amount: ${result.data.expense.amount}`, 'info');
    return true;
  } else {
    const errorMsg = result.data ? (result.data.error || JSON.stringify(result.data)) : result.error || 'Unknown error';
    log(`✗ Failed to update expense: ${errorMsg}`, 'error');
    return false;
  }
}

async function test8_GetExpensesByCategory() {
  log('\n========== TEST 8: Get Expenses By Category ==========', 'info');

  if (!categoryId) {
    log('✗ No category ID available', 'error');
    return false;
  }

  const result = await makeRequest(`/expenses?categoryId=${categoryId}`, {
    method: 'GET'
  });

  if (result.ok && result.data && result.data.expenses) {
    log('✓ Filtered expenses retrieved successfully', 'success');
    log(`  Results: ${result.data.expenses.length}`, 'info');
    return true;
  } else {
    const errorMsg = result.data ? (result.data.error || JSON.stringify(result.data)) : result.error || 'Unknown error';
    log(`✗ Failed to filter expenses: ${errorMsg}`, 'error');
    return false;
  }
}

async function test9_SearchExpenses() {
  log('\n========== TEST 9: Search Expenses ==========', 'info');

  const result = await makeRequest('/expenses?search=Grocery', {
    method: 'GET'
  });

  if (result.ok && result.data && result.data.expenses) {
    log('✓ Search completed successfully', 'success');
    log(`  Results found: ${result.data.expenses.length}`, 'info');
    return true;
  } else {
    const errorMsg = result.data ? (result.data.error || JSON.stringify(result.data)) : result.error || 'Unknown error';
    log(`✗ Search failed: ${errorMsg}`, 'error');
    return false;
  }
}

async function test10_GetExpensesWithPagination() {
  log('\n========== TEST 10: Get Expenses with Pagination ==========', 'info');

  const result = await makeRequest('/expenses?page=1&limit=5', {
    method: 'GET'
  });

  if (result.ok && result.data && result.data.pagination) {
    log('✓ Pagination working correctly', 'success');
    log(`  Page: ${result.data.pagination.page}`, 'info');
    log(`  Limit: ${result.data.pagination.limit}`, 'info');
    log(`  Total: ${result.data.pagination.total}`, 'info');
    return true;
  } else {
    const errorMsg = result.data ? (result.data.error || JSON.stringify(result.data)) : result.error || 'Unknown error';
    log(`✗ Pagination failed: ${errorMsg}`, 'error');
    return false;
  }
}

async function test11_GetExpensesByDateRange() {
  log('\n========== TEST 11: Get Expenses By Date Range ==========', 'info');

  const today = new Date();
  const startDate = new Date(today.getFullYear(), today.getMonth(), 1).toISOString();
  const endDate = new Date(today.getFullYear(), today.getMonth() + 1, 0).toISOString();

  const result = await makeRequest(`/expenses?startDate=${startDate}&endDate=${endDate}`, {
    method: 'GET'
  });

  if (result.ok && result.data && result.data.expenses) {
    log('✓ Date range filter working correctly', 'success');
    log(`  Results: ${result.data.expenses.length}`, 'info');
    return true;
  } else {
    const errorMsg = result.data ? (result.data.error || JSON.stringify(result.data)) : result.error || 'Unknown error';
    log(`✗ Date range filter failed: ${errorMsg}`, 'error');
    return false;
  }
}

async function test12_GetNonExistentExpense() {
  log('\n========== TEST 12: Get Non-Existent Expense (Should Fail) ==========', 'info');

  const fakeId = '00000000-0000-0000-0000-000000000000';
  const result = await makeRequest(`/expenses/${fakeId}`, {
    method: 'GET'
  });

  if (!result.ok && result.status === 404) {
    log('✓ Correctly returned 404 for non-existent expense', 'success');
    return true;
  } else {
    log('✗ Should have returned 404', 'error');
    return false;
  }
}

async function test13_DeleteExpense() {
  log('\n========== TEST 13: Delete Expense ==========', 'info');

  if (!expenseId) {
    log('✗ No expense ID available', 'error');
    return false;
  }

  const result = await makeRequest(`/expenses/${expenseId}`, {
    method: 'DELETE'
  });

  if (result.ok) {
    log('✓ Expense deleted successfully', 'success');

    // Verify it's deleted
    const verifyResult = await makeRequest(`/expenses/${expenseId}`, {
      method: 'GET'
    });

    if (!verifyResult.ok && verifyResult.status === 404) {
      log('✓ Verified: Expense no longer exists', 'success');
      return true;
    } else {
      log('✗ Expense still exists after deletion', 'error');
      return false;
    }
  } else {
    const errorMsg = result.data ? (result.data.error || JSON.stringify(result.data)) : result.error || 'Unknown error';
    log(`✗ Failed to delete expense: ${errorMsg}`, 'error');
    return false;
  }
}

async function cleanup() {
  log('\n========== CLEANUP: Delete Test User ==========', 'info');

  const result = await makeRequest('/auth/account', {
    method: 'DELETE',
    body: JSON.stringify({
      password: testPassword
    })
  });

  if (result.ok) {
    log('✓ Test user deleted successfully (cascades categories & expenses)', 'success');
    return true;
  } else {
    log('⚠ Failed to delete test user (may need manual cleanup)', 'warning');
    return false;
  }
}

async function runAllTests() {
  log(`\n${'='.repeat(60)}`, 'info');
  log('EXPENSE MANAGER - EXPENSE TESTS', 'info');
  log('='.repeat(60), 'info');

  // Setup
  const setupSuccess = await setup();
  if (!setupSuccess) {
    log('\n✗ Setup failed. Aborting tests.', 'error');
    process.exit(1);
  }

  const tests = [
    { name: 'Create Expense', fn: test1_CreateExpense },
    { name: 'Create Expense Without Category', fn: test2_CreateExpenseWithoutCategory },
    { name: 'Create Expense with Invalid Amount', fn: test3_CreateExpenseInvalidAmount },
    { name: 'Create Expense Without Title', fn: test4_CreateExpenseWithoutTitle },
    { name: 'Get All Expenses', fn: test5_GetAllExpenses },
    { name: 'Get Expense By ID', fn: test6_GetExpenseById },
    { name: 'Update Expense', fn: test7_UpdateExpense },
    { name: 'Get Expenses By Category', fn: test8_GetExpensesByCategory },
    { name: 'Search Expenses', fn: test9_SearchExpenses },
    { name: 'Get Expenses with Pagination', fn: test10_GetExpensesWithPagination },
    { name: 'Get Expenses By Date Range', fn: test11_GetExpensesByDateRange },
    { name: 'Get Non-Existent Expense', fn: test12_GetNonExistentExpense },
    { name: 'Delete Expense', fn: test13_DeleteExpense }
  ];

  const results = [];

  for (const test of tests) {
    try {
      const passed = await test.fn();
      results.push({ name: test.name, passed });
    } catch (error) {
      log(`✗ Test "${test.name}" crashed: ${error.message}`, 'error');
      results.push({ name: test.name, passed: false });
    }
  }

  // Cleanup
  await cleanup();

  // Summary
  log(`\n${'='.repeat(60)}`, 'info');
  log('TEST SUMMARY', 'info');
  log('='.repeat(60), 'info');

  const passed = results.filter(r => r.passed).length;
  const total = results.length;

  results.forEach(result => {
    const symbol = result.passed ? '✓' : '✗';
    const type = result.passed ? 'success' : 'error';
    log(`${symbol} ${result.name}`, type);
  });

  log(`\n${'='.repeat(60)}`, 'info');
  log(`TOTAL: ${passed}/${total} tests passed`, passed === total ? 'success' : 'error');
  log(`${'='.repeat(60)}\n`, 'info');

  process.exit(passed === total ? 0 : 1);
}

// Run tests
runAllTests().catch(error => {
  log(`Fatal error: ${error.message}`, 'error');
  process.exit(1);
});
