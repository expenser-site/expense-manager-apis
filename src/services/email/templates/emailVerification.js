/**
 * Email Verification Template (HTML Version)
 * Sent after registration to verify email address
 */
import {
  createEmailWrapper,
  createHeader,
  createFooter,
  createButton,
  createInfoBox,
  createWarningBox,
  createCodeBlock,
  createDivider,
  createContent,
  createParagraph
} from './emailTemplateUtils.js';

const emailVerificationTemplate = (data) => {
  const { name, verificationUrl, verificationCode, expiryMinutes = 60 } = data;

  const content = createContent(`
    ${createParagraph(`Hello <strong>${name}</strong>,`)}
    
    ${createInfoBox('Welcome to Expenser! Please verify your email address to activate your account.')}
    
    ${createDivider()}
    
    ${createButton('Verify Email Address', verificationUrl, 'success')}
    
    ${verificationCode ? `
      ${createDivider()}
      ${createParagraph('Or enter this verification code:')}
      ${createCodeBlock(verificationCode, 'Verification Code')}
      ${createDivider()}
    ` : ''}
    
    ${createWarningBox(`This link expires in <strong>${expiryMinutes} minutes</strong>.`)}
    
    ${createParagraph('If you didn\'t create an account, you can safely ignore this email.')}
    
    ${createParagraph('Best regards,<br>The Expenser Team')}
  `);

  const html = createEmailWrapper(`
    ${createHeader('Verify Your Email Address')}
    ${content}
    ${createFooter()}
  `);

  return {
    subject: '✉️ Verify Your Expenser Account',
    html,
    text: `Hello ${name},\n\nPlease verify your email: ${verificationUrl}\n\n${verificationCode ? `Code: ${verificationCode}\n\n` : ''}This link expires in ${expiryMinutes} minutes.`
  };
};

export default emailVerificationTemplate;
