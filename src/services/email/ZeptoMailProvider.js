/**
 * ZeptoMail Email Provider
 * Implements email sending using ZeptoMail SMTP
 */
import nodemailer from 'nodemailer';
import BaseEmailProvider from './BaseEmailProvider.js';
import logger from '../../config/logger.js';

class ZeptoMailProvider extends BaseEmailProvider {
  constructor(config) {
    super();
    this.config = {
      host: config.host || process.env.EMAIL_HOST,
      port: config.port || parseInt(process.env.EMAIL_PORT || '465'),
      secure: config.secure !== undefined ? config.secure : process.env.EMAIL_SECURE === 'true',
      auth: {
        user: config.user || process.env.EMAIL_USER || 'emailapikey',
        pass: config.apiKey || process.env.EMAIL_API_KEY
      }
    };

    this.defaultFrom = config.from || process.env.EMAIL_FROM || 'no-reply@expenser.site';
    this.defaultReplyTo = config.replyTo || process.env.EMAIL_REPLY_TO || 'contact@expenser.site';

    // Create transporter
    this.transporter = nodemailer.createTransport(this.config);
  }

  /**
   * Send an email using ZeptoMail
   */
  async sendEmail(options) {
    try {
      const mailOptions = {
        from: options.from || this.defaultFrom,
        to: options.to,
        subject: options.subject,
        text: options.text,
        html: options.html,
        replyTo: options.replyTo || this.defaultReplyTo
      };

      const info = await this.transporter.sendMail(mailOptions);

      logger.info('Email sent successfully via ZeptoMail', {
        messageId: info.messageId,
        to: options.to,
        subject: options.subject
      });

      return {
        success: true,
        messageId: info.messageId,
        provider: 'ZeptoMail'
      };
    } catch (error) {
      logger.logError(error, null, {
        context: 'zeptomail-send-email',
        to: options.to,
        subject: options.subject
      });

      throw new Error(`Failed to send email via ZeptoMail: ${error.message}`);
    }
  }

  /**
   * Verify ZeptoMail connection
   */
  async verifyConnection() {
    try {
      await this.transporter.verify();
      logger.info('ZeptoMail connection verified successfully');
      return true;
    } catch (error) {
      logger.logError(error, null, { context: 'zeptomail-verify-connection' });
      return false;
    }
  }

  /**
   * Get provider name
   */
  getProviderName() {
    return 'ZeptoMail';
  }
}

export default ZeptoMailProvider;
