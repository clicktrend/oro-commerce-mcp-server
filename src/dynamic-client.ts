import { AxiosInstance } from 'axios';
import { SwaggerParser, SwaggerEndpoint, ParsedOperation } from './swagger-parser.js';
import type { OroConfig } from './types.js';

export interface DynamicRequestOptions {
  pathParams?: Record<string, string | number>;
  queryParams?: Record<string, any>;
  requestBody?: any;
  headers?: Record<string, string>;
}

export interface DynamicResponse {
  success: boolean;
  data?: any;
  error?: string;
  statusCode?: number;
  endpoint: {
    path: string;
    method: string;
    operationId: string;
  };
}

export class DynamicOroClient {
  private swaggerParser: SwaggerParser;
  private availableTools: ParsedOperation[];

  constructor(
    swaggerFilePath: string,
    private axiosClient: AxiosInstance
  ) {
    this.swaggerParser = new SwaggerParser(swaggerFilePath);
    this.availableTools = [];
    this.initializeTools();
  }

  /**
   * Initialize available tools from swagger
   */
  private initializeTools(): void {
    // Load ALL endpoints from swagger schema (no filtering)
    const allEndpoints = this.swaggerParser.getAllEndpoints();
    this.availableTools = this.swaggerParser.generateMCPTools(allEndpoints);
    
    console.log(`🔧 Initialized ${this.availableTools.length} dynamic tools from swagger (ALL endpoints loaded)`);
  }

  /**
   * Get all available tools for MCP server
   */
  getAvailableTools(): ParsedOperation[] {
    return this.availableTools;
  }

  /**
   * Execute a dynamic API call based on tool name
   */
  async executeTool(toolName: string, args: any = {}): Promise<DynamicResponse> {
    const tool = this.availableTools.find(t => t.toolName === toolName);
    if (!tool) {
      return {
        success: false,
        error: `Tool '${toolName}' not found. Available tools: ${this.availableTools.map(t => t.toolName).join(', ')}`,
        endpoint: { path: '', method: '', operationId: '' }
      };
    }

    return await this.executeEndpoint(tool.endpoint, args);
  }

  /**
   * Execute an API endpoint with dynamic parameters
   */
  async executeEndpoint(endpoint: SwaggerEndpoint, options: DynamicRequestOptions = {}): Promise<DynamicResponse> {
    try {
      // Build the URL with path parameters
      let url = endpoint.path;
      if (options.pathParams) {
        for (const [key, value] of Object.entries(options.pathParams)) {
          url = url.replace(`{${key}}`, String(value));
        }
      }

      // Prepare request configuration
      const config: any = {
        method: endpoint.method.toLowerCase(),
        url,
        headers: options.headers || {}
      };

      // Add query parameters
      if (options.queryParams && Object.keys(options.queryParams).length > 0) {
        config.params = options.queryParams;
      }

      // Add request body for POST/PUT/PATCH requests
      if (options.requestBody && ['POST', 'PUT', 'PATCH'].includes(endpoint.method)) {
        config.data = options.requestBody;
      }

      // Execute the request
      const response = await this.axiosClient.request(config);

      return {
        success: true,
        data: response.data,
        statusCode: response.status,
        endpoint: {
          path: endpoint.path,
          method: endpoint.method,
          operationId: endpoint.operationId
        }
      };

    } catch (error: any) {
      const statusCode = error.response?.status;
      const errorMessage = error.response?.data?.message || error.message || 'Unknown error';

      return {
        success: false,
        error: `API call failed: ${errorMessage}`,
        statusCode,
        endpoint: {
          path: endpoint.path,
          method: endpoint.method,
          operationId: endpoint.operationId
        }
      };
    }
  }

  /**
   * Search for tools by name or description
   */
  searchTools(query: string): ParsedOperation[] {
    const lowercaseQuery = query.toLowerCase();
    return this.availableTools.filter(tool =>
      tool.toolName.includes(lowercaseQuery) ||
      tool.description.toLowerCase().includes(lowercaseQuery) ||
      tool.endpoint.tags.some(tag => tag.toLowerCase().includes(lowercaseQuery))
    );
  }

  /**
   * Get tools by category/tag
   */
  getToolsByCategory(category: string): ParsedOperation[] {
    return this.availableTools.filter(tool =>
      tool.endpoint.tags.includes(category)
    );
  }

  /**
   * Get all available categories
   */
  getAvailableCategories(): string[] {
    const categories = new Set<string>();
    this.availableTools.forEach(tool => {
      tool.endpoint.tags.forEach(tag => categories.add(tag));
    });
    return Array.from(categories).sort();
  }

