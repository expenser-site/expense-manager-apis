/**
 * Budget Alert Email Template
 * Sent when spending reaches 80% or 100% of budget
 */
import {
  createEmailWrapper,
  createHeader,
  createFooter,
  createButton,
  createWarningBox,
  createErrorBox,
  createDivider,
  createContent,
  createParagraph
} from './emailTemplateUtils.js';

const budgetAlertTemplate = data => {
  const {
    name,
    budgetName,
    budgetAmount,
    spentAmount,
    spentPercent,
    currency,
    threshold,
    period,
    month,
    year,
    categoryNames,
    dashboardUrl
  } = data;

  const appUrl = dashboardUrl || process.env.FRONTEND_URL || 'https://app.expenser.site/dashboard';
  const remaining = budgetAmount - spentAmount;
  const isOver = spentPercent >= 100;
  const isWarning = threshold === 80;

  // Format period display
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const periodDisplay = period === 'monthly' 
    ? `${monthNames[month - 1]} ${year}` 
    : `${year}`;

  // Format budget name
  const displayName = budgetName || (categoryNames.length > 0 
    ? `${categoryNames.join(', ')} Budget` 
    : 'Overall Budget');

  // Create alert box
  const alertBox = isOver
    ? createErrorBox(`⚠️ Budget Exceeded! You've spent ${spentPercent.toFixed(1)}% of your ${displayName}`)
    : createWarningBox(`⚠️ Budget Alert: You've reached ${threshold}% of your ${displayName}`);

  // Format amounts with proper currency symbol
  const formatAmount = (amount) => {
    const symbols = { USD: '$', EUR: '€', GBP: '£', JPY: '¥', INR: '₹', BDT: '৳' };
    const symbol = symbols[currency] || currency;
    return `${symbol}${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const content = createContent(`
    ${createParagraph(`Hello <strong>${name}</strong>,`)}
    
    ${alertBox}
    
    ${createParagraph(`<strong>Budget Details for ${periodDisplay}:</strong>`)}
    
    <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
      <tr>
        <td style="padding: 10px; border-bottom: 1px solid #e5e7eb;">Budget Amount:</td>
        <td style="padding: 10px; text-align: right; border-bottom: 1px solid #e5e7eb;"><strong>${formatAmount(budgetAmount)}</strong></td>
      </tr>
      <tr>
        <td style="padding: 10px; border-bottom: 1px solid #e5e7eb;">Amount Spent:</td>
        <td style="padding: 10px; text-align: right; border-bottom: 1px solid #e5e7eb; color: ${isOver ? '#dc2626' : '#f59e0b'};"><strong>${formatAmount(spentAmount)}</strong></td>
      </tr>
      <tr>
        <td style="padding: 10px; border-bottom: 1px solid #e5e7eb;">Percentage Used:</td>
        <td style="padding: 10px; text-align: right; border-bottom: 1px solid #e5e7eb;"><strong>${spentPercent.toFixed(1)}%</strong></td>
      </tr>
      <tr>
        <td style="padding: 10px;">Remaining:</td>
        <td style="padding: 10px; text-align: right; color: ${remaining >= 0 ? '#059669' : '#dc2626'};"><strong>${formatAmount(remaining)}</strong></td>
      </tr>
    </table>

    ${categoryNames.length > 0 ? createParagraph(`<strong>Categories:</strong> ${categoryNames.join(', ')}`) : ''}
    
    ${createDivider()}
    
    ${isOver 
      ? createParagraph('💡 <strong>Tip:</strong> Consider reviewing your recent expenses and adjusting your budget or spending habits for the rest of the period.')
      : createParagraph('💡 <strong>Tip:</strong> Keep an eye on your spending to stay within your budget for the rest of the period.')
    }
    
    ${createButton('View Budget Details', `${appUrl}/budgets`)}
    
    ${createDivider()}
    
    ${createParagraph('Best regards,<br>The Expenser Team')}
  `);

  const html = createEmailWrapper(`
    ${createHeader(isOver ? '⚠️ Budget Exceeded!' : '⚠️ Budget Alert')}
    ${content}
    ${createFooter()}
  `);

  const subject = isOver
    ? `⚠️ Budget Exceeded - ${displayName} (${periodDisplay})`
    : `⚠️ Budget Alert: ${threshold}% Reached - ${displayName} (${periodDisplay})`;

  return {
    subject,
    html,
    text: `Budget Alert: You've ${isOver ? 'exceeded' : `reached ${threshold}% of`} your ${displayName} for ${periodDisplay}. Spent: ${formatAmount(spentAmount)} of ${formatAmount(budgetAmount)} (${spentPercent.toFixed(1)}%). View details: ${appUrl}/budgets`
  };
};

export default budgetAlertTemplate;
