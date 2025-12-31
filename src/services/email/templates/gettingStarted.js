/**
 * Getting Started Email Template
 * Sent after welcome email to help users get started
 */
import {
  createHeader,
  createFooter,
  createButton,
  createList,
  createDivider
} from './emailTemplateUtils.js';

const gettingStartedEmailTemplate = (data) => {
  const { name } = data;
  const appUrl = process.env.FRONTEND_URL || 'https://expenser.site';
  const helpUrl = `${appUrl}/help`;
  const tutorialsUrl = `${appUrl}/tutorials`;

  return {
    subject: '🚀 Getting Started with Expenser - Your Quick Start Guide',
    text: `${createHeader('Your Quick Start Guide')}

Hello ${name},

Welcome aboard! We wanted to share some tips to help you get the most out of Expenser from day one.

${createDivider()}

📊 Step 1: Set Up Your Categories

Categories help you organize and understand your spending:

${createList([
      'We\'ve created default categories for you (Food, Transport, etc.)',
      'Customize them to match your lifestyle',
      'Add custom icons and colors for easy recognition',
      'Create as many categories as you need'
    ])}

${createDivider()}

💸 Step 2: Add Your Expenses

Start tracking your spending:

${createList([
      'Click "Add Expense" from your dashboard',
      'Enter amount, category, and description',
      'Add the date (defaults to today)',
      'Save and see your expense appear instantly'
    ])}

${createDivider()}

📈 Step 3: Analyze Your Spending

Understand where your money goes:

${createList([
      'View your dashboard for quick insights',
      'Check category breakdowns with visual charts',
      'Filter expenses by date range',
      'Export data for further analysis'
    ])}

${createDivider()}

🎯 Step 4: Set Goals & Budgets

Take control of your finances:

${createList([
      'Set monthly budgets per category',
      'Track your progress in real-time',
      'Get notified when approaching limits',
      'Adjust budgets based on your patterns'
    ])}

${createButton('Start Tracking Now', appUrl)}

${createDivider()}

📚 Resources to Help You:

${createList([
      `Help Center: ${helpUrl}`,
      `Video Tutorials: ${tutorialsUrl}`,
      'Support: contact@expenser.site',
      'Tips & Best Practices: blog.expenser.site'
    ])}

${createDivider()}

💡 Pro Tips:

${createList([
      'Add expenses as soon as they happen - don\'t wait!',
      'Use descriptions to remember what you bought',
      'Review your spending weekly to stay aware',
      'Set realistic budgets you can actually maintain',
      'Use categories consistently for better insights'
    ])}

${createDivider()}

Remember, the key to successful expense tracking is consistency. Even 5 minutes a day can give you powerful insights into your spending habits.

Ready to take control of your finances? Let's get started!

Best regards,
The Expenser Team

${createFooter()}`
  };
};

export default gettingStartedEmailTemplate;
