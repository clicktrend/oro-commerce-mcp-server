import axios, { AxiosInstance } from 'axios';
import https from 'https';
import type {
  OroConfig,
  OroTokenResponse,
} from './types.js';

export class OroCommerceClient {
  private axios: AxiosInstance;
  private token: string | null = null;
  private tokenExpiry: number | null = null;

  constructor(private config: OroConfig) {
    // Create HTTPS agent that ignores SSL certificate issues for development
    const httpsAgent = process.env.NODE_ENV === 'development' ? 
      new https.Agent({ rejectUnauthorized: false }) : undefined;

    this.axios = axios.create({
      baseURL: config.shopUrl,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
        'X-Include': 'noHateoas;totalCount',
        'X-Integration-Type': 'ERP'
      },
      httpsAgent,
      // Also set the agent directly for axios http adapter
      ...(httpsAgent && { httpsAgent })
    });

    // Request interceptor to add auth token
    this.axios.interceptors.request.use(async (config) => {
      await this.ensureValidToken();
      if (this.token) {
        config.headers.Authorization = `Bearer ${this.token}`;
      }
      return config;
    });
  }

  private async ensureValidToken(): Promise<void> {
    const now = Date.now() / 1000;
    
    if (!this.token || (this.tokenExpiry && now >= this.tokenExpiry)) {
      await this.refreshToken();
    }
  }

  private async refreshToken(): Promise<void> {
    try {
      const httpsAgent = process.env.NODE_ENV === 'development' ? 
        new https.Agent({ rejectUnauthorized: false }) : undefined;
        
      const response = await axios.post(
        `${this.config.shopUrl}/oauth2-token`,
        {
          grant_type: 'client_credentials',
          client_id: this.config.clientId,
          client_secret: this.config.clientSecret
        },
        {
          headers: { 'Content-Type': 'application/json' },
          httpsAgent
        }
      );

      const tokenData: OroTokenResponse = response.data;
      this.token = tokenData.access_token;
      // Set expiry 5 minutes before actual expiry for safety
      this.tokenExpiry = (Date.now() / 1000) + tokenData.expires_in - 300;
      
      console.log('✅ ORO Commerce token refreshed successfully');
    } catch (error) {
      console.error('❌ Failed to refresh ORO Commerce token:', error);
      throw new Error('Authentication failed with ORO Commerce API');
    }
  }

  async testConnection(): Promise<boolean> {
    try {
      await this.ensureValidToken();
      
      // Test with working endpoints from swagger
      const endpoints = [
        '/admin/api/accounts',
        '/admin/api/b2bcustomers', 
        '/admin/api/orders',
        '/admin/api/extproductattributecolors' // Extended product attributes
      ];
      
      let response = null;
      for (const endpoint of endpoints) {
        try {
          response = await this.axios.get(endpoint);
          console.log(`✅ API endpoint ${endpoint} works!`);
          break;
        } catch (error: any) {
          console.log(`⚠️ API endpoint ${endpoint} failed: ${error.response?.status} - ${error.response?.statusText || error.message}`);
          continue;
        }
      }
      
      return response?.status === 200;
    } catch (error) {
      console.error('❌ ORO Commerce connection test failed:', error);
      return false;
    }
  }











}