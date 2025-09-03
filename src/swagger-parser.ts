import { readFileSync } from 'fs';
import { join } from 'path';
import type { OpenAPIV3 } from 'openapi-types';

export interface SwaggerEndpoint {
  path: string;
  method: string;
  operationId: string;
  summary: string;
  description: string;
  parameters: SwaggerParameter[];
  tags: string[];
  requestBody?: SwaggerRequestBody;
  responses: Record<string, SwaggerResponse>;
}

export interface SwaggerParameter {
  name: string;
  in: 'query' | 'path' | 'header' | 'cookie';
  description?: string;
  required: boolean;
  schema: any;
  example?: any;
}

export interface SwaggerRequestBody {
  description?: string;
  required: boolean;
  content: Record<string, any>;
}

export interface SwaggerResponse {
  description: string;
  content?: Record<string, any>;
}

export interface ParsedOperation {
  toolName: string;
  description: string;
  inputSchema: any;
  endpoint: SwaggerEndpoint;
}

export class SwaggerParser {
  private swaggerDoc: OpenAPIV3.Document;

  constructor(swaggerFilePath: string) {
    const swaggerContent = readFileSync(swaggerFilePath, 'utf-8');
    this.swaggerDoc = JSON.parse(swaggerContent);
  }

  /**
   * Get all available endpoints from swagger
   */
  getAllEndpoints(): SwaggerEndpoint[] {
    const endpoints: SwaggerEndpoint[] = [];
    
    for (const [path, pathItem] of Object.entries(this.swaggerDoc.paths || {})) {
      if (!pathItem || typeof pathItem !== 'object') continue;

      for (const [method, operation] of Object.entries(pathItem)) {
        if (!operation || typeof operation !== 'object' || method === 'parameters') continue;
        
        const op = operation as OpenAPIV3.OperationObject;
        
        endpoints.push({
          path,
          method: method.toUpperCase(),
          operationId: op.operationId || `${method}_${path.replace(/[^a-zA-Z0-9]/g, '_')}`,
          summary: op.summary || '',
          description: op.description || '',
          parameters: this.parseParameters(op.parameters || []),
          tags: op.tags || [],
          requestBody: this.parseRequestBody(op.requestBody),
          responses: this.parseResponses(op.responses || {})
        });
      }
    }

    return endpoints;
  }

  /**
   * Filter endpoints by tags (categories)
   */
  getEndpointsByTags(tags: string[]): SwaggerEndpoint[] {
    return this.getAllEndpoints().filter(endpoint => 
      endpoint.tags.some(tag => tags.includes(tag))
    );
  }

  /**
   * Get endpoints that are suitable for read operations (GET requests)
   */
  getReadOnlyEndpoints(): SwaggerEndpoint[] {
    return this.getAllEndpoints().filter(endpoint => 
      endpoint.method === 'GET'
    );
  }

  /**
   * Convert swagger endpoints to MCP tool definitions
   */
  generateMCPTools(endpoints: SwaggerEndpoint[]): ParsedOperation[] {
    const tools: ParsedOperation[] = [];

    for (const endpoint of endpoints) {
      // Skip if endpoint is too complex or not suitable
      if (this.shouldSkipEndpoint(endpoint)) {
        continue;
      }

      const toolName = this.generateToolName(endpoint);
      const inputSchema = this.generateInputSchema(endpoint);
      const description = this.generateToolDescription(endpoint);

      tools.push({
        toolName,
        description,
        inputSchema,
        endpoint
      });
    }

    return tools;
  }

  /**
   * Generate a clean tool name from endpoint
   */
  private generateToolName(endpoint: SwaggerEndpoint): string {
    let name = endpoint.operationId;
    
    // Clean up operation ID
    if (!name) {
      const pathParts = endpoint.path.split('/').filter(p => p && !p.startsWith('{'));
      const resourceName = pathParts[pathParts.length - 1] || 'resource';
      name = `${endpoint.method.toLowerCase()}_${resourceName}`;
    }

    // Convert to snake_case and clean up
    return name
      .replace(/[^a-zA-Z0-9]/g, '_')
      .replace(/_+/g, '_')
      .replace(/^_|_$/g, '')
      .toLowerCase();
  }

