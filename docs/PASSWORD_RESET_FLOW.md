# Password Reset Flow Documentation

## Overview

Complete forgot password and reset password functionality for the Expense
Manager application.

## Architecture

### Database Schema

Added to User model in Prisma schema:

- `resetPasswordToken` (String?, unique): Hashed reset token
- `resetPasswordExpires` (DateTime?): Token expiration timestamp

### Security Features

1. **Token Hashing**: Reset tokens are hashed using SHA-256 before storage
2. **Token Expiration**: Tokens expire after 1 hour
3. **Email Enumeration Protection**: Always returns success message regardless
   of email existence
4. **One-Time Use**: Tokens are cleared after successful password reset
5. **Auth Provider Check**: Only allows password reset for local auth accounts

## API Endpoints

### 1. Forgot Password

**POST** `/api/v1/auth/forgot-password`

**Request Body:**

```json
{
  "email": "user@example.com"
}
```

**Response (200):**

```json
{
  "message": "If an account exists with this email, a password reset link has been sent.",
  "resetToken": "abc123..." // Only in development mode
}
```

**Security Notes:**

- Always returns success message (prevents email enumeration)
- Only works for local auth accounts (not Google OAuth)
- Token is hashed before database storage
- In production, token should be sent via email (currently logged to console)

### 2. Reset Password

**POST** `/api/v1/auth/reset-password`

**Request Body:**

```json
{
  "token": "abc123...",
  "newPassword": "newSecurePassword123"
}
```

**Success Response (200):**

```json
{
  "message": "Password reset successful"
}
```

**Error Response (400):**

```json
{
  "error": "Invalid or expired reset token"
}
```

**Validation:**

- Token must be valid and not expired
- New password minimum 6 characters
- Password is hashed with bcrypt (10 rounds)
- Token is cleared after successful reset

## Mobile App Integration

### Forgot Password Screen

Location: `expense-manager-mobile/app/(auth)/forgot-password.tsx`

**Features:**

- Email validation
- Loading state during API call
- Success alert with confirmation
- Error handling with user-friendly messages
- Auto-redirect to login after success

**Usage:**

1. User enters email
2. App calls `authService.forgotPassword(email)`
3. Success alert shows message
4. User is redirected back to login screen

### Reset Password Screen

Location: `expense-manager-mobile/app/(auth)/reset-password.tsx`

**Features:**

- Token validation from URL query params
- Password strength indicator
- Password match validation
- Minimum 6 character requirement
- Strong password recommendation
- Loading state during API call
- Success redirect to login

**Usage:**

1. User receives reset link (in development, get token from API response)
2. User enters link in browser or deep link opens app
3. Token is extracted from URL query params
4. User enters new password and confirms
5. App calls `authService.resetPassword(token, newPassword)`
6. Success redirects to login screen

## Flow Diagram

```
┌─────────────┐
│ User clicks │
│"Forgot      │
│ Password?"  │
└──────┬──────┘
       │
       ▼
┌─────────────────┐
│Enter email      │
│address          │
└──────┬──────────┘
       │
       ▼
┌─────────────────────────┐
│POST /forgot-password    │
│- Verify user exists     │
│- Check auth provider    │
│- Generate reset token   │
│- Hash token (SHA-256)   │
│- Store in DB with expiry│
│- Send email (TODO)      │
└──────┬──────────────────┘
       │
       ▼
┌─────────────────┐
│User receives    │
│email with link  │
│(Dev: copy token)│
└──────┬──────────┘
       │
       ▼
┌─────────────────────────┐
│Click reset link         │
│Opens reset-password page│
│with ?token=abc123       │
└──────┬──────────────────┘
       │
       ▼
┌─────────────────┐
│Enter new        │
│password (2x)    │
└──────┬──────────┘
       │
       ▼
┌─────────────────────────┐
│POST /reset-password     │
│- Hash token for lookup  │
│- Verify token exists    │
│- Check expiration       │
│- Hash new password      │
│- Update user password   │
│- Clear reset token      │
└──────┬──────────────────┘
       │
       ▼
┌─────────────────┐
│Success!         │
│Login with new   │
│password         │
└─────────────────┘
```

## Testing with Bruno

### Test Forgot Password

1. Open `bruno-api-collection/Auth/Forgot Password.bru`
2. Update email to a valid user email
3. Send request
4. Copy the `resetToken` from response (development only)

### Test Reset Password

1. Open `bruno-api-collection/Auth/Reset Password.bru`
2. Paste the token from previous step
3. Set a new password
4. Send request
5. Try logging in with the new password

