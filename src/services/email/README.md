# Email Service Documentation

## Overview

The Email Service is a flexible, provider-agnostic email delivery system for the
Expenser application. It supports multiple email providers and includes
beautiful text-based email templates.

## Features

- **Multi-Provider Support**: Easy to switch between email providers (ZeptoMail,
  Development, and extensible for others)
- **Beautiful Templates**: 10 pre-built email templates with consistent branding
- **Async Email Delivery**: Non-blocking email sending that doesn't slow down
  API responses
- **Development Mode**: Console-based email preview for development and testing
- **Type Safety**: Well-structured interfaces for easy maintenance
- **Error Handling**: Comprehensive error logging and fallback mechanisms

## Configuration

### Environment Variables

Add these variables to your `.env` file:

```bash
# Email Provider (ZEPTOMAIL for production, DEVELOPMENT for testing)
EMAIL_PROVIDER=ZEPTOMAIL
EMAIL_FROM=no-reply@expenser.site
EMAIL_REPLY_TO=contact@expenser.site

# ZeptoMail SMTP Configuration
EMAIL_HOST=smtp.zeptomail.com
EMAIL_PORT=465
EMAIL_SECURE=true
EMAIL_USER=emailapikey
EMAIL_API_KEY=your_zeptomail_api_key_here
```

### Providers

#### 1. ZeptoMail (Production)

- Used for production email delivery
- Requires ZeptoMail API key
- Supports SMTP protocol

#### 2. Development (Testing)

- Logs emails to console instead of sending
- Perfect for local development and testing
- No credentials required

## Available Email Templates

### 1. Welcome Email

Sent after successful registration.

```javascript
await emailService.sendWelcomeEmail('user@example.com', {
  name: 'John Doe',
  email: 'user@example.com',
  loginUrl: 'https://expenser.site'
});
```

### 2. Email Verification

Sent when user needs to verify their email address.

```javascript
await emailService.sendEmailVerification('user@example.com', {
  name: 'John Doe',
  verificationUrl: 'https://expenser.site/verify?token=...',
  verificationCode: '123456',
  expiresIn: '24 hours'
});
```

### 3. Getting Started

Sent after welcome email to help users get started.

```javascript
await emailService.sendGettingStartedEmail('user@example.com', {
  name: 'John Doe'
});
```

### 4. OTP Verification

Sent when user requests an OTP for sensitive operations.

```javascript
await emailService.sendOTPVerification('user@example.com', {
  name: 'John Doe',
  otp: '123456',
  expiresIn: '10 minutes',
  purpose: 'login' // or 'verification', 'password-reset', etc.
});
```

### 5. OTP Expiration

Sent when an OTP expires without being used.

```javascript
await emailService.sendOTPExpiration('user@example.com', {
  name: 'John Doe',
  purpose: 'login',
  requestNewUrl: 'https://expenser.site/request-otp'
});
```

### 6. Forgot Password

Sent when user requests password reset.

```javascript
await emailService.sendForgotPasswordEmail('user@example.com', {
  name: 'John Doe',
  resetUrl: 'https://expenser.site/reset?token=...',
  expiresIn: '1 hour'
});
```

### 7. Reset Password (Confirmation)

Sent after password has been successfully reset.

```javascript
await emailService.sendResetPasswordEmail('user@example.com', {
  name: 'John Doe',
  loginUrl: 'https://expenser.site',
  resetTime: new Date().toLocaleString()
});
```

### 8. Password Changed

Sent when password is changed from account settings.

```javascript
await emailService.sendPasswordChangedEmail('user@example.com', {
  name: 'John Doe',
  changeTime: new Date().toLocaleString(),
  ipAddress: '192.168.1.1',
  device: 'Chrome on Windows'
});
```

### 9. Account Deletion

Sent when user account is deleted.

```javascript
// Immediate deletion
await emailService.sendAccountDeletionEmail('user@example.com', {
  name: 'John Doe',
  email: 'user@example.com',
  isImmediate: true
});

// Scheduled deletion
await emailService.sendAccountDeletionEmail('user@example.com', {
  name: 'John Doe',
  email: 'user@example.com',
  deletionDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
  cancelUrl: 'https://expenser.site/cancel-deletion',
  isImmediate: false
});
```

