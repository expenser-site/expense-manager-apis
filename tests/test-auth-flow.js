/**
 * Comprehensive Authentication Flow Test Script
 * Tests all authentication endpoints to verify everything works correctly
 */

import http from 'http';

const API_BASE = 'http://localhost:3000/api/v1';
let authToken = null;
let resetToken = null;
const testEmail = `test-${Date.now()}@example.com`;
const testPassword = 'TestPassword123';
const testName = 'Test User';

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

  // Add Content-Length header for requests with body
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

async function test1_Register() {
  log('\n========== TEST 1: User Registration ==========', 'info');

  const result = await makeRequest('/auth/register', {
    method: 'POST',
    noAuth: true,
    body: JSON.stringify({
      email: testEmail,
      password: testPassword,
      name: testName
    })
  });

  if (result.ok && result.data && result.data.token) {
    authToken = result.data.token;
    log('✓ User registered successfully', 'success');
    log(`  Email: ${testEmail}`, 'info');
    log(`  Token received: ${authToken.substring(0, 20)}...`, 'info');
    return true;
  } else {
    const errorMsg = result.data ? (result.data.error || JSON.stringify(result.data)) : result.error || 'Unknown error';
    log(`✗ Registration failed: ${errorMsg}`, 'error');
    return false;
  }
}

async function test2_LoginWithCorrectCredentials() {
  log('\n========== TEST 2: Login with Correct Credentials ==========', 'info');

  const result = await makeRequest('/auth/login', {
    method: 'POST',
    noAuth: true,
    body: JSON.stringify({
      email: testEmail,
      password: testPassword
    })
  });

  if (result.ok && result.data && result.data.token) {
    authToken = result.data.token;
    log('✓ Login successful', 'success');
    log(`  User: ${result.data.user.name}`, 'info');
    return true;
  } else {
    const errorMsg = result.data ? (result.data.error || JSON.stringify(result.data)) : result.error || 'Unknown error';
    log(`✗ Login failed: ${errorMsg}`, 'error');
    return false;
  }
}

async function test3_LoginWithWrongPassword() {
  log('\n========== TEST 3: Login with Wrong Password (Should Fail) ==========', 'info');

  const result = await makeRequest('/auth/login', {
    method: 'POST',
    noAuth: true,
    body: JSON.stringify({
      email: testEmail,
      password: 'WrongPassword123'
    })
  });

  if (!result.ok && result.status === 401) {
    log('✓ Correctly rejected invalid credentials', 'success');
    return true;
  } else {
    log('✗ Should have rejected invalid credentials', 'error');
    return false;
  }
}

async function test4_GetProfile() {
  log('\n========== TEST 4: Get User Profile ==========', 'info');

  const result = await makeRequest('/auth/profile', {
    method: 'GET'
  });

  if (result.ok && result.data && result.data.email === testEmail) {
    log('✓ Profile retrieved successfully', 'success');
    log(`  Name: ${result.data.name}`, 'info');
    log(`  Email: ${result.data.email}`, 'info');
    log(`  Auth Provider: ${result.data.authProvider}`, 'info');
    return true;
  } else {
    const errorMsg = result.data ? (result.data.error || JSON.stringify(result.data)) : result.error || 'Unknown error';
    log(`✗ Failed to get profile: ${errorMsg}`, 'error');
    return false;
  }
}

async function test5_UpdateProfile() {
  log('\n========== TEST 5: Update Profile ==========', 'info');

  // Test 1: Update name (should succeed)
  const newName = 'Updated Test User';
  const result = await makeRequest('/auth/profile', {
    method: 'PUT',
    body: JSON.stringify({
      name: newName
    })
  });

  if (result.ok && result.data && result.data.user && result.data.user.name === newName) {
    log('✓ Profile name updated successfully', 'success');
    log(`  New name: ${result.data.user.name}`, 'info');
  } else {
    const errorMsg = result.data ? (result.data.error || JSON.stringify(result.data)) : result.error || 'Unknown error';
    log(`✗ Failed to update profile: ${errorMsg}`, 'error');
    return false;
  }

  // Test 2: Try to update email (should fail)
  const newEmail = `new-${Date.now()}@example.com`;
  const emailResult = await makeRequest('/auth/profile', {
    method: 'PUT',
    body: JSON.stringify({
      name: newName,
      email: newEmail
    })
  });

  if (!emailResult.ok && emailResult.data && emailResult.data.error &&
    emailResult.data.error.includes('Email cannot be changed')) {
    log('✓ Email change correctly prevented', 'success');
    log(`  Error message: ${emailResult.data.error}`, 'info');
    return true;
  } else {
    log('✗ Email change should have been prevented', 'error');
    return false;
  }
}

async function test6_ChangePassword() {
  log('\n========== TEST 6: Change Password ==========', 'info');

  const newPassword = 'NewTestPassword456';
  const result = await makeRequest('/auth/change-password', {
    method: 'POST',
    body: JSON.stringify({
      currentPassword: testPassword,
      newPassword
    })
  });

  if (result.ok) {
    log('✓ Password changed successfully', 'success');

    // Verify can login with new password
    const loginResult = await makeRequest('/auth/login', {
      method: 'POST',
      noAuth: true,
      body: JSON.stringify({
        email: testEmail,
        password: newPassword
      })
    });

    if (loginResult.ok) {
      authToken = loginResult.data.token;
      log('✓ Verified: Can login with new password', 'success');
      return true;
    } else {
      log('✗ Cannot login with new password', 'error');
      return false;
    }
  } else {
    const errorMsg = result.data ? (result.data.error || JSON.stringify(result.data)) : result.error || 'Unknown error';
    log(`✗ Failed to change password: ${errorMsg}`, 'error');
    return false;
  }
}

