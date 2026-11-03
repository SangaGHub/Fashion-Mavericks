import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

/**
 * OAuth Token Service for SAP AI Core
 * Handles authentication and token management
 */
class OAuthService {
  constructor() {
    this.clientId = process.env.AICORE_CLIENT_ID;
    this.clientSecret = process.env.AICORE_CLIENT_SECRET;
    this.authUrl = process.env.AICORE_AUTH_URL;

    this.token = null;
    this.tokenExpiry = null;
  }

  /**
   * Get a valid OAuth access token
   * Reuses existing token if still valid
   */
  async getAccessToken() {
    // Check if we have a valid token
    if (this.token && this.tokenExpiry && Date.now() < this.tokenExpiry) {
      return this.token;
    }

    // Request new token
    try {
      const response = await axios.post(
        `${this.authUrl}/oauth/token`,
        new URLSearchParams({
          grant_type: 'client_credentials'
        }),
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
          },
          auth: {
            username: this.clientId,
            password: this.clientSecret
          }
        }
      );

      this.token = response.data.access_token;

      // Set expiry time (subtract 60 seconds for safety margin)
      const expiresIn = response.data.expires_in || 3600;
      this.tokenExpiry = Date.now() + (expiresIn - 60) * 1000;

      console.log('✓ OAuth token obtained successfully');
      return this.token;

    } catch (error) {
      console.error('OAuth token request failed:', error.response?.data || error.message);
      throw new Error(`Failed to obtain OAuth token: ${error.message}`);
    }
  }

  /**
   * Clear the cached token (useful for testing or error recovery)
   */
  clearToken() {
    this.token = null;
    this.tokenExpiry = null;
  }

  /**
   * Validate that OAuth configuration is present
   */
  validateConfig() {
    const errors = [];

    if (!this.clientId) {
      errors.push('AICORE_CLIENT_ID is not configured');
    }
    if (!this.clientSecret) {
      errors.push('AICORE_CLIENT_SECRET is not configured');
    }
    if (!this.authUrl) {
      errors.push('AICORE_AUTH_URL is not configured');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }
}

// Singleton instance
const oauthService = new OAuthService();

export default oauthService;