### 10. Data Export

Sent when user's data export is ready for download.

```javascript
await emailService.sendDataExportEmail('user@example.com', {
  name: 'John Doe',
  downloadUrl: 'https://expenser.site/download/...',
  expiresIn: '7 days',
  fileSize: '2.5 MB',
  recordCount: 1234,
  exportDate: new Date().toLocaleDateString()
});
```

## Usage in Controllers

The email service is already integrated into `authController.js`:

```javascript
import emailService from '../services/email/index.js';

// Send email (non-blocking)
emailService
  .sendWelcomeEmail(user.email, {
    name: user.name,
    email: user.email
  })
  .catch(error => {
    logger.logError(error, null, {
      context: 'send-welcome-email',
      userId: user.id
    });
  });
```

## Adding New Email Providers

1. Create a new provider class extending `BaseEmailProvider`:

```javascript
// src/services/email/NewProvider.js
import BaseEmailProvider from './BaseEmailProvider.js';

class NewProvider extends BaseEmailProvider {
  async sendEmail(options) {
    // Implementation
  }

  async verifyConnection() {
    // Implementation
  }

  getProviderName() {
    return 'NewProvider';
  }
}

export default NewProvider;
```

2. Register it in `EmailProviderFactory.js`:

```javascript
import NewProvider from './NewProvider.js';

// In createProvider method
case 'NEWPROVIDER':
  return new NewProvider(config);
```

3. Update environment variables:

```bash
EMAIL_PROVIDER=NEWPROVIDER
```

## Creating Custom Templates

1. Create a new template file in `src/services/email/templates/`:

```javascript
import {
  createHeader,
  createFooter,
  createButton,
  createList
} from './emailTemplateUtils.js';

const customTemplate = data => {
  const { name, customData } = data;

  return {
    subject: 'Custom Email Subject',
    text: `${createHeader('Custom Email')}

Hello ${name},

Your custom content here...

${createButton('Call to Action', 'https://expenser.site')}

${createFooter()}`
  };
};

export default customTemplate;
```

2. Export it in `templates/index.js`:

```javascript
import customTemplate from './customTemplate.js';

export {
  // ... other templates
  customTemplate
};
```

3. Add a method in `EmailService.js`:

```javascript
async sendCustomEmail(to, data) {
  await this.ensureInitialized();
  const template = customTemplate(data);
  return this.provider.sendEmail({
    to,
    subject: template.subject,
    text: template.text
  });
}
```

## Testing

### Development Mode

Set `EMAIL_PROVIDER=DEVELOPMENT` in your `.env` file. Emails will be logged to
console.

### Testing Emails

Use the test suite to verify email integration:

```bash
npm run test:auth
```

## Security Best Practices

1. **Never expose sensitive data** in emails (passwords, tokens in plain text)
2. **Use HTTPS** for all links in emails
3. **Validate email addresses** before sending
4. **Rate limit** email sending to prevent abuse
5. **Log all email activities** for audit trails
6. **Use secure SMTP** connections (TLS/SSL)

## Troubleshooting

### Emails Not Sending

1. Check EMAIL_PROVIDER environment variable
2. Verify ZeptoMail credentials
3. Check server logs for errors
4. Verify network connectivity to SMTP server

### Emails in Spam

1. Configure SPF, DKIM, and DMARC records
2. Use a verified sender domain
3. Avoid spam trigger words in templates
4. Maintain good sender reputation

## Design Philosophy

The email templates follow these principles:

- **Text-based**: Simple ASCII art for universal compatibility
- **Theme-aligned**: Colors inspired by expense-manager-app design
- **Accessible**: Clear, readable content with proper structure
- **Informative**: Comprehensive information without overwhelming
- **Actionable**: Clear calls-to-action with proper context
- **Secure**: Security tips and warnings where appropriate

## Future Enhancements

- [ ] HTML email templates with inline CSS
- [ ] Email template previews in browser
- [ ] A/B testing for email templates
- [ ] Email analytics and tracking
- [ ] Localization support
- [ ] Scheduled email sending
- [ ] Email queue with retry logic
- [ ] Attachment support

## License

MIT License - See LICENSE file for details