async function test7_ForgotPassword() {
  log('\n========== TEST 7: Forgot Password ==========', 'info');

  const result = await makeRequest('/auth/forgot-password', {
    method: 'POST',
    noAuth: true,
    body: JSON.stringify({
      email: testEmail
    })
  });

  if (result.ok && result.data) {
    log('✓ Forgot password request successful', 'success');
    log(`  Message: ${result.data.message}`, 'info');

    if (result.data.resetToken) {
      resetToken = result.data.resetToken;
      log(`  Reset token (dev only): ${resetToken.substring(0, 20)}...`, 'info');
    }
    return true;
  } else {
    const errorMsg = result.data ? (result.data.error || JSON.stringify(result.data)) : result.error || 'Unknown error';
    log(`✗ Forgot password failed: ${errorMsg}`, 'error');
    return false;
  }
}

async function test8_ResetPassword() {
  log('\n========== TEST 8: Reset Password ==========', 'info');

  if (!resetToken) {
    log('✗ No reset token available (test 7 may have failed)', 'error');
    return false;
  }

  const resetPassword = 'ResetPassword789';
  const result = await makeRequest('/auth/reset-password', {
    method: 'POST',
    noAuth: true,
    body: JSON.stringify({
      token: resetToken,
      newPassword: resetPassword
    })
  });

  if (result.ok) {
    log('✓ Password reset successful', 'success');

    // Verify can login with reset password
    const loginResult = await makeRequest('/auth/login', {
      method: 'POST',
      noAuth: true,
      body: JSON.stringify({
        email: testEmail,
        password: resetPassword
      })
    });

    if (loginResult.ok) {
      authToken = loginResult.data.token;
      log('✓ Verified: Can login with reset password', 'success');
      return true;
    } else {
      log('✗ Cannot login with reset password', 'error');
      return false;
    }
  } else {
    const errorMsg = result.data ? (result.data.error || JSON.stringify(result.data)) : result.error || 'Unknown error';
    log(`✗ Password reset failed: ${errorMsg}`, 'error');
    return false;
  }
}

async function test9_ResetPasswordWithExpiredToken() {
  log('\n========== TEST 9: Reset Password with Used Token (Should Fail) ==========', 'info');

  const result = await makeRequest('/auth/reset-password', {
    method: 'POST',
    noAuth: true,
    body: JSON.stringify({
      token: resetToken,
      newPassword: 'ShouldNotWork123'
    })
  });

  if (!result.ok && result.status === 400) {
    log('✓ Correctly rejected used/expired token', 'success');
    return true;
  } else {
    log('✗ Should have rejected used token', 'error');
    return false;
  }
}

async function test10_ForgotPasswordNonExistentEmail() {
  log('\n========== TEST 10: Forgot Password with Non-Existent Email ==========', 'info');

  const result = await makeRequest('/auth/forgot-password', {
    method: 'POST',
    noAuth: true,
    body: JSON.stringify({
      email: 'nonexistent@example.com'
    })
  });

  if (result.ok && result.data) {
    log('✓ Returns success (prevents email enumeration)', 'success');
    log(`  Message: ${result.data.message}`, 'info');
    if (result.data.resetToken) {
      log('✗ Should not return token for non-existent email', 'error');
      return false;
    }
    return true;
  } else {
    log('✗ Should return success to prevent email enumeration', 'error');
    return false;
  }
}

async function test11_DeleteAccount() {
  log('\n========== TEST 11: Delete Account ==========', 'info');

  const result = await makeRequest('/auth/account', {
    method: 'DELETE',
    body: JSON.stringify({
      password: 'ResetPassword789' // Current password from test 8
    })
  });

  if (result.ok) {
    log('✓ Account deleted successfully', 'success');

    // Verify cannot login anymore
    const loginResult = await makeRequest('/auth/login', {
      method: 'POST',
      noAuth: true,
      body: JSON.stringify({
        email: testEmail,
        password: 'ResetPassword789'
      })
    });

    if (!loginResult.ok) {
      log('✓ Verified: Cannot login with deleted account', 'success');
      return true;
    } else {
      log('✗ Should not be able to login with deleted account', 'error');
      return false;
    }
  } else {
    const errorMsg = result.data ? (result.data.error || JSON.stringify(result.data)) : result.error || 'Unknown error';
    log(`✗ Failed to delete account: ${errorMsg}`, 'error');
    log(`  Status: ${result.status}`, 'error');
    if (result.rawResponse) {
      log(`  Raw response: ${result.rawResponse}`, 'error');
    }
    return false;
  }
}

async function runAllTests() {
  log(`\n${'='.repeat(60)}`, 'info');
  log('EXPENSE MANAGER - AUTHENTICATION FLOW TESTS', 'info');
  log('='.repeat(60), 'info');

  const tests = [
    { name: 'Registration', fn: test1_Register },
    { name: 'Login with Correct Credentials', fn: test2_LoginWithCorrectCredentials },
    { name: 'Login with Wrong Password', fn: test3_LoginWithWrongPassword },
    { name: 'Get Profile', fn: test4_GetProfile },
    { name: 'Update Profile', fn: test5_UpdateProfile },
    { name: 'Change Password', fn: test6_ChangePassword },
    { name: 'Forgot Password', fn: test7_ForgotPassword },
    { name: 'Reset Password', fn: test8_ResetPassword },
    { name: 'Reset with Used Token', fn: test9_ResetPasswordWithExpiredToken },
    { name: 'Forgot Password (Non-existent Email)', fn: test10_ForgotPasswordNonExistentEmail },
    { name: 'Delete Account', fn: test11_DeleteAccount }
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
