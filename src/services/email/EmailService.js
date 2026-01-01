/**
 * Email Service
 * Main service for sending emails using various providers
 */
import EmailProviderFactory from './EmailProviderFactory.js';
import {
  welcomeEmailTemplate,
  emailVerificationTemplate,
  gettingStartedEmailTemplate,
  otpVerificationTemplate,
  otpExpirationTemplate,
  forgotPasswordTemplate,
  resetPasswordTemplate,
  passwordChangedTemplate,
  accountDeletionTemplate,
  dataExportTemplate
} from './templates/index.js';
import logger from '../../config/logger.js';

class EmailService {
  constructor() {
    this.provider = null;
    this.initialized = false;
  }

  /**
   * Initialize the email service with a provider
   */
  async initialize(providerType, config = {}) {
    try {
      this.provider = await EmailProviderFactory.createAndVerifyProvider(providerType, config);
      this.initialized = true;
      logger.info(`Email service initialized with ${this.provider.getProviderName()} provider`);
      return true;
    } catch (error) {
      logger.logError(error, null, { context: 'email-service-initialization' });
      // Fall back to development provider
      this.provider = EmailProviderFactory.createProvider('DEVELOPMENT');
      this.initialized = true;
      return false;
    }
  }

  /**
   * Ensure service is initialized
   */
  async ensureInitialized() {
    if (!this.initialized) {
      await this.initialize();
    }
  }

  /**
   * Send a welcome email
   */
  async sendWelcomeEmail(to, data) {
    await this.ensureInitialized();
    const template = welcomeEmailTemplate(data);
    return this.provider.sendEmail({
      to,
      subject: template.subject,
      text: template.text,
      html: template.html
    });
  }

  /**
   * Send an email verification email
   */
  async sendEmailVerification(to, data) {
    await this.ensureInitialized();
    const template = emailVerificationTemplate(data);
    return this.provider.sendEmail({
      to,
      subject: template.subject,
      text: template.text,
      html: template.html
    });
  }

  /**
   * Send a getting started email
   */
  async sendGettingStartedEmail(to, data) {
    await this.ensureInitialized();
    const template = gettingStartedEmailTemplate(data);
    return this.provider.sendEmail({
      to,
      subject: template.subject,
      text: template.text,
      html: template.html
    });
  }

  /**
   * Send an OTP verification email
   */
  async sendOTPVerification(to, data) {
    await this.ensureInitialized();
    const template = otpVerificationTemplate(data);
    return this.provider.sendEmail({
      to,
      subject: template.subject,
      text: template.text,
      html: template.html
    });
  }

  /**
   * Send an OTP expiration notification
   */
  async sendOTPExpiration(to, data) {
    await this.ensureInitialized();
    const template = otpExpirationTemplate(data);
    return this.provider.sendEmail({
      to,
      subject: template.subject,
      text: template.text,
      html: template.html
    });
  }

  /**
   * Send a forgot password email
   */
  async sendForgotPasswordEmail(to, data) {
    await this.ensureInitialized();
    const template = forgotPasswordTemplate(data);
    return this.provider.sendEmail({
      to,
      subject: template.subject,
      text: template.text,
      html: template.html
    });
  }

  /**
   * Send a password reset confirmation email
   */
  async sendResetPasswordEmail(to, data) {
    await this.ensureInitialized();
    const template = resetPasswordTemplate(data);
    return this.provider.sendEmail({
      to,
      subject: template.subject,
      text: template.text,
      html: template.html
    });
  }

  /**
   * Send a password changed notification
   */
  async sendPasswordChangedEmail(to, data) {
    await this.ensureInitialized();
    const template = passwordChangedTemplate(data);
    return this.provider.sendEmail({
      to,
      subject: template.subject,
      text: template.text,
      html: template.html
    });
  }

  /**
   * Send an account deletion notification
   */
  async sendAccountDeletionEmail(to, data) {
    await this.ensureInitialized();
    const template = accountDeletionTemplate(data);
    return this.provider.sendEmail({
      to,
      subject: template.subject,
      text: template.text,
      html: template.html
    });
  }

  /**
   * Send a data export ready notification
   */
  async sendDataExportEmail(to, data) {
    await this.ensureInitialized();
    const template = dataExportTemplate(data);
    return this.provider.sendEmail({
      to,
      subject: template.subject,
      text: template.text,
      html: template.html
    });
  }

  /**
   * Send a custom email (for advanced use cases)
   */
  async sendCustomEmail(to, subject, text, options = {}) {
    await this.ensureInitialized();
    return this.provider.sendEmail({
      to,
      subject,
      text,
      ...options
    });
  }

  /**
   * Get the current provider name
   */
  getProviderName() {
    return this.provider ? this.provider.getProviderName() : 'Not initialized';
  }
}

// Create and export a singleton instance
const emailService = new EmailService();

export default emailService;
