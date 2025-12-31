/**
 * Account Deletion Email Template
 * Sent when user account is scheduled for deletion or deleted
 */
import {
  createHeader,
  createFooter,
  createButton,
  createWarningBox,
  createInfoBox,
  createList,
  createDivider
} from './emailTemplateUtils.js';

const accountDeletionTemplate = (data) => {
  const { name, email, deletionDate, cancelUrl, isImmediate = false } = data;
  const appUrl = cancelUrl || process.env.FRONTEND_URL || 'https://expenser.site';

  if (isImmediate) {
    return {
      subject: '👋 Your Expenser Account Has Been Deleted',
      text: `${createHeader('Account Deleted')}

Hello ${name},

Your Expenser account (${email}) has been permanently deleted as requested.

${createDivider()}

What's been deleted:

${createList([
        'All your expenses and transactions',
        'Your categories and customizations',
        'Your profile and settings',
        'All associated data and analytics'
      ])}

${createWarningBox('This action cannot be undone. All your data has been permanently removed from our systems.')}

${createDivider()}

We're sorry to see you go! 😢

If you have a moment, we'd love to hear why you decided to leave. Your feedback helps us improve Expenser for everyone.

${createList([
        'Send feedback: contact@expenser.site',
        'Rate your experience: feedback.expenser.site'
      ])}

${createDivider()}

Want to come back?

If you change your mind, you can always create a new account:

${createButton('Create New Account', `${appUrl}/register`)}

Note: You'll need to start fresh as all previous data has been deleted.

${createDivider()}

Thank you for using Expenser. We hope our paths cross again in the future!

Best wishes,
The Expenser Team

${createFooter()}`
    };
  }

  // Scheduled deletion
  const deletionDateFormatted = new Date(deletionDate).toLocaleDateString('en-US', {
    dateStyle: 'full'
  });

  return {
    subject: '⚠️ Your Expenser Account Will Be Deleted',
    text: `${createHeader('Account Deletion Scheduled')}

Hello ${name},

We received a request to delete your Expenser account (${email}).

${createWarningBox(`Your account is scheduled for deletion on ${deletionDateFormatted}`)}

${createDivider()}

What will be deleted:

${createList([
      'All your expenses and transactions',
      'Your categories and customizations',
      'Your profile and settings',
      'All associated data and analytics',
      'Your account login credentials'
    ])}

${createInfoBox(`You have until ${deletionDateFormatted} to cancel this deletion.`)}

${createDivider()}

Changed your mind?

If you want to keep your account, you can cancel the deletion:

${createButton('Cancel Account Deletion', cancelUrl)}

${createDivider()}

If you didn't request this deletion:

${createList([
      'Cancel the deletion immediately using the link above',
      'Change your password to secure your account',
      'Contact our support team: contact@expenser.site'
    ])}

${createDivider()}

Why are you leaving?

We'd love to know how we can improve. If you have a moment, please share your feedback:

${createList([
      'Email us: contact@expenser.site',
      'Quick survey: feedback.expenser.site'
    ])}

${createDivider()}

Thank you for using Expenser. We're sorry to see you go!

Best regards,
The Expenser Team

${createFooter()}`
  };
};

export default accountDeletionTemplate;