  /**
   * Get comprehensive statistics about loaded endpoints
   */
  getEndpointStatistics(): {
    totalEndpoints: number;
    byMethod: Record<string, number>;
    byCategory: Record<string, number>;
    withKitItems: number;
    withOrders: number;
    withProducts: number;
    relationships: number;
    categories: string[];
  } {
    const stats = {
      totalEndpoints: this.availableTools.length,
      byMethod: {} as Record<string, number>,
      byCategory: {} as Record<string, number>,
      withKitItems: 0,
      withOrders: 0,
      withProducts: 0,
      relationships: 0,
      categories: this.getAvailableCategories()
    };

    this.availableTools.forEach(tool => {
      const method = tool.endpoint.method;
      stats.byMethod[method] = (stats.byMethod[method] || 0) + 1;

      tool.endpoint.tags.forEach(tag => {
        stats.byCategory[tag] = (stats.byCategory[tag] || 0) + 1;
      });

      const path = tool.endpoint.path.toLowerCase();
      if (path.includes('kititem')) stats.withKitItems++;
      if (path.includes('order')) stats.withOrders++;
      if (path.includes('product')) stats.withProducts++;
      if (path.includes('relationship')) stats.relationships++;
    });

    return stats;
  }

  /**
   * Validate tool arguments against schema
   */
  validateToolArguments(toolName: string, args: any): { valid: boolean; errors: string[] } {
    const tool = this.availableTools.find(t => t.toolName === toolName);
    if (!tool) {
      return { valid: false, errors: [`Tool '${toolName}' not found`] };
    }

    const errors: string[] = [];
    const schema = tool.inputSchema;

    // Check required fields
    if (schema.required) {
      for (const requiredField of schema.required) {
        if (!args.hasOwnProperty(requiredField)) {
          errors.push(`Missing required field: ${requiredField}`);
        }
      }
    }

    // Basic type checking for properties
    if (schema.properties && args) {
      for (const [fieldName, fieldValue] of Object.entries(args)) {
        const fieldSchema = schema.properties[fieldName];
        if (fieldSchema && fieldSchema.type) {
          const actualType = typeof fieldValue;
          const expectedType = fieldSchema.type === 'integer' ? 'number' : fieldSchema.type;
          
          if (actualType !== expectedType) {
            errors.push(`Field '${fieldName}' should be ${expectedType}, got ${actualType}`);
          }
        }
      }
    }

    return { valid: errors.length === 0, errors };
  }

  /**
   * Format API response for display
   */
  formatResponse(response: DynamicResponse): string {
    if (!response.success) {
      return `❌ Error: ${response.error}\\n` +
             `Endpoint: ${response.endpoint.method} ${response.endpoint.path}\\n` +
             `Status Code: ${response.statusCode || 'Unknown'}`;
    }

    const data = response.data?.data || response.data;
    const isArray = Array.isArray(data);
    const itemCount = isArray ? data.length : 1;

    let result = `✅ Success: ${response.endpoint.operationId}\\n` +
                `Endpoint: ${response.endpoint.method} ${response.endpoint.path}\\n` +
                `Status: ${response.statusCode}\\n` +
                `Items: ${itemCount}\\n\\n`;

    if (isArray && data.length > 0) {
      // Show first few items
      const preview = data.slice(0, 3).map((item: any, index: number) => {
        return `${index + 1}. ${this.formatItem(item)}`;
      }).join('\\n');
      
      result += preview;
      
      if (data.length > 3) {
        result += `\\n... and ${data.length - 3} more items`;
      }
    } else if (!isArray && data) {
      result += this.formatItem(data);
    } else {
      result += 'No data returned';
    }

    return result;
  }

  /**
   * Format a single item for display
   */
  private formatItem(item: any): string {
    if (!item || typeof item !== 'object') {
      return String(item);
    }

    // Extract key fields for display
    const keyFields = ['id', 'name', 'title', 'sku', 'email', 'status'];
    const display = keyFields
      .filter(field => item.hasOwnProperty(field))
      .map(field => `${field}: ${item[field]}`)
      .slice(0, 3)
      .join(', ');

    return display || Object.keys(item).slice(0, 3).map(key => `${key}: ${item[key]}`).join(', ');
  }

  /**
   * Get endpoint documentation
   */
  getEndpointDocumentation(toolName: string): string | null {
    const tool = this.availableTools.find(t => t.toolName === toolName);
    if (!tool) return null;

    const endpoint = tool.endpoint;
    let doc = `# ${tool.toolName}\\n\\n`;
    doc += `**Description:** ${tool.description}\\n\\n`;
    doc += `**Method:** ${endpoint.method}\\n`;
    doc += `**Path:** ${endpoint.path}\\n`;
    doc += `**Operation ID:** ${endpoint.operationId}\\n`;
    doc += `**Tags:** ${endpoint.tags.join(', ')}\\n\\n`;

    if (endpoint.parameters.length > 0) {
      doc += `**Parameters:**\\n`;
      endpoint.parameters.forEach(param => {
        doc += `- ${param.name} (${param.in}): ${param.description || 'No description'} ${param.required ? '[Required]' : '[Optional]'}\\n`;
      });
    }

    return doc;
  }
}