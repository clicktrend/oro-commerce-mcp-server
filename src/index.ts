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
      const staticTools = [
        {
          name: 'configure_oro_connection',
          description: 'Configure ORO Commerce API connection settings',
          inputSchema: {
            type: 'object',
            properties: {
              shopUrl: {
                type: 'string',
                description: 'ORO Commerce shop URL (e.g., https://your-store.com)',
              },
              clientId: {
                type: 'string',
                description: 'OAuth2 Client ID',
              },
              clientSecret: {
                type: 'string',
                description: 'OAuth2 Client Secret',
              },
            },
            required: ['shopUrl', 'clientId', 'clientSecret'],
          },
        },
        {
          name: 'test_connections',
          description: 'Test ORO Commerce API connection',
          inputSchema: {
            type: 'object',
            properties: {},
          },
        },
        {
          name: 'list_dynamic_tools',
          description: 'List all dynamically generated tools from ORO Commerce API',
          inputSchema: {
            type: 'object',
            properties: {
              category: {
                type: 'string',
                description: 'Filter tools by category/tag',
              },
              search: {
                type: 'string',
                description: 'Search tools by name or description',
              },
            },
          },
        },
        {
          name: 'get_dynamic_tool_info',
          description: 'Get detailed information about a specific dynamic tool',
          inputSchema: {
            type: 'object',
            properties: {
              toolName: {
                type: 'string',
                description: 'Name of the dynamic tool to get info for',
              },
            },
            required: ['toolName'],
          },
        },
        ];

      // Add dynamic tools if available
      const dynamicTools = this.dynamicClient ? 
        this.dynamicClient.getAvailableTools().map(tool => ({
          name: tool.toolName,
          description: tool.description,
          inputSchema: tool.inputSchema
        })) : [];

      return {
        tools: [...staticTools, ...dynamicTools]
      };
    });

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      try {
        switch (name) {
          case 'configure_oro_connection':
            return await this.configureOroConnection(args);
          
          case 'test_connections':
            return await this.testConnections();

          case 'list_dynamic_tools':
            return await this.listDynamicTools(args);

          case 'get_dynamic_tool_info':
            return await this.getDynamicToolInfo(args);
          
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