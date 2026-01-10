#!/usr/bin/env node

/**
 * Email Template Preview Generator
 * Generates HTML preview files for all email templates
 *
 * Usage:
 *   npm run preview:emails
 *   node scripts/preview-emails.js
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get current directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Import HTML templates
import welcomeEmailTemplate from '../src/services/email/templates/welcomeEmail.js';
import emailVerificationTemplate from '../src/services/email/templates/emailVerification.js';
import forgotPasswordTemplate from '../src/services/email/templates/forgotPassword.js';
import passwordChangedTemplate from '../src/services/email/templates/passwordChanged.js';
import resetPasswordTemplate from '../src/services/email/templates/resetPassword.js';
import otpVerificationTemplate from '../src/services/email/templates/otpVerification.js';
import otpExpirationTemplate from '../src/services/email/templates/otpExpiration.js';
import gettingStartedTemplate from '../src/services/email/templates/gettingStarted.js';
import accountDeletionTemplate from '../src/services/email/templates/accountDeletion.js';
import dataExportTemplate from '../src/services/email/templates/dataExport.js';

// Sample data for templates
const sampleData = {
  welcome: {
    name: 'John Doe',
    email: 'john.doe@example.com',
    loginUrl: 'https://expenser.site/login'
  },
  emailVerification: {
    name: 'Jane Smith',
    verificationUrl: 'https://expenser.site/verify-email?token=abc123xyz789',
    verificationCode: 'VERIFY123',
    expiryMinutes: 60
  },
  forgotPassword: {
    name: 'Bob Wilson',
    resetUrl: 'https://expenser.site/reset-password?token=reset123xyz789',
    resetToken: 'RESET789',
    expiryMinutes: 15
  },
  passwordChanged: {
    name: 'Alice Johnson',
    email: 'alice@example.com',
    changedAt: new Date().toISOString(),
    ipAddress: '192.168.1.100',
    deviceInfo: 'Chrome on macOS',
    loginUrl: 'https://expenser.site/login'
  },
  resetPassword: {
    name: 'Michael Brown',
    email: 'michael@example.com',
    loginUrl: 'https://expenser.site/login'
  },
  otpVerification: {
    name: 'Sarah Davis',
    otp: '847293',
    expiryMinutes: 10,
    purpose: 'login verification'
  },
  otpExpiration: {
    name: 'David Wilson',
    requestNewOtpUrl: 'https://expenser.site/request-otp',
    expiryMinutes: 10
  },
  gettingStarted: {
    name: 'Emma Martinez',
    dashboardUrl: 'https://expenser.site/dashboard'
  },
  accountDeletion: {
    name: 'James Taylor',
    email: 'james@example.com',
    deletionDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    cancelUrl: 'https://expenser.site/cancel-deletion',
    daysUntilDeletion: 30
  },
  dataExport: {
    name: 'Olivia Anderson',
    downloadUrl: 'https://expenser.site/download/export-abc123.zip',
    expiryHours: 48,
    fileSize: '2.3 MB',
    exportDate: new Date().toISOString()
  }
};

// Create preview directory
const previewDir = path.join(__dirname, '../email-previews');
if (!fs.existsSync(previewDir)) {
  fs.mkdirSync(previewDir, { recursive: true });
}

// Generate previews
const templates = [
  { name: 'welcome', template: welcomeEmailTemplate, data: sampleData.welcome },
  { name: 'email-verification', template: emailVerificationTemplate, data: sampleData.emailVerification },
  { name: 'forgot-password', template: forgotPasswordTemplate, data: sampleData.forgotPassword },
  { name: 'password-changed', template: passwordChangedTemplate, data: sampleData.passwordChanged },
  { name: 'reset-password', template: resetPasswordTemplate, data: sampleData.resetPassword },
  { name: 'otp-verification', template: otpVerificationTemplate, data: sampleData.otpVerification },
  { name: 'otp-expiration', template: otpExpirationTemplate, data: sampleData.otpExpiration },
  { name: 'getting-started', template: gettingStartedTemplate, data: sampleData.gettingStarted },
  { name: 'account-deletion', template: accountDeletionTemplate, data: sampleData.accountDeletion },
  { name: 'data-export', template: dataExportTemplate, data: sampleData.dataExport }
];

console.log('🎨 Generating email template previews...\n');

templates.forEach(({ name, template, data }) => {
  try {
    const email = template(data);
    const filename = path.join(previewDir, `${name}.html`);

    fs.writeFileSync(filename, email.html);
    console.log(`✅ Generated: ${filename}`);
    console.log(`   Subject: ${email.subject}\n`);
  } catch (error) {
    console.error(`❌ Failed to generate ${name}:`, error.message);
  }
});

// Generate index page
const indexHtml = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Expenser Email Templates Preview</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      min-height: 100vh;
      padding: 40px 20px;
    }
    
    .container {
      max-width: 1200px;
      margin: 0 auto;
    }
    
    h1 {
      color: white;
      text-align: center;
      margin-bottom: 40px;
      font-size: 36px;
      text-shadow: 2px 2px 4px rgba(0,0,0,0.2);
    }
    
    .grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
      gap: 24px;
    }
    
    .card {
      background: white;
      border-radius: 12px;
      padding: 24px;
      box-shadow: 0 10px 30px rgba(0,0,0,0.2);
      transition: transform 0.2s, box-shadow 0.2s;
    }
    
    .card:hover {
      transform: translateY(-4px);
      box-shadow: 0 15px 40px rgba(0,0,0,0.3);
    }
    
    .card h2 {
      color: #1f2937;
      margin-bottom: 12px;
      font-size: 20px;
    }
    
    .card p {
      color: #6b7280;
      margin-bottom: 16px;
      font-size: 14px;
      line-height: 1.6;
    }
    
    .card a {
      display: inline-block;
      background: linear-gradient(135deg, #3b82f6, #2563eb);
      color: white;
      text-decoration: none;
      padding: 12px 24px;
      border-radius: 6px;
      font-weight: 600;
      transition: opacity 0.2s;
    }
    
    .card a:hover {
      opacity: 0.9;
    }
    
    .footer {
      text-align: center;
      color: white;
      margin-top: 60px;
      font-size: 14px;
      opacity: 0.9;
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>📧 Expenser Email Templates</h1>
    
    <div class="grid">
      <div class="card">
        <h2>🎉 Welcome Email</h2>
        <p>Sent after successful registration to welcome new users and guide them to get started.</p>
        <a href="welcome.html" target="_blank">Preview Template →</a>
      </div>
      
      <div class="card">
        <h2>✉️ Email Verification</h2>
        <p>Sent after registration to verify the user's email address with a verification link and code.</p>
        <a href="email-verification.html" target="_blank">Preview Template →</a>
      </div>
      
      <div class="card">
        <h2>🔐 Forgot Password</h2>
        <p>Sent when user requests password reset with a secure time-limited reset link.</p>
        <a href="forgot-password.html" target="_blank">Preview Template →</a>
      </div>
      
      <div class="card">
        <h2>✅ Password Changed</h2>
        <p>Confirmation email sent after successful password change with security details.</p>
        <a href="password-changed.html" target="_blank">Preview Template →</a>
      </div>
      
      <div class="card">
        <h2>🔓 Reset Password</h2>
        <p>Confirmation sent after successful password reset with login button.</p>
        <a href="reset-password.html" target="_blank">Preview Template →</a>
      </div>
      
      <div class="card">
        <h2>🔢 OTP Verification</h2>
        <p>One-time password sent for sensitive operations and login verification.</p>
        <a href="otp-verification.html" target="_blank">Preview Template →</a>
      </div>
      
      <div class="card">
        <h2>⏰ OTP Expiration</h2>
        <p>Notification when user's OTP code has expired with option to request new one.</p>
        <a href="otp-expiration.html" target="_blank">Preview Template →</a>
      </div>
      
      <div class="card">
        <h2>🎯 Getting Started</h2>
        <p>Onboarding guide to help new users get the most out of Expenser.</p>
        <a href="getting-started.html" target="_blank">Preview Template →</a>
      </div>
      
      <div class="card">
        <h2>⚠️ Account Deletion</h2>
        <p>Notification when account deletion is scheduled with option to cancel.</p>
        <a href="account-deletion.html" target="_blank">Preview Template →</a>
      </div>
      
      <div class="card">
        <h2>📦 Data Export</h2>
        <p>Notification when user's data export is ready for download.</p>
        <a href="data-export.html" target="_blank">Preview Template →</a>
      </div>
    </div>
    
    <div class="footer">
      <p>These are preview templates with sample data.</p>
      <p>© ${new Date().getFullYear()} Expenser. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
`;

fs.writeFileSync(path.join(previewDir, 'index.html'), indexHtml);
console.log(`✅ Generated index page: ${path.join(previewDir, 'index.html')}`);
console.log(`\n🌐 Open ${path.join(previewDir, 'index.html')} in your browser to preview all templates.`);
console.log('\n✨ Done!\n');
