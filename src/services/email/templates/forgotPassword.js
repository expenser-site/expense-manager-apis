/**
 * Forgot Password Email Template (HTML Version)
 * Sent when user requests password reset
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

const forgotPasswordTemplate = data => {
  // eslint-disable-next-line no-unused-vars
  const { name, resetUrl, resetToken, expiryMinutes = 15 } = data;

  const content = createContent(`
    ${createParagraph(`Hello <strong>${name}</strong>,`)}
    
    ${createParagraph('We received a request to reset your password. Click the button below to create a new password:')}
    
    ${createDivider()}
    
    ${createButton('Reset Password', resetUrl)}
    
    ${createDivider()}
    
    ${createWarningBox(`This link expires in <strong>${expiryMinutes} minutes</strong>.`)}
    
    ${createParagraph('If you didn\'t request this, please ignore this email.')}
    
    ${createParagraph('Best regards,<br>The Expenser Team')}
  `);

  const html = createEmailWrapper(`
    ${createHeader('Password Reset Request')}
    ${content}
    ${createFooter()}
  `);

  return {
    subject: '🔐 Reset Your Expenser Password',
    html,
    text: `Hello ${name},\n\nYou requested to reset your password. Click this link: ${resetUrl}\n\nThis link expires in ${expiryMinutes} minutes.`
  };
};

export default forgotPasswordTemplate;
