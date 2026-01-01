/**
 * Welcome Email Template (HTML Version)
 * Sent after successful registration
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

const welcomeEmailTemplate = (data) => {
  const { name, loginUrl } = data;
  const appUrl = loginUrl || process.env.FRONTEND_URL || 'https://app.expenser.site/dashboard';

  const content = createContent(`
    ${createParagraph(`Hello <strong>${name}</strong>! 👋`)}
    
    ${createSuccessBox('Welcome to Expenser! Your account has been created successfully.')}
    
    ${createParagraph('We\'re excited to help you take control of your expenses and achieve your financial goals.')}
    
    ${createDivider()}
    
    ${createButton('Get Started Now', appUrl)}
    
    ${createDivider()}
    
    ${createParagraph('Start by adding your first expense, organizing with categories, and exploring your analytics dashboard.')}
    
    ${createParagraph('Happy tracking! 💰')}
    
    ${createParagraph('Best regards,<br>The Expenser Team')}
  `);

  const html = createEmailWrapper(`
    ${createHeader('Welcome to Expenser!')}
    ${content}
    ${createFooter()}
  `);

  return {
    subject: '🎉 Welcome to Expenser - Let\'s Start Managing Your Finances!',
    html,
    text: `Welcome to Expenser!\n\nHello ${name}! Your account has been created successfully. Visit ${appUrl} to get started.`
  };
};

export default welcomeEmailTemplate;