## Migration Steps

To apply the database changes:

```bash
cd expense-manager-apis
npx prisma migrate dev --name add_password_reset_tokens
```

This will:

1. Add `resetPasswordToken` and `resetPasswordExpires` columns to User table
2. Create unique index on `resetPasswordToken`
3. Update Prisma Client

## Email Configuration (TODO)

Currently, the reset token is logged to the console. In production, you need to:

### Option 1: SendGrid

```javascript
import sgMail from '@sendgrid/mail';

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

const sendPasswordResetEmail = async (email, resetUrl) => {
  const msg = {
    to: email,
    from: 'noreply@expensemanager.com',
    subject: 'Password Reset Request',
    html: `
      <h1>Reset Your Password</h1>
      <p>Click the link below to reset your password:</p>
      <a href="${resetUrl}">${resetUrl}</a>
      <p>This link will expire in 1 hour.</p>
    `
  };
  await sgMail.send(msg);
};
```

### Option 2: Nodemailer

```javascript
import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  secure: true,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD
  }
});

const sendPasswordResetEmail = async (email, resetUrl) => {
  await transporter.sendMail({
    from: '"Expense Manager" <noreply@expensemanager.com>',
    to: email,
    subject: 'Password Reset Request',
    html: `
      <h1>Reset Your Password</h1>
      <p>Click the link below to reset your password:</p>
      <a href="${resetUrl}">${resetUrl}</a>
      <p>This link will expire in 1 hour.</p>
    `
  });
};
```

### Environment Variables

Add to `.env`:

```env
# SendGrid
SENDGRID_API_KEY=your_sendgrid_api_key

# OR Nodemailer
SMTP_HOST=smtp.gmail.com
SMTP_PORT=465
SMTP_USER=your_email@gmail.com
SMTP_PASSWORD=your_app_password

# Frontend URL for reset links
FRONTEND_URL=http://localhost:8081
```

## Mobile Deep Linking (TODO)

To handle reset password links in the mobile app:

### 1. Configure Deep Links

In `app.json`:

```json
{
  "expo": {
    "scheme": "expenser",
    "ios": {
      "associatedDomains": ["applinks:expensemanager.com"]
    },
    "android": {
      "intentFilters": [
        {
          "action": "VIEW",
          "data": [
            {
              "scheme": "expenser",
              "host": "reset-password"
            }
          ],
          "category": ["BROWSABLE", "DEFAULT"]
        }
      ]
    }
  }
}
```

### 2. Handle Deep Link

The reset link format: `expenser://reset-password?token=abc123`

The app will automatically route to `reset-password.tsx` and extract the token
from query params.

## Security Best Practices

1. **Never expose whether an email exists** - Always return the same success
   message
2. **Use short expiration times** - 1 hour is reasonable for password resets
3. **Hash tokens before storage** - Never store plain text tokens
4. **One-time use only** - Clear token after successful reset
5. **Rate limiting** - Implement rate limiting on forgot password endpoint
   (TODO)
6. **HTTPS only** - Reset links should only work over HTTPS in production
7. **Validate token on every request** - Check existence and expiration

## Error Handling

### Common Errors

1. **Invalid or expired token** - User waited too long or token already used
2. **Email not found** - Handled silently to prevent enumeration
3. **Non-local auth account** - Google OAuth users can't reset password this way
4. **Network errors** - Show user-friendly message to try again

### User Communication

- Always show helpful error messages
- Guide users to request new reset link if expired
- Provide contact support option for persistent issues

## Testing Checklist

- [ ] Forgot password with valid email
- [ ] Forgot password with non-existent email (should still show success)
- [ ] Forgot password with Google OAuth account (should show success but not
      send)
- [ ] Reset password with valid token
- [ ] Reset password with expired token (wait 1 hour)
- [ ] Reset password with already used token
- [ ] Reset password with invalid token
- [ ] Password validation (minimum length, strength)
- [ ] Login with new password after reset
- [ ] Token cleared from database after successful reset

## Future Enhancements

1. **Rate Limiting** - Prevent abuse by limiting requests per IP/email
2. **Email Templates** - Professional HTML email templates
3. **Multi-language Support** - Localized reset emails
4. **SMS Option** - Alternative to email for password reset
5. **Security Questions** - Additional verification layer
6. **Account Recovery** - Alternative methods if email is inaccessible
7. **Password History** - Prevent reuse of recent passwords
8. **Notification Email** - Notify user after successful password change
