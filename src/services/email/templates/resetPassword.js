/**
 * Reset Password Confirmation Email Template
 * Sent after password has been successfully reset
 */
import {
  createHeader,
  createFooter,
  createButton,
  createSuccessBox,
  createWarningBox,
  createList,
  createDivider
} from './emailTemplateUtils.js';

const resetPasswordTemplate = (data) => {
  const { name, loginUrl, resetTime } = data;
  const appUrl = loginUrl || process.env.FRONTEND_URL || 'https://expenser.site';
  const timestamp = resetTime || new Date().toLocaleString('en-US', {
    dateStyle: 'full',
    timeStyle: 'short'
  });

  return {
    subject: '✅ Your Password Has Been Reset - Expenser',
    text: `${createHeader('Password Successfully Reset')}

Hello ${name},

${createSuccessBox('Your password has been successfully reset!')}

Your Expenser account password was changed on ${timestamp}.

You can now log in to your account using your new password.

${createButton('Log In to Your Account', appUrl)}

${createDivider()}

${createWarningBox('If you didn\'t make this change, please contact our support team immediately!')}

${createDivider()}

Account Security Recommendations:

${createList([
      'Use a unique password that you don\'t use elsewhere',
      'Make your password at least 8 characters long',
      'Include a mix of letters, numbers, and symbols',
      'Don\'t share your password with anyone',
      'Change your password regularly for better security',
      'Enable two-factor authentication if available'
    ])}

${createDivider()}

If you notice any suspicious activity on your account or if you didn't authorize this password reset, please:

${createList([
      'Contact our support team immediately: contact@expenser.site',
      'Change your password again as a precaution',
      'Review your recent account activity',
      'Check that your email account is secure'
    ])}

${createDivider()}

Your account security is our top priority. If you have any questions or concerns, don't hesitate to reach out.

Best regards,
The Expenser Team

${createFooter()}`
  };
};

export default resetPasswordTemplate;
