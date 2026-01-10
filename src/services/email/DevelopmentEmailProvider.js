/**
 * Development Email Provider
 * Logs emails to console instead of sending them
 * Useful for development and testing
 */
import BaseEmailProvider from './BaseEmailProvider.js';
import logger from '../../config/logger.js';

class DevelopmentEmailProvider extends BaseEmailProvider {
  constructor() {
    super();
    logger.info('Using Development Email Provider (emails will be logged, not sent)');
  }

  /**
   * "Send" email by logging to console
   */
  async sendEmail(options) {
    const emailLog = {
      provider: 'DEVELOPMENT',
      to: options.to,
      subject: options.subject,
      from: options.from || process.env.EMAIL_FROM || 'no-reply@expenser.site',
      replyTo: options.replyTo || process.env.EMAIL_REPLY_TO || 'contact@expenser.site',
      timestamp: new Date().toISOString(),
      text: options.text,
      html: options.html
    };

    logger.info('📧 [DEVELOPMENT] Email would be sent:', emailLog);

    // Pretty print to console for easier reading
    /* eslint-disable no-console */
    const separator = '='.repeat(80);
    const shortSep = '-'.repeat(80);
    console.log(`\n${separator}`);
    console.log('📧 DEVELOPMENT EMAIL');
    console.log(separator);
    console.log(`To: ${emailLog.to}`);
    console.log(`From: ${emailLog.from}`);
    console.log(`Reply-To: ${emailLog.replyTo}`);
    console.log(`Subject: ${emailLog.subject}`);
    console.log(shortSep);
    console.log('Text Content:');
    console.log(emailLog.text);
    console.log(`${separator}\n`);
    /* eslint-enable no-console */

    return {
      success: true,
      messageId: `dev-${Date.now()}`,
      provider: 'DEVELOPMENT'
    };
  }

  /**
   * Always returns true for development
   */
  async verifyConnection() {
    logger.info('Development Email Provider - Connection verified (mock)');
    return true;
  }

  /**
   * Get provider name
   */
  getProviderName() {
    return 'DEVELOPMENT';
  }
}

export default DevelopmentEmailProvider;
