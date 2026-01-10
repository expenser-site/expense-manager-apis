/**
 * Base Email Provider Interface
 * All email providers must implement this interface
 */
class BaseEmailProvider {
  /**
   * Send an email
   * @param {Object} options - Email options
   * @param {string} options.to - Recipient email address
   * @param {string} options.subject - Email subject
   * @param {string} options.text - Plain text content
   * @param {string} options.html - HTML content (optional)
   * @param {string} options.from - Sender email (optional, uses default if not provided)
   * @param {string} options.replyTo - Reply-to email (optional)
   * @returns {Promise<Object>} Send result
   */
  // eslint-disable-next-line no-unused-vars
  async sendEmail(options) {
    throw new Error('sendEmail method must be implemented by provider');
  }

  /**
   * Verify email provider connection
   * @returns {Promise<boolean>} Connection status
   */
  async verifyConnection() {
    throw new Error('verifyConnection method must be implemented by provider');
  }

  /**
   * Get provider name
   * @returns {string} Provider name
   */
  getProviderName() {
    throw new Error('getProviderName method must be implemented by provider');
  }
}

export default BaseEmailProvider;
