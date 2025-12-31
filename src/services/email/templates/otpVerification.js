/**
 * OTP Verification Email Template
 * Sent when user requests an OTP for sensitive operations
 */
import {
  createHeader,
  createFooter,
  createCodeBlock,
  createWarningBox,
  createInfoBox,
  createList,
  createDivider
} from './emailTemplateUtils.js';

const otpVerificationTemplate = (data) => {
  const { name, otp, expiresIn = '10 minutes', purpose = 'verification' } = data;

  const purposeMessages = {
    verification: 'verify your identity',
    login: 'complete your login',
    'password-reset': 'reset your password',
    'account-deletion': 'delete your account',
    'sensitive-operation': 'complete this sensitive operation'
  };

  const purposeMessage = purposeMessages[purpose] || purposeMessages['verification'];

  return {
    subject: `🔐 Your Expenser Verification Code: ${otp}`,
    text: `${createHeader('One-Time Password (OTP)')}

Hello ${name},

You requested a verification code to ${purposeMessage}.

${createCodeBlock(otp, 'Your OTP')}

${createInfoBox(`This code will expire in ${expiresIn}`)}

${createDivider()}

Security Information:

${createList([
      'Never share this code with anyone',
      'Expenser staff will never ask for your OTP',
      'This code is only valid for one use',
      `It will expire automatically after ${expiresIn}`,
      'If you didn\'t request this code, ignore this email'
    ])}

${createWarningBox('If you didn\'t request this code, please secure your account immediately by changing your password.')}

${createDivider()}

If you're having trouble or didn't request this code, please contact our support team immediately.

Best regards,
The Expenser Team

${createFooter()}`
  };
};

export default otpVerificationTemplate;
