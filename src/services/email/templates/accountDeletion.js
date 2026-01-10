/**
 * Account Deletion Email Template (HTML Version)
 * Sent when user's account is scheduled for deletion
 */
import {
  createEmailWrapper,
  createHeader,
  createFooter,
  createButton,
  createErrorBox,
  createWarningBox,
  createDivider,
  createContent,
  createParagraph
} from './emailTemplateUtils.js';

const accountDeletionTemplate = data => {
  const { name, deletionDate, cancelUrl, daysUntilDeletion = 30 } = data;
  const appUrl = cancelUrl || process.env.FRONTEND_URL || 'https://app.expenser.site/dashboard';

  const formattedDate = new Date(deletionDate).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  const content = createContent(`
    ${createParagraph(`Hello <strong>${name}</strong>,`)}
    
    ${createErrorBox('Your account is scheduled for deletion.')}
    
    ${createParagraph(`<strong>Deletion Date:</strong> ${formattedDate}`)}
    
    ${createWarningBox('All your data will be permanently deleted. This cannot be undone.')}
    
    ${createParagraph(`Changed your mind? You have <strong>${daysUntilDeletion} days</strong> to cancel:`)}
    
    ${createDivider()}
    
    ${createButton('Cancel Deletion', appUrl, 'success')}
    
    ${createDivider()}
    
    ${createParagraph('Thank you for using Expenser.')}
    
    ${createParagraph('Best regards,<br>The Expenser Team')}
  `);

  const html = createEmailWrapper(`
    ${createHeader('Account Deletion Scheduled')}
    ${content}
    ${createFooter()}
  `);

  return {
    subject: '⚠️ Your Expenser Account Will Be Deleted',
    html,
    text: `Hello ${name},\n\nYour account will be deleted on ${formattedDate}. To cancel, visit ${appUrl}`
  };
};

export default accountDeletionTemplate;
