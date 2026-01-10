/**
 * Comprehensive Category Flow Test Script
 * Tests all category endpoints to verify everything works correctly
 */
import http from 'http';

const API_BASE = 'http://localhost:3000/api/v1';
let authToken = null;
let categoryId = null;
const testEmail = `category-test-${Date.now()}@example.com`;
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
  log('\n========== SETUP: Register Test User ==========', 'info');

  const result = await makeRequest('/auth/register', {
    method: 'POST',
    noAuth: true,
    body: JSON.stringify({
      email: testEmail,
      password: testPassword,
      name: 'Category Test User'
    })
  });

  if (result.ok && result.data && result.data.token) {
    authToken = result.data.token;
    log('✓ Test user registered successfully', 'success');
    return true;
  } else {
    log('✗ Failed to register test user', 'error');
    return false;
  }
}

async function test1_CreateCategory() {
  log('\n========== TEST 1: Create Category ==========', 'info');

  const uniqueName = `Test Category ${Date.now()}`;
  const result = await makeRequest('/categories', {
    method: 'POST',
    body: JSON.stringify({
      name: uniqueName,
      color: '#FF5733',
      icon: '🍔'
    })
  });

  if (result.ok && result.data && result.data.category) {
    categoryId = result.data.category.id;
    log('✓ Category created successfully', 'success');
    log(`  ID: ${categoryId}`, 'info');
    log(`  Name: ${result.data.category.name}`, 'info');
    log(`  Color: ${result.data.category.color}`, 'info');
    log(`  Icon: ${result.data.category.icon}`, 'info');
    return true;
  } else {
    const errorMsg = result.data ? (result.data.error || JSON.stringify(result.data)) : result.error || 'Unknown error';
    log(`✗ Category creation failed: ${errorMsg}`, 'error');
    return false;
  }
}

async function test2_CreateDuplicateCategory() {
  log('\n========== TEST 2: Create Duplicate Category (Should Fail) ==========', 'info');

  // Try to create category with same name as Test 1
  const uniqueName = `Test Category ${Date.now()}`;

  // First create one to ensure it exists
  await makeRequest('/categories', {
    method: 'POST',
    body: JSON.stringify({
      name: uniqueName,
      color: '#FF5733',
      icon: '🍔'
    })
  });

  // Now try duplicate
  const result = await makeRequest('/categories', {
    method: 'POST',
    body: JSON.stringify({
      name: uniqueName,
      color: '#FF5733',
      icon: '🍔'
    })
  });

  if (!result.ok && result.status === 409) {
    log('✓ Correctly rejected duplicate category', 'success');
    return true;
  } else {
    log('✗ Should have rejected duplicate category', 'error');
    return false;
  }
}

async function test3_CreateCategoryInvalidColor() {
  log('\n========== TEST 3: Create Category with Invalid Color (Should Fail) ==========', 'info');

  const result = await makeRequest('/categories', {
    method: 'POST',
    body: JSON.stringify({
      name: 'Shopping',
      color: 'not-a-color',
      icon: '🛒'
    })
  });

  if (!result.ok && result.status === 400) {
    log('✓ Correctly rejected invalid color format', 'success');
    return true;
  } else {
    log('✗ Should have rejected invalid color', 'error');
    return false;
  }
}

async function test4_GetAllCategories() {
  log('\n========== TEST 4: Get All Categories ==========', 'info');

  const result = await makeRequest('/categories', {
    method: 'GET'
  });

  if (result.ok && result.data && result.data.categories) {
    log('✓ Categories retrieved successfully', 'success');
    log(`  Total categories: ${result.data.categories.length}`, 'info');
    log(`  Total count: ${result.data.pagination.total}`, 'info');
    return true;
  } else {
    const errorMsg = result.data ? (result.data.error || JSON.stringify(result.data)) : result.error || 'Unknown error';
    log(`✗ Failed to get categories: ${errorMsg}`, 'error');
    return false;
  }
}

async function test5_GetCategoryById() {
  log('\n========== TEST 5: Get Category By ID ==========', 'info');

  if (!categoryId) {
    log('✗ No category ID available', 'error');
    return false;
  }

  const result = await makeRequest(`/categories/${categoryId}`, {
    method: 'GET'
  });

  if (result.ok && result.data && result.data.category) {
    log('✓ Category retrieved successfully', 'success');
    log(`  Name: ${result.data.category.name}`, 'info');
    log(`  Expense count: ${result.data.category._count.expenses}`, 'info');
    return true;
  } else {
    const errorMsg = result.data ? (result.data.error || JSON.stringify(result.data)) : result.error || 'Unknown error';
    log(`✗ Failed to get category: ${errorMsg}`, 'error');
    return false;
  }
}

