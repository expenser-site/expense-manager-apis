/**
 * Welcome Email Template
 * Sent after successful registration
 */
import {
  createHeader,
  createFooter,
  createButton,
  createSuccessBox,
  createList,
  createDivider
} from './emailTemplateUtils.js';

const welcomeEmailTemplate = (data) => {
  const { name, email, loginUrl } = data;
  const appUrl = loginUrl || process.env.FRONTEND_URL || 'https://expenser.site';

  return {
    subject: '🎉 Welcome to Expenser - Let\'s Start Managing Your Finances!',
    text: `${createHeader('Welcome to Expenser!')}

Hello ${name}! 👋

${createSuccessBox('Your account has been created successfully!')}

Thank you for joining Expenser, your personal finance companion. We're excited to help you take control of your expenses and achieve your financial goals.

Your Account Details:
${createList([
      `Email: ${email}`,
      `Account Created: ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}`
    ])}

${createDivider()}

🚀 What's Next?

Get started with these simple steps:

${createList([
      'Log in to your account and explore the dashboard',
      'Set up your expense categories (or use our defaults)',
      'Add your first expense to get started',
      'Explore reports and insights to track your spending',
      'Set budgets to stay on top of your finances'
    ])}

${createButton('Get Started Now', appUrl)}

${createDivider()}

💡 Quick Tips:

${createList([
      'Add expenses regularly to get accurate insights',
      'Use categories to organize your spending',
      'Check your analytics to identify spending patterns',
      'Set realistic budgets and track your progress',
      'Use filters to find specific expenses quickly'
    ])}

${createDivider()}

We're here to make expense management simple and effective. If you have any questions or need help getting started, don't hesitate to reach out to our support team.

Happy tracking! 💰

Best regards,
The Expenser Team

${createFooter()}`
  };
};

export default welcomeEmailTemplate;
