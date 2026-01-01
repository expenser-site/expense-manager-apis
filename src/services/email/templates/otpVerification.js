/**
 * OTP Verification Email Template (HTML Version)
 * Sent when user needs to verify with OTP code
 */
import {
  createEmailWrapper,
  createHeader,
  createFooter,
  createWarningBox,
  createCodeBlock,
  createDivider,
  createContent,
  createParagraph
} from './emailTemplateUtils.js';

const otpVerificationTemplate = (data) => {
  const { name, otp, expiryMinutes = 10 } = data;

  const content = createContent(`
    ${createParagraph(`Hello <strong>${name}</strong>,`)}
    
    ${createParagraph('Your verification code:')}
    
    ${createDivider()}
    
    ${createCodeBlock(otp, 'Your OTP Code')}
    
    ${createDivider()}
    
    ${createWarningBox(`This code expires in <strong>${expiryMinutes} minutes</strong>.`)}
    
    ${createParagraph('Never share this code with anyone.')}
    
    ${createParagraph('Best regards,<br>The Expenser Team')}
  `);

  const html = createEmailWrapper(`
    ${createHeader('Your Verification Code')}
    ${content}
    ${createFooter()}
  `);

  return {
    subject: `🔐 Your Expenser OTP Code: ${otp}`,
    html,
    text: `Hello ${name},\n\nYour OTP code is: ${otp}\n\nThis code expires in ${expiryMinutes} minutes.`
  };
};

export default otpVerificationTemplate;
