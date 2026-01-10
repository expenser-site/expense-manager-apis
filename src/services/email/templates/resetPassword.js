/**
 * Reset Password Success Email Template (HTML Version)
 * Sent after successful password reset
 */
import {
  createEmailWrapper,
  createHeader,
  createFooter,
  createButton,
  createSuccessBox,
  createDivider,
  createContent,
  createParagraph
} from './emailTemplateUtils.js';

const resetPasswordTemplate = data => {
  const { name, loginUrl } = data;
  const appUrl = loginUrl || process.env.FRONTEND_URL || 'https://app.expenser.site/login';
  const supportEmail = 'support@expenser.site';
  const resetTime = new Date().toLocaleString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZoneName: 'short'
  });

  const content = createContent(`
    ${createParagraph(`Hello <strong>${name}</strong>,`)}
    
    ${createSuccessBox('Your password has been reset successfully!')}
    
    ${createParagraph('You can now log in with your new password.')}
    
    ${createDivider()}
    
    ${createButton('Log In to Expenser', appUrl, 'success')}
    
    ${createDivider()}
    
    ${createParagraph(`If you didn't reset your password, please contact support immediately at <a href="mailto:${supportEmail}" style="color: #ef4444; text-decoration: none;">${supportEmail}</a>`)}
    
    ${createParagraph('Best regards,<br>The Expenser Team')}
  `);

  const html = createEmailWrapper(`
    ${createHeader('Password Reset Successful')}
    ${content}
    ${createFooter()}
  `);

  return {
    subject: '✅ Your Expenser Password Has Been Reset',
    html,
    text: `Hello ${name},\n\nYour password was successfully reset at ${resetTime}. You can now log in at ${appUrl}`
  };
};

export default resetPasswordTemplate;
