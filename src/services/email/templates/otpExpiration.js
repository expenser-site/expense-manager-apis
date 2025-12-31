/**
 * OTP Expiration Email Template
 * Sent when an OTP expires without being used
 */
import {
  createHeader,
  createFooter,
  createButton,
  createWarningBox,
  createList,
  createDivider
} from './emailTemplateUtils.js';

const otpExpirationTemplate = (data) => {
  const { name, purpose = 'verification', requestNewUrl } = data;
  const appUrl = requestNewUrl || process.env.FRONTEND_URL || 'https://expenser.site';

  const purposeMessages = {
    verification: 'email verification',
    login: 'login attempt',
    'password-reset': 'password reset',
    'account-deletion': 'account deletion',
    'sensitive-operation': 'sensitive operation'
  };

  const purposeMessage = purposeMessages[purpose] || purposeMessages['verification'];

  return {
    subject: '⏱️ Your Verification Code Has Expired - Expenser',
    text: `${createHeader('Verification Code Expired')}

Hello ${name},

${createWarningBox(`Your verification code for ${purposeMessage} has expired without being used.`)}

For security reasons, verification codes are only valid for a limited time. Your code has now expired and can no longer be used.

${createDivider()}

What to do next:

${createList([
      'Request a new verification code',
      'Complete the verification within the time limit',
      'Contact support if you need assistance'
    ])}

${createButton('Request New Code', appUrl)}

${createDivider()}

Security Tips:

${createList([
      'Complete verification as soon as you receive the code',
      'Check your spam folder if you don\'t see our emails',
      'Make sure you have a stable internet connection',
      'Never share your verification codes with anyone',
      'Contact support if you repeatedly don\'t receive codes'
    ])}

${createDivider()}

If you didn't initiate this ${purposeMessage}, you can safely ignore this email. However, if you're experiencing repeated unauthorized attempts, please contact our support team immediately.

Best regards,
The Expenser Team

${createFooter()}`
  };
};

export default otpExpirationTemplate;
