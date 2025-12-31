/**
 * Email Template Utilities
 * Theme colors from expense-manager-app/src/index.css
 */

// Convert HSL to hex for email compatibility
const theme = {
  // Primary blue - 221.2 83.2% 53.3%
  primary: '#3b82f6',
  primaryLight: '#60a5fa',
  primaryDark: '#2563eb',

  // Foreground/Text - 222.2 84% 4.9%
  text: '#0f172a',
  textMuted: '#64748b',

  // Background
  background: '#ffffff',
  backgroundSecondary: '#f8fafc',

  // Border
  border: '#e2e8f0',

  // Success - Using chart-2: 142.1 76.2% 36.3%
  success: '#22c55e',

  // Warning - Using chart-3: 47.9 95.8% 53.1%
  warning: '#eab308',

  // Destructive - 0 84.2% 60.2%
  destructive: '#ef4444',

  // Accent colors
  accent: '#8b5cf6',
  accentLight: '#a78bfa'
};

/**
 * Create a consistent email header
 */
const createHeader = (title) => {
  return `
╔════════════════════════════════════════════════════════════════╗
║                                                                ║
║                         EXPENSER                               ║
║                   Expense Management Made Easy                 ║
║                                                                ║
╚════════════════════════════════════════════════════════════════╝

${title}
${'='.repeat(title.length)}
`;
};

/**
 * Create a consistent email footer
 */
const createFooter = () => {
  const currentYear = new Date().getFullYear();
  return `
────────────────────────────────────────────────────────────────

Need help? We're here for you!
  • Visit our help center: https://expenser.site/help
  • Contact support: contact@expenser.site
  • Follow us for updates and tips

────────────────────────────────────────────────────────────────

© ${currentYear} Expenser. All rights reserved.
Expenser - Your Personal Finance Companion

This email was sent to you because you have an account with Expenser.
If you didn't request this email, please ignore it or contact support.

────────────────────────────────────────────────────────────────
`;
};

/**
 * Create a button/CTA in text format
 */
const createButton = (text, url) => {
  return `
┌────────────────────────────────────────┐
│  👉 ${text.toUpperCase()}
│  ${url}
└────────────────────────────────────────┘
`;
};

/**
 * Create an info box
 */
const createInfoBox = (content) => {
  return `
┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
┃  ℹ️  ${content}
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛
`;
};

/**
 * Create a warning box
 */
const createWarningBox = (content) => {
  return `
┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
┃  ⚠️  WARNING: ${content}
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛
`;
};

/**
 * Create a success box
 */
const createSuccessBox = (content) => {
  return `
┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
┃  ✅ ${content}
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛
`;
};

/**
 * Create a code block for OTPs, tokens, etc.
 */
const createCodeBlock = (code, label = 'Code') => {
  return `
${label}:
┌────────────────────────────────────────┐
│                                        │
│         ${code}         │
│                                        │
└────────────────────────────────────────┘
`;
};

/**
 * Format a list of items
 */
const createList = (items) => {
  return items.map((item) => `  • ${item}`).join('\n');
};

/**
 * Create a divider
 */
const createDivider = () => {
  return '\n────────────────────────────────────────────────────────────────\n';
};

export {
  theme,
  createHeader,
  createFooter,
  createButton,
  createInfoBox,
  createWarningBox,
  createSuccessBox,
  createCodeBlock,
  createList,
  createDivider
};
