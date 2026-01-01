/**
 * OTP Expiration Email Template (HTML Version)
 * Sent when user's OTP has expired
 */
import {
  createEmailWrapper,
  createHeader,
  createFooter,
  createButton,
  createWarningBox,
  createDivider,
  createContent,
  createParagraph
} from './emailTemplateUtils.js';

const otpExpirationTemplate = (data) => {
  const { name, requestNewOtpUrl } = data;
  const appUrl = requestNewOtpUrl || process.env.FRONTEND_URL || 'https://app.expenser.site/login';

  const content = createContent(`
    ${createParagraph(`Hello <strong>${name}</strong>,`)}
    
    ${createWarningBox('Your verification code has expired.')}
    
    ${createParagraph('Request a new code to continue:')}
    
    ${createDivider()}
    
    ${createButton('Request New Code', appUrl)}
    
    ${createDivider()}
    
    ${createParagraph('Best regards,<br>The Expenser Team')}
  `);

  const html = createEmailWrapper(`
    ${createHeader('OTP Code Expired')}
    ${content}
    ${createFooter()}
  `);

  return {
    subject: '⏰ Your Expenser OTP Has Expired',
    html,
    text: `Hello ${name},\n\nYour OTP has expired. Request a new one at ${appUrl}`
  };
};

export default otpExpirationTemplate;