  /**
   * Generate tool description from swagger info
   */
  private generateToolDescription(endpoint: SwaggerEndpoint): string {
    let description = endpoint.summary || endpoint.description || '';
    
    if (!description) {
      const resourceName = endpoint.path.split('/').pop()?.replace(/[{}]/g, '') || 'resource';
      description = `${endpoint.method} ${resourceName} from ORO Commerce API`;
    }

    // Add method and path info
    description += `\\n\\n**Endpoint:** ${endpoint.method} ${endpoint.path}`;
    
    if (endpoint.tags.length > 0) {
      description += `\\n**Categories:** ${endpoint.tags.join(', ')}`;
    }

    return description;
  }

  /**
   * Generate JSON schema for MCP tool input
   */
  private generateInputSchema(endpoint: SwaggerEndpoint): any {
    const properties: any = {};
    const required: string[] = [];

    // Add path parameters
    for (const param of endpoint.parameters.filter(p => p.in === 'path')) {
      if (param.required) {
        required.push(param.name);
      }
      properties[param.name] = {
        type: this.convertSwaggerTypeToJsonSchema(param.schema),
        description: param.description || `${param.name} parameter`
      };
    }

    // Add query parameters
    for (const param of endpoint.parameters.filter(p => p.in === 'query')) {
      if (param.required) {
        required.push(param.name);
      }
      properties[param.name] = {
        type: this.convertSwaggerTypeToJsonSchema(param.schema),
        description: param.description || `${param.name} parameter`
      };
    }

    // Add request body if present
    if (endpoint.requestBody && endpoint.requestBody.required) {
      properties['requestBody'] = {
        type: 'object',
        description: endpoint.requestBody.description || 'Request body data'
      };
      required.push('requestBody');
    }

    return {
      type: 'object',
      properties,
      required: required.length > 0 ? required : undefined
    };
  }

  /**
   * Check if endpoint should be skipped for MCP tools
   */
  private shouldSkipEndpoint(endpoint: SwaggerEndpoint): boolean {
    // Only skip OPTIONS and HEAD methods for cleaner tools
    if (endpoint.method === 'OPTIONS') return true;
    if (endpoint.method === 'HEAD') return true;
    
    // Keep all other endpoints (including relationships, complex parameters, etc.)
    return false;
  }

  /**
   * Parse swagger parameters
   */
  private parseParameters(parameters: (OpenAPIV3.ParameterObject | OpenAPIV3.ReferenceObject)[]): SwaggerParameter[] {
    const parsed: SwaggerParameter[] = [];

    for (const param of parameters) {
      // Skip reference objects for now
      if ('$ref' in param) continue;

      const p = param as OpenAPIV3.ParameterObject;
      parsed.push({
        name: p.name,
        in: p.in as any,
        description: p.description,
        required: p.required || false,
        schema: p.schema,
        example: p.example
      });
    }

    return parsed;
  }

  /**
   * Parse request body
   */
  private parseRequestBody(requestBody?: OpenAPIV3.RequestBodyObject | OpenAPIV3.ReferenceObject): SwaggerRequestBody | undefined {
    if (!requestBody || '$ref' in requestBody) return undefined;

    return {
      description: requestBody.description,
      required: requestBody.required || false,
      content: requestBody.content || {}
    };
  }

  /**
   * Parse responses
   */
  private parseResponses(responses: OpenAPIV3.ResponsesObject): Record<string, SwaggerResponse> {
    const parsed: Record<string, SwaggerResponse> = {};

    for (const [code, response] of Object.entries(responses)) {
      if ('$ref' in response) continue;

      parsed[code] = {
        description: response.description,
        content: response.content
      };
    }

    return parsed;
  }

  /**
   * Convert swagger schema type to JSON schema type
   */
  private convertSwaggerTypeToJsonSchema(schema: any): string {
    if (!schema) return 'string';
    if (schema.type) return schema.type;
    if (schema.format === 'int32' || schema.format === 'int64') return 'integer';
    return 'string';
  }

  /**
   * Get popular/commonly used endpoints
   */
  getPopularEndpoints(): SwaggerEndpoint[] {
    const popularTags = [
      'accounts', 'b2bcustomers', 'orders', 'products', 
      'categories', 'inventorylevels', 'rfqs'
    ];
    
    return this.getReadOnlyEndpoints()
      .filter(endpoint => 
        endpoint.tags.some(tag => popularTags.includes(tag)) ||
        popularTags.some(tag => endpoint.path.includes(tag))
      )
      .slice(0, 50); // Limit to most important ones
  }
}