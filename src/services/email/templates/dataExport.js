/**
 * Data Export Email Template
 * Sent when user's data export is ready for download
 */
import {
  createHeader,
  createFooter,
  createButton,
  createSuccessBox,
  createInfoBox,
  createList,
  createDivider
} from './emailTemplateUtils.js';

const dataExportTemplate = (data) => {
  const {
    name,
    downloadUrl,
    expiresIn = '7 days',
    fileSize,
    recordCount,
    exportDate
  } = data;

  const timestamp = exportDate || new Date().toLocaleDateString('en-US', {
    dateStyle: 'full'
  });

  return {
    subject: '📦 Your Expenser Data Export is Ready!',
    text: `${createHeader('Data Export Ready')}

Hello ${name},

${createSuccessBox('Your data export has been completed and is ready for download!')}

We've compiled all your Expenser data as requested. Your export is now available for download.

${createDivider()}

Export Details:

${createList([
      `Generated: ${timestamp}`,
      fileSize ? `File Size: ${fileSize}` : null,
      recordCount ? `Total Records: ${recordCount.toLocaleString()}` : null,
      `Valid For: ${expiresIn}`
    ].filter(Boolean))}

${createInfoBox(`This download link will expire in ${expiresIn} for security reasons.`)}

${createButton('Download Your Data', downloadUrl)}

${createDivider()}

If the button doesn't work, copy and paste this link into your browser:

${downloadUrl}

${createDivider()}

What's included in your export:

${createList([
      'All your expenses and transactions',
      'Categories and customizations',
      'Profile information',
      'Account settings and preferences',
      'Analytics and spending patterns'
    ])}

${createDivider()}

File Format Information:

Your data is exported in JSON format for easy parsing and analysis. The export includes:

${createList([
      'Structured data that is easy to read',
      'All dates in ISO 8601 format',
      'Currency amounts in original currencies',
      'Complete transaction history',
      'Metadata and relationships preserved'
    ])}

${createDivider()}

Security & Privacy:

${createList([
      'The download link is unique and encrypted',
      'Only you can access this export',
      `The link expires after ${expiresIn}`,
      'Downloaded files should be stored securely',
      'Delete the export when no longer needed'
    ])}

${createDivider()}

Need help?

${createList([
      'Questions about your export? Contact: contact@expenser.site',
      'Technical support: support@expenser.site',
      'Privacy concerns: privacy@expenser.site'
    ])}

${createDivider()}

Thank you for using Expenser to manage your finances!

Best regards,
The Expenser Team

${createFooter()}`
  };
};

export default dataExportTemplate;
