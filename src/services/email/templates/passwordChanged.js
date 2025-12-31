/**
 * Password Changed Email Template
 * Sent when password is changed from account settings
 */
import {
  createHeader,
  createFooter,
  createSuccessBox,
  createWarningBox,
  createList,
  createDivider
} from './emailTemplateUtils.js';

const passwordChangedTemplate = (data) => {
  const { name, changeTime, ipAddress, device } = data;
  const timestamp = changeTime || new Date().toLocaleString('en-US', {
    dateStyle: 'full',
    timeStyle: 'short'
  });

  return {
    subject: '🔐 Password Changed Successfully - Expenser',
    text: `${createHeader('Password Changed')}

Hello ${name},

${createSuccessBox('Your account password has been changed successfully!')}

This is a confirmation that your Expenser account password was changed on ${timestamp}.

${createDivider()}

Change Details:

${createList([
      `Time: ${timestamp}`,
      ipAddress ? `IP Address: ${ipAddress}` : null,
      device ? `Device: ${device}` : null
    ].filter(Boolean))}

${createDivider()}

${createWarningBox('If you didn\'t make this change, your account may have been compromised!')}

If you did NOT change your password:

${createList([
      '1. Contact our support team immediately: contact@expenser.site',
      '2. Try to log in and change your password',
      '3. Check your email account for unauthorized access',
      '4. Review your recent account activity'
    ])}

${createDivider()}

Account Security Best Practices:

${createList([
      'Use a strong, unique password for each account',
      'Enable two-factor authentication when available',
      'Never share your password with anyone',
      'Be cautious of phishing emails and suspicious links',
      'Regularly review your account activity',
      'Keep your email account secure',
      'Use a password manager to track your passwords'
    ])}

${createDivider()}

Your security is important to us. If you have any concerns about your account, please don't hesitate to contact our support team.

Best regards,
The Expenser Team

${createFooter()}`
  };
};

export default passwordChangedTemplate;
