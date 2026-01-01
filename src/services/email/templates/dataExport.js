/**
 * Data Export Email Template (HTML Version)
 * Sent when user's data export is ready for download
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

const dataExportTemplate = (data) => {
  const { name, downloadUrl, expiryHours = 48 } = data;

  const content = createContent(`
    ${createParagraph(`Hello <strong>${name}</strong>,`)}
    
    ${createSuccessBox('Your data export is ready!')}
    
    ${createDivider()}
    
    ${createButton('Download Your Data', downloadUrl, 'success')}
    
    ${createDivider()}
    
    ${createWarningBox(`This link expires in <strong>${expiryHours} hours</strong>.`)}
    
    ${createParagraph('Your export includes all expenses, categories, and account settings in JSON format.')}
    
    ${createParagraph('Best regards,<br>The Expenser Team')}
  `);

  const html = createEmailWrapper(`
    ${createHeader('Your Data Export is Ready')}
    ${content}
    ${createFooter()}
  `);

  return {
    subject: '📦 Your Expenser Data Export is Ready to Download',
    html,
    text: `Hello ${name},\n\nYour data export is ready. Download it here: ${downloadUrl}\n\nThis link expires in ${expiryHours} hours.`
  };
};

export default dataExportTemplate;
