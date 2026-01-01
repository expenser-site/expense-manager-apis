/**
 * HTML Email Template Utilities
 * Creates beautiful, responsive HTML email templates
 * Uses inline CSS for maximum email client compatibility
 */

// Theme colors from expense-manager-app
const theme = {
  primary: '#3b82f6',
  primaryLight: '#60a5fa',
  primaryDark: '#2563eb',
  text: '#0f172a',
  textMuted: '#64748b',
  background: '#ffffff',
  backgroundSecondary: '#f8fafc',
  border: '#e2e8f0',
  success: '#22c55e',
  warning: '#eab308',
  destructive: '#ef4444',
  accent: '#8b5cf6'
};

/**
 * Create base HTML email structure
 */
const createEmailWrapper = (content) => {
  return `
<!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <meta name="x-apple-disable-message-reformatting">
  <title>Expenser</title>
  <!--[if mso]>
  <style>
    * { font-family: Arial, sans-serif !important; }
  </style>
  <![endif]-->
  <style>
    html, body {
      margin: 0 auto !important;
      padding: 0 !important;
      height: 100% !important;
      width: 100% !important;
      background: #f8fafc;
    }
    * {
      -ms-text-size-adjust: 100%;
      -webkit-text-size-adjust: 100%;
    }
    table, td {
      mso-table-lspace: 0pt !important;
      mso-table-rspace: 0pt !important;
    }
    table {
      border-spacing: 0 !important;
      border-collapse: collapse !important;
      table-layout: fixed !important;
      margin: 0 auto !important;
    }
    img {
      -ms-interpolation-mode: bicubic;
    }
    a {
      text-decoration: none;
    }
    @media only screen and (min-device-width: 320px) and (max-device-width: 374px) {
      u ~ div .email-container {
        min-width: 320px !important;
      }
    }
    @media only screen and (min-device-width: 375px) and (max-device-width: 413px) {
      u ~ div .email-container {
        min-width: 375px !important;
      }
    }
    @media only screen and (min-device-width: 414px) {
      u ~ div .email-container {
        min-width: 414px !important;
      }
    }
  </style>
</head>
<body width="100%" style="margin: 0; padding: 0 !important; mso-line-height-rule: exactly; background-color: #f8fafc;">
  <center style="width: 100%; background-color: #f8fafc;">
    <div style="max-width: 600px; margin: 0 auto;" class="email-container">
      ${content}
    </div>
  </center>
</body>
</html>
  `;
};

/**
 * Create email header with branding
 */
const createHeader = (title) => {
  const logoSvg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" fill="none" style="width: 48px; height: 48px; margin: 0 auto 12px; display: block;"><rect width="32" height="32" rx="6" fill="#ffffff"/><g stroke="#3b82f6" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" transform="translate(8, 8)"><path d="M19 7v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l3 3-3 3z"/><path d="M3 7h12"/><path d="M12 11v.01"/></g></svg>';

  return `
    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin: auto;">
      <tr>
        <td style="padding: 40px 20px 20px; text-align: center; background: linear-gradient(135deg, ${theme.primary} 0%, ${theme.primaryDark} 100%);">
          <div style="font-family: Arial, sans-serif;">
            ${logoSvg}
            <h1 style="margin: 0; font-size: 32px; font-weight: bold; color: #ffffff; letter-spacing: 2px;">
              EXPENSER
            </h1>
            <p style="margin: 8px 0 0; font-size: 14px; color: rgba(255, 255, 255, 0.9); font-weight: 500;">
              Expense Management Made Easy
            </p>
          </div>
        </td>
      </tr>
      <tr>
        <td style="padding: 30px 20px 20px; background-color: ${theme.background};">
          <h2 style="margin: 0; font-family: Arial, sans-serif; font-size: 24px; font-weight: bold; color: ${theme.text};">
            ${title}
          </h2>
        </td>
      </tr>
    </table>
  `;
};

/**
 * Create email footer
 */
const createFooter = () => {
  const currentYear = new Date().getFullYear();
  return `
    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin: auto;">
      <tr>
        <td style="padding: 40px 20px; background-color: ${theme.backgroundSecondary};">
          <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
            <tr>
              <td style="font-family: Arial, sans-serif; font-size: 14px; color: ${theme.textMuted}; text-align: center; line-height: 1.6;">
                <p style="margin: 0 0 16px;"><strong style="color: ${theme.text};">Need help? We're here for you!</strong></p>
                <p style="margin: 0 0 8px;">
                  <a href="https://www.expenser.site/" style="color: ${theme.primary}; text-decoration: none; margin: 0 8px;">Home</a> •
                  <a href="https://app.expenser.site/dashboard" style="color: ${theme.primary}; text-decoration: none; margin: 0 8px;">Dashboard</a> •
                  <a href="mailto:support@expenser.site" style="color: ${theme.primary}; text-decoration: none; margin: 0 8px;">Support</a>
                </p>
                <p style="margin: 16px 0 0; font-size: 12px; color: ${theme.textMuted};">
                  © ${currentYear} Expenser. All rights reserved.
                </p>
                <p style="margin: 8px 0 0; font-size: 11px; color: ${theme.textMuted};">
                  Questions? Email us at <a href="mailto:support@expenser.site" style="color: ${theme.primary}; text-decoration: none;">support@expenser.site</a>
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  `;
};

/**
 * Create a call-to-action button
 */
