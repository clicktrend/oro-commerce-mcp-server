#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  ErrorCode,
  McpError,
} from '@modelcontextprotocol/sdk/types.js';
import { z } from 'zod';
import dotenv from 'dotenv';
import { OroCommerceClient } from './oro-client.js';
import { DynamicOroClient } from './dynamic-client.js';
import { join } from 'path';
import type { OroConfig } from './types.js';

// Load environment variables
dotenv.config();

// Validation schemas
const OroConfigSchema = z.object({
  shopUrl: z.string().url(),
  clientId: z.string().min(1),
  clientSecret: z.string().min(1),
});

class OroCommerceMCPServer {
  private server: Server;
  private oroClient: OroCommerceClient | null = null;
  private dynamicClient: DynamicOroClient | null = null;

  constructor() {
    this.server = new Server(
      {
        name: 'oro-commerce-mcp-server',
        version: '2.0.0',
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.setupToolHandlers();
    this.setupErrorHandling();
  }

  private setupErrorHandling(): void {
    this.server.onerror = (error) => {
      console.error('[MCP Server Error]', error);
    };

    process.on('SIGINT', async () => {
      console.log('\\n🛑 Shutting down ORO Commerce MCP Server...');
      await this.server.close();
      process.exit(0);
    });
  }

  private setupToolHandlers(): void {
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      const metaTools = [
        {
          name: 'oro_capabilities',
          description: 'Get an overview of ORO Commerce API capabilities and available data types',
          inputSchema: {
            type: 'object',
            properties: {},
          },
        },
        {
          name: 'oro_list_endpoints', 
          description: 'List all available API endpoints with optional filtering by category, search terms, or HTTP method',
          inputSchema: {
            type: 'object',
            properties: {
              category: {
                type: 'string',
                description: 'Filter by category/tag (e.g., "products", "orders", "accounts")',
              },
              search: {
                type: 'string',
                description: 'Search by keyword (e.g., "kitItems", "lineItems", "addresses")',
              },
              method: {
                type: 'string', 
                description: 'Filter by HTTP method (e.g., "GET", "POST")',
                enum: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH']
              },
              limit: {
                type: 'number',
                description: 'Maximum number of results to return (default: 50, max: 200)',
                minimum: 1,
                maximum: 200
              }
            },
          },
        },
        {
          name: 'oro_execute',
          description: 'Execute any ORO Commerce API endpoint directly',
          inputSchema: {
            type: 'object',
            properties: {
              endpoint: {
                type: 'string',
                description: 'API endpoint path (e.g., "/admin/api/products/{id}/kitItems")',
              },
              method: {
                type: 'string',
                description: 'HTTP method',
                enum: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH']
              },
              pathParams: {
                type: 'object',
                description: 'Path parameters as key-value pairs (e.g., {"id": "123"})',
              },
              queryParams: {
                type: 'object', 
                description: 'Query parameters as key-value pairs',
              },
              requestBody: {
                type: 'object',
                description: 'Request body for POST/PUT/PATCH requests',
              }
            },
            required: ['endpoint', 'method']
          },
        },
        {
          name: 'oro_help',
          description: 'Get detailed workflow guide and examples for using ORO Commerce APIs',
          inputSchema: {
            type: 'object',
            properties: {},
          },
        },
        {
          name: 'oro_stats',
          description: 'Get quick statistics about available API endpoints',
          inputSchema: {
            type: 'object',
            properties: {},
          },
        },
        ];

      // No dynamic tools registered - all access via meta-tools to avoid context overflow
      return {
        tools: metaTools
      };
    });

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      try {
        switch (name) {
          case 'oro_capabilities':
            return await this.getOroCapabilities();

          case 'oro_list_endpoints':
            return await this.listOroEndpoints(args);

          case 'oro_execute':
            return await this.executeOroEndpoint(args);

          case 'oro_help':
            return await this.getOroHelp();

          case 'oro_stats':
            return await this.getOroStats();

          // Legacy tools for backward compatibility
          case 'configure_oro_connection':
            return await this.configureOroConnection(args);
          
          case 'test_connections':
            return await this.testConnections();
          
          default:
            // Try dynamic tools
            if (this.dynamicClient) {
              const response = await this.dynamicClient.executeTool(name, args);
              if (response.success) {
                return {
                  content: [{
                    type: 'text',
                    text: this.dynamicClient.formatResponse(response)
                  }]
                };
              } else {
                throw new McpError(
                  ErrorCode.InternalError,
                  response.error || 'Dynamic tool execution failed'
                );
              }
            }
            
            throw new McpError(
              ErrorCode.MethodNotFound,
              `Unknown tool: ${name}`
            );
        }
      } catch (error) {
        if (error instanceof McpError) {
          throw error;
        }
        
        const message = error instanceof Error ? error.message : 'Unknown error occurred';
        throw new McpError(ErrorCode.InternalError, `Tool execution failed: ${message}`);
      }
    });
  }

  private async configureOroConnection(args: any) {
    try {
      const config = OroConfigSchema.parse(args);
      this.oroClient = new OroCommerceClient(config);
      
      // Test the connection
      const isConnected = await this.oroClient.testConnection();
      
      // Initialize dynamic client if connection successful
      if (isConnected && this.oroClient) {
        try {
          const swaggerPath = join(process.cwd(), 'oro_commerce_swagger_dump.json');
          this.dynamicClient = new DynamicOroClient(swaggerPath, (this.oroClient as any).axios);
          console.log('🚀 Dynamic client initialized with swagger schema');
        } catch (error) {
          console.warn('⚠️ Failed to initialize dynamic client:', error);
        }
      }
      
      return {
        content: [
          {
            type: 'text',
            text: isConnected 
              ? `✅ ORO Commerce connection configured and tested successfully!\n${this.dynamicClient ? `🔧 Dynamic tools loaded: ${this.dynamicClient.getAvailableTools().length}` : ''}` 
              : '⚠️ ORO Commerce connection configured but test failed. Please check your credentials.',
          },
        ],
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Invalid configuration';
      throw new McpError(ErrorCode.InvalidParams, `Configuration failed: ${message}`);
    }
  }

  private async testConnections() {
    if (!this.oroClient) {
      throw new McpError(ErrorCode.InvalidRequest, 'ORO Commerce connection not configured');
    }

    const isConnected = await this.oroClient.testConnection();
    
    return {
      content: [
        {
          type: 'text',
          text: isConnected
            ? '✅ ORO Commerce connection test successful!'
            : '❌ ORO Commerce connection test failed. Please check your credentials.',
        },
      ],
    };
  }

  private async listDynamicTools(args: any) {
    if (!this.dynamicClient) {
      return {
        content: [
          {
            type: 'text',
            text: '⚠️ Dynamic tools not available. Please configure ORO Commerce connection first.',
          },
        ],
      };
    }

    try {
      const { category, search } = args;
      let tools = this.dynamicClient.getAvailableTools();

      if (category) {
        tools = this.dynamicClient.getToolsByCategory(category);
      } else if (search) {
        tools = this.dynamicClient.searchTools(search);
      }

      const categories = this.dynamicClient.getAvailableCategories();
      
      return {
        content: [
          {
            type: 'text',
            text: `🔧 Dynamic Tools Available (${tools.length}):\\n\\n` +
                  tools.slice(0, 20).map((tool, index) => 
                    `${index + 1}. **${tool.toolName}**\\n` +
                    `   Description: ${tool.description.split('\\n')[0]}\\n` +
                    `   Categories: ${tool.endpoint.tags.join(', ') || 'None'}\\n`
                  ).join('\\n') +
                  (tools.length > 20 ? `\\n... and ${tools.length - 20} more tools` : '') +
                  `\\n\\n📂 Available Categories: ${categories.join(', ')}\\n\\n` +
                  `💡 Use 'get_dynamic_tool_info' to get detailed info about a specific tool.`,
          },
        ],
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to list dynamic tools';
      throw new McpError(ErrorCode.InternalError, message);
    }
  }

  private async getDynamicToolInfo(args: any) {
    if (!this.dynamicClient) {
      return {
        content: [
          {
            type: 'text',
            text: '⚠️ Dynamic tools not available. Please configure ORO Commerce connection first.',
          },
        ],
      };
    }

    try {
      const { toolName } = args;
      const documentation = this.dynamicClient.getEndpointDocumentation(toolName);
      
      if (!documentation) {
        return {
          content: [
            {
              type: 'text',
              text: `❌ Tool '${toolName}' not found.\\n\\nUse 'list_dynamic_tools' to see available tools.`,
            },
          ],
        };
      }

      return {
        content: [
          {
            type: 'text',
            text: documentation,
          },
        ],
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to get tool info';
      throw new McpError(ErrorCode.InternalError, message);
    }
  }

  private async getEndpointStatistics() {
    if (!this.dynamicClient) {
      return {
        content: [
          {
            type: 'text',
            text: '⚠️ Dynamic tools not available. Please configure ORO Commerce connection first.',
          },
        ],
      };
    }

    try {
      const stats = this.dynamicClient.getEndpointStatistics();
      
      let result = `# 📊 ORO Commerce API Endpoint Statistics\\n\\n`;
      result += `**Total Endpoints Available:** ${stats.totalEndpoints}\\n`;
      result += `**Active Core Tools:** ${stats.activeTools}\\n\\n`;
      result += `ℹ️ *To avoid context overflow, only ${stats.activeTools} core tools are loaded. Use 'search_api_endpoints' and 'execute_api_endpoint' to access all ${stats.totalEndpoints} endpoints.*\\n\\n`;
      
      result += `## 🔧 By HTTP Method:\\n`;
      Object.entries(stats.byMethod)
        .sort(([,a], [,b]) => b - a)
        .forEach(([method, count]) => {
          result += `- ${method}: ${count}\\n`;
        });
      
      result += `\\n## 📂 By Category (Top 10):\\n`;
      Object.entries(stats.byCategory)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 10)
        .forEach(([category, count]) => {
          result += `- ${category}: ${count}\\n`;
        });
      
      result += `\\n## 🎯 Special Endpoints:\\n`;
      result += `- Kit Items: ${stats.withKitItems}\\n`;
      result += `- Orders: ${stats.withOrders}\\n`;
      result += `- Products: ${stats.withProducts}\\n`;
      result += `- Relationships: ${stats.relationships}\\n`;
      
      result += `\\n## 📋 All Categories (${stats.categories.length}):\\n`;
      result += stats.categories.join(', ');
      
      result += `\\n\\n## 🔍 Usage Examples:\\n`;
      result += `- Search for kit items: \`search_api_endpoints\` with query "kitItems"\\n`;
      result += `- Execute kit items API: \`execute_api_endpoint\` with method "GET" and path "/admin/api/products/{id}/kitItems"\\n`;
      result += `- List orders: Use \`search_api_endpoints\` with query "orders"\\n\\n`;
      result += `✅ **Complete API access available via search and execute tools!**`;

      return {
        content: [
          {
            type: 'text',
            text: result,
          },
        ],
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to get endpoint statistics';
      throw new McpError(ErrorCode.InternalError, message);
    }
  }

  private async executeApiEndpoint(args: any) {
    if (!this.dynamicClient) {
      return {
        content: [
          {
            type: 'text',
            text: '⚠️ Dynamic tools not available. Please configure ORO Commerce connection first.',
          },
        ],
      };
    }

    try {
      const { method, path, pathParams, queryParams, requestBody } = args;
      
      if (!method || !path) {
        return {
          content: [
            {
              type: 'text',
              text: '❌ Missing required parameters: method and path are required.',
            },
          ],
        };
      }

      const response = await this.dynamicClient.executeAnyEndpoint(method, path, {
        pathParams,
        queryParams,
        requestBody
      });

      return {
        content: [
          {
            type: 'text',
            text: this.dynamicClient.formatResponse(response),
          },
        ],
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to execute API endpoint';
      throw new McpError(ErrorCode.InternalError, message);
    }
  }

  private async getOroCapabilities() {
    return {
      content: [
        {
          type: 'text',
          text: `# 🏪 ORO Commerce API Capabilities

## Available Data & Operations:

**🛒 Products & Catalog:**
- Product management, variants, attributes, pricing
- Kit items configuration and management
- Categories, inventory levels, product relationships

**📦 Orders & Sales:**
- Order management, line items with kit details
- RFQs (Request for Quotes), shopping lists
- Order status tracking, billing/shipping addresses

**🏢 Accounts & Customers:**
- B2B company accounts and relationships
- Customer users, permissions, contact management
- Account activities (calls, emails, notes, tasks)

**⚙️ Extended Features:**
- Custom fields and entity extensions
- Activity management and tracking
- Organizational structures and hierarchies

## How to Use:
1. **Discover APIs:** Use \`oro_list_endpoints\` to find available endpoints
2. **Execute APIs:** Use \`oro_execute\` to call specific endpoints
3. **Get Help:** Use \`oro_help\` for detailed workflow examples

**Total API Endpoints:** ${this.dynamicClient ? this.dynamicClient.getEndpointStatistics().totalEndpoints : 'Not loaded'}

**💡 Tip:** Start with \`oro_list_endpoints search="kitItems"\` to find kit item management APIs.`,
        },
      ],
    };
  }

  private async listOroEndpoints(args: any) {
    if (!this.dynamicClient) {
      return {
        content: [
          {
            type: 'text',
            text: '⚠️ ORO Commerce not connected. Use \`oro_help\` for setup instructions.',
          },
        ],
      };
    }

    try {
      const { category, search, method, limit = 50 } = args;
      const allEndpoints = (this.dynamicClient as any).allEndpoints || [];
      
      let filteredEndpoints = allEndpoints;

      // Apply filters
      if (category) {
        filteredEndpoints = filteredEndpoints.filter((e: any) => 
          e.tags.includes(category)
        );
      }

      if (search) {
        const searchLower = search.toLowerCase();
        filteredEndpoints = filteredEndpoints.filter((e: any) =>
          e.path.toLowerCase().includes(searchLower) ||
          e.operationId.toLowerCase().includes(searchLower) ||
          e.summary.toLowerCase().includes(searchLower) ||
          e.tags.some((tag: string) => tag.toLowerCase().includes(searchLower))
        );
      }

      if (method) {
        filteredEndpoints = filteredEndpoints.filter((e: any) => 
          e.method.toUpperCase() === method.toUpperCase()
        );
      }

      // Apply limit
      const limitedEndpoints = filteredEndpoints.slice(0, Math.min(limit, 200));

      let result = `# 📋 ORO Commerce API Endpoints\\n\\n`;
      result += `**Found:** ${filteredEndpoints.length} endpoints`;
      if (category) result += ` (category: ${category})`;
      if (search) result += ` (search: ${search})`;
      if (method) result += ` (method: ${method})`;
      result += `\\n`;
      if (limitedEndpoints.length < filteredEndpoints.length) {
        result += `**Showing:** First ${limitedEndpoints.length} results\\n`;
      }
      result += `\\n`;

      limitedEndpoints.forEach((endpoint: any, index: number) => {
        result += `## ${index + 1}. ${endpoint.method} ${endpoint.path}\\n`;
        result += `**ID:** ${endpoint.operationId}\\n`;
        result += `**Summary:** ${endpoint.summary || 'No description'}\\n`;
        result += `**Categories:** ${endpoint.tags.join(', ') || 'None'}\\n`;
        
        const requiredParams = endpoint.parameters.filter((p: any) => p.required);
        if (requiredParams.length > 0) {
          result += `**Required Params:** ${requiredParams.map((p: any) => p.name).join(', ')}\\n`;
        }
        result += `\\n`;
      });

      if (filteredEndpoints.length === 0) {
        result += `No endpoints found. Try different search terms or remove filters.\\n\\n`;
        result += `**Available categories:** Use \`oro_stats\` to see all categories.`;
      }

      return {
        content: [
          {
            type: 'text',
            text: result,
          },
        ],
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to list endpoints';
      throw new McpError(ErrorCode.InternalError, message);
    }
  }

  private async executeOroEndpoint(args: any) {
    if (!this.dynamicClient) {
      return {
        content: [
          {
            type: 'text',
            text: '⚠️ ORO Commerce not connected. Use \`oro_help\` for setup instructions.',
          },
        ],
      };
    }

    try {
      const { endpoint, method, pathParams, queryParams, requestBody } = args;
      
      if (!endpoint || !method) {
        return {
          content: [
            {
              type: 'text',
              text: '❌ Missing required parameters: \`endpoint\` and \`method\` are required.\\n\\nExample: oro_execute endpoint="/admin/api/products" method="GET"',
            },
          ],
        };
      }

      const response = await this.dynamicClient.executeAnyEndpoint(method, endpoint, {
        pathParams,
        queryParams,
        requestBody
      });

      return {
        content: [
          {
            type: 'text',
            text: this.dynamicClient.formatResponse(response),
          },
        ],
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to execute endpoint';
      throw new McpError(ErrorCode.InternalError, message);
    }
  }

  private async getOroHelp() {
    return {
      content: [
        {
          type: 'text',
          text: `# 📚 ORO Commerce API Workflow Guide

## Quick Start:

### 1. Check what's available:
\`\`\`
oro_capabilities
\`\`\`

### 2. Find specific endpoints:
\`\`\`
oro_list_endpoints
oro_list_endpoints search="kitItems"
oro_list_endpoints category="products" 
oro_list_endpoints method="GET"
\`\`\`

### 3. Execute API calls:
\`\`\`
oro_execute
  endpoint: "/admin/api/products"
  method: "GET"
  queryParams: {"page[size]": 10}

oro_execute
  endpoint: "/admin/api/products/{id}/kitItems" 
  method: "GET"
  pathParams: {"id": "123"}
\`\`\`

## Common Workflows:

**Kit Items Management:**
1. \`oro_list_endpoints search="kitItems"\` - Find kit APIs
2. \`oro_execute endpoint="/admin/api/products/{id}/kitItems" method="GET" pathParams={"id":"PRODUCT_ID"}\`

**Order Analysis:**
1. \`oro_list_endpoints search="orders"\` - Find order APIs
2. \`oro_execute endpoint="/admin/api/orders" method="GET"\` - List orders
3. \`oro_execute endpoint="/admin/api/orders/{id}/lineItems" method="GET" pathParams={"id":"ORDER_ID"}\`

**Product Catalog:**
1. \`oro_list_endpoints category="products"\` - All product APIs
2. \`oro_execute endpoint="/admin/api/products" method="GET"\` - List products

## Tips:
- Use \`oro_stats\` for quick overview
- Filter endpoints to find exactly what you need
- Check required parameters before executing`,
        },
      ],
    };
  }

  private async getOroStats() {
    if (!this.dynamicClient) {
      return {
        content: [
          {
            type: 'text',
            text: '⚠️ ORO Commerce not connected. Use \`oro_help\` for setup instructions.',
          },
        ],
      };
    }

    try {
      const stats = this.dynamicClient.getEndpointStatistics();
      
      let result = `# 📊 ORO Commerce API Quick Stats\\n\\n`;
      result += `**Total Endpoints:** ${stats.totalEndpoints}\\n`;
      result += `**Categories:** ${stats.categories.length}\\n`;
      result += `**Kit Items APIs:** ${stats.withKitItems}\\n`;
      result += `**Order APIs:** ${stats.withOrders}\\n`;
      result += `**Product APIs:** ${stats.withProducts}\\n\\n`;
      
      result += `**HTTP Methods:**\\n`;
      Object.entries(stats.byMethod)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 5)
        .forEach(([method, count]) => {
          result += `- ${method}: ${count}\\n`;
        });

      result += `\\n**Top Categories:**\\n`;
      Object.entries(stats.byCategory)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 8)
        .forEach(([category, count]) => {
          result += `- ${category}: ${count}\\n`;
        });

      result += `\\n💡 Use \`oro_list_endpoints\` to explore specific APIs.`;

      return {
        content: [
          {
            type: 'text',
            text: result,
          },
        ],
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to get stats';
      throw new McpError(ErrorCode.InternalError, message);
    }
  }

  private async searchApiEndpoints(args: any) {
    if (!this.dynamicClient) {
      return {
        content: [
          {
            type: 'text',
            text: '⚠️ Dynamic tools not available. Please configure ORO Commerce connection first.',
          },
        ],
      };
    }

    try {
      const { query } = args;
      
      if (!query) {
        return {
          content: [
            {
              type: 'text',
              text: '❌ Missing required parameter: query is required.',
            },
          ],
        };
      }

      const endpoints = this.dynamicClient.searchEndpoints(query);
      
      if (endpoints.length === 0) {
        return {
          content: [
            {
              type: 'text',
              text: `❌ No endpoints found for query: "${query}"\\n\\nTry different search terms like "products", "orders", "kitItems", etc.`,
            },
          ],
        };
      }

      let result = `# 🔍 Search Results for "${query}" (${endpoints.length} found)\\n\\n`;
      
      endpoints.forEach((endpoint, index) => {
        result += `## ${index + 1}. ${endpoint.method} ${endpoint.path}\\n`;
        result += `**Operation ID:** ${endpoint.operationId}\\n`;
        result += `**Summary:** ${endpoint.summary || 'No summary'}\\n`;
        result += `**Tags:** ${endpoint.tags.join(', ') || 'None'}\\n`;
        
        if (endpoint.parameters.length > 0) {
          const requiredParams = endpoint.parameters.filter(p => p.required);
          if (requiredParams.length > 0) {
            result += `**Required Parameters:** ${requiredParams.map(p => p.name).join(', ')}\\n`;
          }
        }
        
        result += `\\n**Usage Example:**\\n`;
        result += `\`\`\`\\n`;
        result += `execute_api_endpoint:\\n`;
        result += `  method: "${endpoint.method}"\\n`;
        result += `  path: "${endpoint.path}"\\n`;
        if (endpoint.parameters.some(p => p.in === 'path')) {
          result += `  pathParams: {${endpoint.parameters.filter(p => p.in === 'path').map(p => `"${p.name}": "value"`).join(', ')}}\\n`;
        }
        result += `\`\`\`\\n\\n`;
      });

      return {
        content: [
          {
            type: 'text',
            text: result,
          },
        ],
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to search endpoints';
      throw new McpError(ErrorCode.InternalError, message);
    }
  }

  private async autoConfigureFromEnv(): Promise<boolean> {
    // Try to load configuration from environment variables
    const oroConfig = {
      shopUrl: process.env.ORO_SHOP_URL,
      clientId: process.env.ORO_CLIENT_ID,
      clientSecret: process.env.ORO_CLIENT_SECRET,
    };

    // Auto-configure if environment variables are present
    if (oroConfig.shopUrl && oroConfig.clientId && oroConfig.clientSecret) {
      console.log('🔧 Found ORO Commerce configuration in environment variables');
      try {
        const validConfig = OroConfigSchema.parse(oroConfig);
        this.oroClient = new OroCommerceClient(validConfig);
        
        console.log('🔌 Testing ORO Commerce connection...');
        const isConnected = await this.oroClient.testConnection();
        
        if (isConnected) {
          console.log('✅ ORO Commerce connection successful!');
          
          // Try to load dynamic tools
          try {
            const swaggerPath = join(process.cwd(), 'oro_commerce_swagger_dump.json');
            this.dynamicClient = new DynamicOroClient(swaggerPath, (this.oroClient as any).axios);
            const toolCount = this.dynamicClient.getAvailableTools().length;
            console.log(`🔧 Initialized ${toolCount} dynamic tools from swagger`);
            console.log(`✅ ORO Commerce auto-configured with ${toolCount} dynamic tools`);
          } catch (error) {
            console.log('⚠️ Swagger schema not found (oro_commerce_swagger_dump.json), only core tools available');
            console.log('✅ ORO Commerce auto-configured from environment (core tools only)');
          }
          return true;
        } else {
          console.log('❌ ORO Commerce connection test failed - check your credentials');
          console.log('✅ ORO Commerce auto-configured from environment (connection test failed)');
          return false;
        }
      } catch (error) {
        console.log('⚠️ ORO Commerce environment config invalid:', error instanceof Error ? error.message : 'Unknown error');
        console.log('💡 Use configure_oro_connection tool to set up manually');
        return false;
      }
    } else {
      console.log('💡 No ORO Commerce configuration found in environment');
      console.log('💡 Use configure_oro_connection tool to set up connection');
      return false;
    }
  }

  async run(): Promise<void> {
    console.log('🚀 Starting ORO Commerce MCP Server...');
    
    // Try auto-configuration
    await this.autoConfigureFromEnv();

    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.log('✅ ORO Commerce MCP Server running on stdio');
  }
}

// Start the server
const server = new OroCommerceMCPServer();
server.run().catch((error) => {
  console.error('❌ Failed to start server:', error);
  process.exit(1);
});