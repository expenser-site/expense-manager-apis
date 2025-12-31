/**
 * Forgot Password Email Template
 * Sent when user requests password reset
 */
import {
  createHeader,
  createFooter,
  createButton,
  createWarningBox,
  createInfoBox,
  createList,
  createDivider
} from './emailTemplateUtils.js';

const forgotPasswordTemplate = (data) => {
  const { name, resetUrl, expiresIn = '1 hour' } = data;

  return {
    subject: '🔑 Password Reset Request - Expenser',
    text: `${createHeader('Password Reset Request')}

Hello ${name},

We received a request to reset your password for your Expenser account.

${createInfoBox(`This password reset link is valid for ${expiresIn}`)}

${createButton('Reset Your Password', resetUrl)}

${createDivider()}

If the button doesn't work, copy and paste this link into your browser:

${resetUrl}

${createDivider()}

${createWarningBox('If you didn\'t request a password reset, please ignore this email. Your password will remain unchanged.')}

${createDivider()}

Security Tips:

${createList([
      'Never share your password reset link with anyone',
      'This link can only be used once',
      `It will expire automatically after ${expiresIn}`,
      'If you suspect unauthorized access, contact support immediately',
      'Choose a strong, unique password for your account'
    ])}

${createDivider()}

If you're having trouble or have security concerns, please contact our support team.

Best regards,
The Expenser Team

${createFooter()}`
  };
};

export default forgotPasswordTemplate;