async function test6_UpdateCategory() {
  log('\n========== TEST 6: Update Category ==========', 'info');

  if (!categoryId) {
    log('✗ No category ID available', 'error');
    return false;
  }

  const updatedName = `Updated Test Category ${Date.now()}`;
  const result = await makeRequest(`/categories/${categoryId}`, {
    method: 'PUT',
    body: JSON.stringify({
      name: updatedName,
      color: '#00FF00',
      icon: '🍽️'
    })
  });

  if (result.ok && result.data && result.data.category) {
    log('✓ Category updated successfully', 'success');
    log(`  New name: ${result.data.category.name}`, 'info');
    log(`  New color: ${result.data.category.color}`, 'info');
    log(`  New icon: ${result.data.category.icon}`, 'info');
    return true;
  } else {
    const errorMsg = result.data ? (result.data.error || JSON.stringify(result.data)) : result.error || 'Unknown error';
    log(`✗ Failed to update category: ${errorMsg}`, 'error');
    return false;
  }
}

async function test7_SearchCategories() {
  log('\n========== TEST 7: Search Categories ==========', 'info');

  const result = await makeRequest('/categories?search=Test', {
    method: 'GET'
  });

  if (result.ok && result.data && result.data.categories) {
    log('✓ Search completed successfully', 'success');
    log(`  Results found: ${result.data.categories.length}`, 'info');
    return true;
  } else {
    const errorMsg = result.data ? (result.data.error || JSON.stringify(result.data)) : result.error || 'Unknown error';
    log(`✗ Search failed: ${errorMsg}`, 'error');
    return false;
  }
}

async function test8_GetCategoriesWithPagination() {
  log('\n========== TEST 8: Get Categories with Pagination ==========', 'info');

  const result = await makeRequest('/categories?page=1&limit=5', {
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

async function test9_GetNonExistentCategory() {
  log('\n========== TEST 9: Get Non-Existent Category (Should Fail) ==========', 'info');

  const fakeId = '00000000-0000-0000-0000-000000000000';
  const result = await makeRequest(`/categories/${fakeId}`, {
    method: 'GET'
  });

  if (!result.ok && result.status === 404) {
    log('✓ Correctly returned 404 for non-existent category', 'success');
    return true;
  } else {
    log('✗ Should have returned 404', 'error');
    return false;
  }
}

async function test10_DeleteCategory() {
  log('\n========== TEST 10: Delete Category ==========', 'info');

  if (!categoryId) {
    log('✗ No category ID available', 'error');
    return false;
  }

  const result = await makeRequest(`/categories/${categoryId}`, {
    method: 'DELETE'
  });

  if (result.ok) {
    log('✓ Category deleted successfully', 'success');

    // Verify it's deleted
    const verifyResult = await makeRequest(`/categories/${categoryId}`, {
      method: 'GET'
    });

    if (!verifyResult.ok && verifyResult.status === 404) {
      log('✓ Verified: Category no longer exists', 'success');
      return true;
    } else {
      log('✗ Category still exists after deletion', 'error');
      return false;
    }
  } else {
    const errorMsg = result.data ? (result.data.error || JSON.stringify(result.data)) : result.error || 'Unknown error';
    log(`✗ Failed to delete category: ${errorMsg}`, 'error');
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
    log('✓ Test user deleted successfully', 'success');
    return true;
  } else {
    log('⚠ Failed to delete test user (may need manual cleanup)', 'warning');
    return false;
  }
}

async function runAllTests() {
  log(`\n${'='.repeat(60)}`, 'info');
  log('EXPENSE MANAGER - CATEGORY TESTS', 'info');
  log('='.repeat(60), 'info');

  // Setup
  const setupSuccess = await setup();
  if (!setupSuccess) {
    log('\n✗ Setup failed. Aborting tests.', 'error');
    process.exit(1);
  }

  const tests = [
    { name: 'Create Category', fn: test1_CreateCategory },
    { name: 'Create Duplicate Category', fn: test2_CreateDuplicateCategory },
    { name: 'Create Category with Invalid Color', fn: test3_CreateCategoryInvalidColor },
    { name: 'Get All Categories', fn: test4_GetAllCategories },
    { name: 'Get Category By ID', fn: test5_GetCategoryById },
    { name: 'Update Category', fn: test6_UpdateCategory },
    { name: 'Search Categories', fn: test7_SearchCategories },
    { name: 'Get Categories with Pagination', fn: test8_GetCategoriesWithPagination },
    { name: 'Get Non-Existent Category', fn: test9_GetNonExistentCategory },
    { name: 'Delete Category', fn: test10_DeleteCategory }
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
