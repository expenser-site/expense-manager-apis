/**
 * Password Changed Confirmation Email Template (HTML Version)
 * Sent after successful password change
 */
import {
  createEmailWrapper,
  createHeader,
  createFooter,
  createButton,
  createSuccessBox,
  createWarningBox,
  createDivider,
  createContent,
  createParagraph
} from './emailTemplateUtils.js';

const passwordChangedTemplate = (data) => {
  const { name, changedAt, loginUrl } = data;
  const appUrl = loginUrl || process.env.FRONTEND_URL || 'https://app.expenser.site/login';
  const supportEmail = 'support@expenser.site';

  const changeTime = new Date(changedAt).toLocaleString('en-US', {
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
    
    ${createSuccessBox('Your password has been changed successfully!')}
    
    ${createParagraph(`Changed at: <strong>${changeTime}</strong>`)}
    
    ${createWarningBox(`If you didn't make this change, please contact support immediately at <a href="mailto:${supportEmail}" style="color: #ef4444; text-decoration: none;">${supportEmail}</a>`)}
    
    ${createDivider()}
    
    ${createButton('Log In to Expenser', appUrl)}
    
    ${createDivider()}
    
    ${createParagraph('Best regards,<br>The Expenser Team')}
  `);

  const html = createEmailWrapper(`
    ${createHeader('Password Changed Successfully')}
    ${content}
    ${createFooter()}
  `);

  return {
    subject: '🔐 Your Expenser Password Has Been Changed',
    html,
    text: `Hello ${name},\n\nYour password was changed at ${changeTime}. If you didn't make this change, contact support immediately.`
  };
};

export default passwordChangedTemplate;
