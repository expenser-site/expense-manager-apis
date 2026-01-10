/**
 * Email Service Test Script
 * Tests all email templates and provider functionality
 */
import emailService from '../src/services/email/index.js';
import logger from '../src/config/logger.js';

const testEmail = 'test@example.com';
const testName = 'Test User';

console.log('\n🧪 Starting Email Service Tests...\n');

async function runTests() {
  try {
    // Initialize email service with DEVELOPMENT provider
    await emailService.initialize('DEVELOPMENT');
    console.log(`✓ Email service initialized with ${emailService.getProviderName()} provider\n`);

    // Test 1: Welcome Email
    console.log('📧 Test 1: Welcome Email');
    await emailService.sendWelcomeEmail(testEmail, {
      name: testName,
      email: testEmail,
      loginUrl: 'https://expenser.site'
    });
    console.log('✓ Welcome email sent\n');

    // Test 2: Email Verification
    console.log('📧 Test 2: Email Verification');
    await emailService.sendEmailVerification(testEmail, {
      name: testName,
      verificationUrl: 'https://expenser.site/verify?token=abc123',
      verificationCode: '123456',
      expiresIn: '24 hours'
    });
    console.log('✓ Email verification sent\n');

    // Test 3: Getting Started
    console.log('📧 Test 3: Getting Started Email');
    await emailService.sendGettingStartedEmail(testEmail, {
      name: testName
    });
    console.log('✓ Getting started email sent\n');

    // Test 4: OTP Verification
    console.log('📧 Test 4: OTP Verification');
    await emailService.sendOTPVerification(testEmail, {
      name: testName,
      otp: '987654',
      expiresIn: '10 minutes',
      purpose: 'login'
    });
    console.log('✓ OTP verification email sent\n');

    // Test 5: OTP Expiration
    console.log('📧 Test 5: OTP Expiration');
    await emailService.sendOTPExpiration(testEmail, {
      name: testName,
      purpose: 'login',
      requestNewUrl: 'https://expenser.site/request-otp'
    });
    console.log('✓ OTP expiration email sent\n');

    // Test 6: Forgot Password
    console.log('📧 Test 6: Forgot Password');
    await emailService.sendForgotPasswordEmail(testEmail, {
      name: testName,
      resetUrl: 'https://expenser.site/reset?token=xyz789',
      expiresIn: '1 hour'
    });
    console.log('✓ Forgot password email sent\n');

    // Test 7: Reset Password
    console.log('📧 Test 7: Reset Password Confirmation');
    await emailService.sendResetPasswordEmail(testEmail, {
      name: testName,
      loginUrl: 'https://expenser.site',
      resetTime: new Date().toLocaleString()
    });
    console.log('✓ Reset password email sent\n');

    // Test 8: Password Changed
    console.log('📧 Test 8: Password Changed Notification');
    await emailService.sendPasswordChangedEmail(testEmail, {
      name: testName,
      changeTime: new Date().toLocaleString(),
      ipAddress: '192.168.1.1',
      device: 'Chrome on macOS'
    });
    console.log('✓ Password changed email sent\n');

    // Test 9: Account Deletion (Immediate)
    console.log('📧 Test 9: Account Deletion (Immediate)');
    await emailService.sendAccountDeletionEmail(testEmail, {
      name: testName,
      email: testEmail,
      isImmediate: true
    });
    console.log('✓ Account deletion email sent\n');

    // Test 10: Account Deletion (Scheduled)
    console.log('📧 Test 10: Account Deletion (Scheduled)');
    await emailService.sendAccountDeletionEmail(testEmail, {
      name: testName,
      email: testEmail,
      deletionDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      cancelUrl: 'https://expenser.site/cancel-deletion',
      isImmediate: false
    });
    console.log('✓ Scheduled deletion email sent\n');

    // Test 11: Data Export
    console.log('📧 Test 11: Data Export Ready');
    await emailService.sendDataExportEmail(testEmail, {
      name: testName,
      downloadUrl: 'https://expenser.site/download/data.zip',
      expiresIn: '7 days',
      fileSize: '2.5 MB',
      recordCount: 1234,
      exportDate: new Date().toLocaleDateString()
    });
    console.log('✓ Data export email sent\n');

    console.log('✅ All email tests passed successfully!\n');
    console.log('Total tests: 11');
    console.log(`Provider: ${emailService.getProviderName()}\n`);
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    logger.logError(error, null, { context: 'email-service-test' });
    process.exit(1);
  }
}

runTests();
