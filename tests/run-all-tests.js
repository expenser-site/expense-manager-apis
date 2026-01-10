#!/usr/bin/env node

/**
 * Master Test Runner - Runs all test suites sequentially
 * Provides comprehensive test results for production readiness
 */

import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Color codes for console output
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[36m',
  magenta: '\x1b[35m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
};

function log(message, type = 'info') {
  const color = type === 'success' ? colors.green :
    type === 'error' ? colors.red :
      type === 'warning' ? colors.yellow :
        type === 'header' ? colors.magenta :
          colors.blue;
  console.log(`${color}${message}${colors.reset}`);
}

function runTest(testFile, testName) {
  return new Promise((resolve) => {
    const startTime = Date.now();
    log(`\n${'='.repeat(70)}`, 'header');
    log(`Running: ${testName}`, 'header');
    log('='.repeat(70), 'header');

    const child = spawn('node', [testFile], {
      cwd: __dirname,
      stdio: 'inherit'
    });

    child.on('close', (code) => {
      const duration = Date.now() - startTime;
      resolve({
        name: testName,
        file: testFile,
        passed: code === 0,
        duration,
        exitCode: code
      });
    });

    child.on('error', (error) => {
      const duration = Date.now() - startTime;
      resolve({
        name: testName,
        file: testFile,
        passed: false,
        duration,
        error: error.message
      });
    });
  });
}

async function runAllTests() {
  const startTime = Date.now();

  log(`\n${'='.repeat(70)}`, 'header');
  log('🧪 EXPENSE MANAGER - COMPREHENSIVE TEST SUITE', 'header');
  log(`${'='.repeat(70)}\n`, 'header');

  const testSuites = [
    { file: 'test-auth-flow.js', name: 'Authentication & User Management' },
    { file: 'test-category-flow.js', name: 'Category Management' },
    { file: 'test-expense-flow.js', name: 'Expense Management' }
  ];

  const results = [];

  // Run tests sequentially
  for (const suite of testSuites) {
    const result = await runTest(suite.file, suite.name);
    results.push(result);
  }

  const totalDuration = Date.now() - startTime;

  // Print summary
  log(`\n\n${'='.repeat(70)}`, 'header');
  log('📊 TEST EXECUTION SUMMARY', 'header');
  log('='.repeat(70), 'header');

  results.forEach((result, index) => {
    const status = result.passed ? '✅ PASSED' : '❌ FAILED';
    const statusType = result.passed ? 'success' : 'error';
    const durationSec = (result.duration / 1000).toFixed(2);

    log(`\n${index + 1}. ${result.name}`, 'info');
    log(`   File: ${result.file}`, 'info');
    log(`   Status: ${status}`, statusType);
    log(`   Duration: ${durationSec}s`, 'info');

    if (result.error) {
      log(`   Error: ${result.error}`, 'error');
    }
  });

  // Overall statistics
  const passed = results.filter(r => r.passed).length;
  const failed = results.filter(r => r.passed === false).length;
  const total = results.length;
  const totalDurationSec = (totalDuration / 1000).toFixed(2);

  log(`\n${'='.repeat(70)}`, 'header');
  log('📈 OVERALL RESULTS', 'header');
  log('='.repeat(70), 'header');
  log(`\nTotal Test Suites: ${total}`, 'info');
  log(`Passed: ${passed}`, passed > 0 ? 'success' : 'info');
  log(`Failed: ${failed}`, failed > 0 ? 'error' : 'info');
  log(`Success Rate: ${((passed / total) * 100).toFixed(1)}%`, passed === total ? 'success' : 'warning');
  log(`Total Duration: ${totalDurationSec}s`, 'info');

  // Production readiness assessment
  log(`\n${'='.repeat(70)}`, 'header');
  if (passed === total) {
    log('✅ PRODUCTION READY - All tests passed!', 'success');
    log('='.repeat(70), 'header');
    log('\nYour API is fully tested and ready for deployment.', 'success');
    log('Next steps:', 'info');
    log('  1. Review COMPREHENSIVE_TEST_SUMMARY.md', 'info');
    log('  2. Configure production environment variables', 'info');
    log('  3. Set up production database', 'info');
    log('  4. Deploy to VPS', 'info');
    log('  5. Run smoke tests in production\n', 'info');
  } else {
    log('⚠️  NOT PRODUCTION READY - Some tests failed!', 'error');
    log('='.repeat(70), 'header');
    log('\nPlease fix failing tests before deploying to production.', 'error');
    log('Review the test output above for details.\n', 'error');
  }

  // Exit with appropriate code
  process.exit(passed === total ? 0 : 1);
}

// Handle errors
process.on('unhandledRejection', (error) => {
  log(`\n❌ Unhandled error: ${error.message}`, 'error');
  process.exit(1);
});

// Run all tests
runAllTests().catch((error) => {
  log(`\n❌ Fatal error: ${error.message}`, 'error');
  process.exit(1);
});