const createButton = (text, url, variant = 'primary') => {
  const variants = {
    primary: { bg: theme.primary, color: '#ffffff' },
    success: { bg: theme.success, color: '#ffffff' },
    warning: { bg: theme.warning, color: '#ffffff' },
    destructive: { bg: theme.destructive, color: '#ffffff' }
  };

  const style = variants[variant] || variants.primary;

  return `
    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin: 30px 0;">
      <tr>
        <td style="text-align: center;">
          <a href="${url}" style="display: inline-block; padding: 14px 32px; font-family: Arial, sans-serif; font-size: 16px; font-weight: 600; color: ${style.color}; background-color: ${style.bg}; border-radius: 8px; text-decoration: none; box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);">
            ${text}
          </a>
        </td>
      </tr>
    </table>
  `;
};

/**
 * Create an info box
 */
const createInfoBox = (content, icon = 'ℹ️') => {
  return `
    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin: 20px 0;">
      <tr>
        <td style="padding: 16px; background-color: ${theme.primary}15; border-radius: 8px;">
          <p style="margin: 0; font-family: Arial, sans-serif; font-size: 14px; color: ${theme.text}; line-height: 1.5;">
            <span style="font-size: 18px; margin-right: 8px;">${icon}</span>
            ${content}
          </p>
        </td>
      </tr>
    </table>
  `;
};

/**
 * Create a warning box
 */
const createWarningBox = (content) => {
  return `
    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin: 20px 0;">
      <tr>
        <td style="padding: 16px; background-color: ${theme.warning}15; border-left: 4px solid ${theme.warning}; border-radius: 8px;">
          <p style="margin: 0; font-family: Arial, sans-serif; font-size: 14px; color: ${theme.text}; line-height: 1.5;">
            <span style="font-size: 18px; margin-right: 8px;">⚠️</span>
            <strong>Warning:</strong> ${content}
          </p>
        </td>
      </tr>
    </table>
  `;
};

/**
 * Create a success box
 */
const createSuccessBox = (content) => {
  return `
    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin: 20px 0;">
      <tr>
        <td style="padding: 16px; background-color: ${theme.success}15; border-radius: 8px;">
          <p style="margin: 0; font-family: Arial, sans-serif; font-size: 14px; color: ${theme.text}; line-height: 1.5;">
            <span style="font-size: 18px; margin-right: 8px;">✅</span>
            ${content}
          </p>
        </td>
      </tr>
    </table>
  `;
};

/**
 * Create an error/danger box
 */
const createErrorBox = (content) => {
  return `
    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin: 20px 0;">
      <tr>
        <td style="padding: 16px; background-color: ${theme.destructive}15; border-radius: 8px;">
          <p style="margin: 0; font-family: Arial, sans-serif; font-size: 14px; color: ${theme.text}; line-height: 1.5;">
            <span style="font-size: 18px; margin-right: 8px;">❌</span>
            <strong>Error:</strong> ${content}
          </p>
        </td>
      </tr>
    </table>
  `;
};

/**
 * Create a code block for OTP, tokens, etc.
 */
const createCodeBlock = (code, label = 'Code') => {
  return `
    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin: 20px 0;">
      <tr>
        <td style="text-align: center;">
          <p style="margin: 0 0 12px; font-family: Arial, sans-serif; font-size: 14px; color: ${theme.textMuted}; font-weight: 600; text-transform: uppercase; letter-spacing: 1px;">
            ${label}
          </p>
          <div style="display: inline-block; padding: 20px 40px; background: linear-gradient(135deg, ${theme.primary}10 0%, ${theme.primary}20 100%); border-radius: 12px;">
            <p style="margin: 0; font-family: 'Courier New', monospace; font-size: 32px; font-weight: bold; color: ${theme.primary}; letter-spacing: 8px;">
              ${code}
            </p>
          </div>
        </td>
      </tr>
    </table>
  `;
};

/**
 * Create a list of items
 */
const createList = (items) => {
  const listItems = items
    .filter(item => item !== null && item !== undefined)
    .map(item => `
      <tr>
        <td style="padding: 6px 0;">
          <p style="margin: 0; font-family: Arial, sans-serif; font-size: 14px; color: ${theme.text}; line-height: 1.6;">
            <span style="color: ${theme.primary}; margin-right: 8px;">•</span>${item}
          </p>
        </td>
      </tr>
    `).join('');

  return `
    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin: 12px 0;">
      ${listItems}
    </table>
  `;
};

/**
 * Create a spacer (replaces divider for cleaner design)
 */
const createDivider = () => {
  return `
    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin: 24px 0;">
      <tr>
        <td style="height: 1px;"></td>
      </tr>
    </table>
  `;
};

/**
 * Create content section
 */
const createContent = (content) => {
  return `
    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin: auto;">
      <tr>
        <td style="padding: 0 20px; background-color: ${theme.background};">
          ${content}
        </td>
      </tr>
    </table>
  `;
};

/**
 * Create a paragraph
 */
const createParagraph = (text, styles = {}) => {
  const defaultStyles = {
    fontSize: '15px',
    color: theme.text,
    lineHeight: '1.6',
    margin: '12px 0',
    ...styles
  };

  return `
    <p style="margin: ${defaultStyles.margin}; font-family: Arial, sans-serif; font-size: ${defaultStyles.fontSize}; color: ${defaultStyles.color}; line-height: ${defaultStyles.lineHeight};">
      ${text}
    </p>
  `;
};

export {
  theme,
  createEmailWrapper,
  createHeader,
  createFooter,
  createButton,
  createInfoBox,
  createWarningBox,
  createSuccessBox,
  createErrorBox,
  createCodeBlock,
  createList,
  createDivider,
  createContent,
  createParagraph
};
