/**
 * Test script to verify forgot password email functionality
 */
import 'dotenv/config';
import emailService from '../services/email/index.js';
import logger from '../config/logger.js';

async function testForgotPasswordEmail() {
  try {
    console.log('🚀 Initializing email service...');
    await emailService.initialize(process.env.EMAIL_PROVIDER);
    console.log('✅ Email service initialized with', emailService.getProviderName());

    console.log('\n📧 Sending test forgot password email...');
    console.log('To:', process.env.TEST_EMAIL || 'sakilahmmad71@gmail.com');
    console.log('Provider:', process.env.EMAIL_PROVIDER);
    console.log('SMTP Host:', process.env.EMAIL_HOST);
    console.log('SMTP Port:', process.env.EMAIL_PORT);
    console.log('From:', process.env.EMAIL_FROM);

    const testEmail = process.env.TEST_EMAIL || 'sakilahmmad71@gmail.com';
    const resetToken = 'test-token-' + Date.now();
    const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/reset-password?token=${resetToken}`;

    const result = await emailService.sendForgotPasswordEmail(testEmail, {
      name: 'Test User',
      resetUrl,
      resetToken,
      expiryMinutes: 60
    });

    console.log('\n✅ Email sent successfully!');
    console.log('Result:', JSON.stringify(result, null, 2));

  } catch (error) {
    console.error('\n❌ Error sending email:');
    console.error('Message:', error.message);
    console.error('Stack:', error.stack);

    logger.logError(error, null, {
      context: 'test-forgot-password-email'
    });
  } finally {
    process.exit(0);
  }
}

testForgotPasswordEmail();
