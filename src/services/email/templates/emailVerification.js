/**
 * Email Verification Template
 * Sent when user needs to verify their email address
 */
import {
  createHeader,
  createFooter,
  createButton,
  createInfoBox,
  createWarningBox,
  createList,
  createDivider
} from './emailTemplateUtils.js';

const emailVerificationTemplate = (data) => {
  const { name, verificationUrl, verificationCode, expiresIn = '24 hours' } = data;

  return {
    subject: '📧 Verify Your Email Address - Expenser',
    text: `${createHeader('Email Verification Required')}

Hello ${name},

Thank you for signing up for Expenser! To complete your registration and start managing your finances, please verify your email address.

${createInfoBox(`This verification link is valid for ${expiresIn}`)}

${createButton('Verify Email Address', verificationUrl)}

${createDivider()}

Alternatively, you can use this verification code:

  Verification Code: ${verificationCode}

${createDivider()}

Why verify your email?

${createList([
      'Ensures account security and ownership',
      'Enables password recovery features',
      'Allows us to send you important notifications',
      'Helps prevent unauthorized access'
    ])}

${createWarningBox(`This link will expire in ${expiresIn}. If it expires, you can request a new verification email.`)}

${createDivider()}

If you didn't create an account with Expenser, please ignore this email or contact our support team if you have concerns.

Best regards,
The Expenser Team

${createFooter()}`
  };
};

export default emailVerificationTemplate;
