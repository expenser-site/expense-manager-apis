/**
 * Getting Started Email Template (HTML Version)
 * Sent to help new users get started with the platform
 */
import {
  createEmailWrapper,
  createHeader,
  createFooter,
  createButton,
  createSuccessBox,
  createList,
  createDivider,
  createContent,
  createParagraph
} from './emailTemplateUtils.js';

const gettingStartedTemplate = data => {
  const { name, dashboardUrl } = data;
  const appUrl = dashboardUrl || process.env.FRONTEND_URL || 'https://app.expenser.site/dashboard';
  const supportEmail = 'support@expenser.site';

  const content = createContent(`
    ${createParagraph(`Hello <strong>${name}</strong>,`)}
    
    ${createSuccessBox("Welcome to Expenser! Let's get you started.")}
    
    ${createParagraph("Here's how to make the most of Expenser:")}
    
    ${createList([
      '<strong>Add expenses</strong> - Track your spending as it happens',
      '<strong>Use categories</strong> - Organize expenses your way',
      '<strong>View analytics</strong> - See your spending patterns',
      '<strong>Set budgets</strong> - Stay on track with your goals'
    ])}
    
    ${createDivider()}
    
    ${createButton('Go to Dashboard', appUrl)}
    
    ${createDivider()}
    
    ${createParagraph(`Need help? Contact us at <a href="mailto:${supportEmail}" style="color: #3b82f6; text-decoration: none;">${supportEmail}</a>`)}
  `);

  const html = createEmailWrapper(`
    ${createHeader('Getting Started with Expenser')}
    ${content}
    ${createFooter()}
  `);

  return {
    subject: '🎯 Get Started with Expenser - Your Quick Start Guide',
    html,
    text: `Hello ${name},\n\nWelcome to Expenser! Visit ${appUrl} to get started with managing your expenses.`
  };
};

export default gettingStartedTemplate;
