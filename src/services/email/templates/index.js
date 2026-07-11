/**
 * Email Templates Index
 * Central export for all email templates
 * All templates now use HTML format with plain text fallback
 */
import welcomeEmailTemplate from './welcomeEmail.js';
import emailVerificationTemplate from './emailVerification.js';
import forgotPasswordTemplate from './forgotPassword.js';
import passwordChangedTemplate from './passwordChanged.js';
import resetPasswordTemplate from './resetPassword.js';
import gettingStartedEmailTemplate from './gettingStarted.js';
import otpVerificationTemplate from './otpVerification.js';
import otpExpirationTemplate from './otpExpiration.js';
import accountDeletionTemplate from './accountDeletion.js';
import dataExportTemplate from './dataExport.js';
import budgetAlertTemplate from './budgetAlert.js';

export {
  welcomeEmailTemplate,
  emailVerificationTemplate,
  gettingStartedEmailTemplate,
  otpVerificationTemplate,
  otpExpirationTemplate,
  forgotPasswordTemplate,
  resetPasswordTemplate,
  passwordChangedTemplate,
  accountDeletionTemplate,
  dataExportTemplate,
  budgetAlertTemplate
};
