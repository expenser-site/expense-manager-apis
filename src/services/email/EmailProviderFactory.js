/**
 * Email Provider Factory
 * Creates and manages email provider instances
 */
import ZeptoMailProvider from './ZeptoMailProvider.js';
import DevelopmentEmailProvider from './DevelopmentEmailProvider.js';
import logger from '../../config/logger.js';

class EmailProviderFactory {
  /**
   * Create email provider based on configuration
   * @param {string} providerType - Type of provider (ZEPTOMAIL, DEVELOPMENT, etc.)
   * @param {Object} config - Provider configuration
   * @returns {BaseEmailProvider} Email provider instance
   */
  static createProvider(providerType, config = {}) {
    const provider = (providerType || process.env.EMAIL_PROVIDER || 'DEVELOPMENT').toUpperCase();

    logger.info(`Creating email provider: ${provider}`);

    switch (provider) {
      case 'ZEPTOMAIL':
        return new ZeptoMailProvider(config);

      case 'DEVELOPMENT':
        return new DevelopmentEmailProvider();

      // Add more providers here in the future
      // case 'SENDGRID':
      //   return new SendGridProvider(config);
      // case 'SES':
      //   return new SESProvider(config);

      default:
        logger.warn(`Unknown email provider: ${provider}, falling back to DEVELOPMENT`);
        return new DevelopmentEmailProvider();
    }
  }

  /**
   * Create and verify provider
   * @param {string} providerType - Type of provider
   * @param {Object} config - Provider configuration
   * @returns {Promise<BaseEmailProvider>} Verified email provider instance
   */
  static async createAndVerifyProvider(providerType, config = {}) {
    const provider = this.createProvider(providerType, config);

    try {
      const isConnected = await provider.verifyConnection();
      if (!isConnected) {
        logger.warn(`Provider ${provider.getProviderName()} verification failed`);
      }
    } catch (error) {
      logger.logError(error, null, {
        context: 'email-provider-verification',
        provider: provider.getProviderName()
      });
    }

    return provider;
  }
}

export default EmailProviderFactory;
