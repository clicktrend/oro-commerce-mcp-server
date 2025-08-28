# Claude Project Configuration

This file contains project-specific information for Claude to better understand and work with the ORO Commerce MCP Server project.

## Project Overview

**Name:** ORO Commerce MCP Server  
**Version:** 0.1.2  
**Type:** Model Context Protocol (MCP) Server  
**Language:** TypeScript/Node.js  
**Purpose:** Dynamic API integration between ORO Commerce and AI assistants

## Project Structure

```
src/
├── index.ts              # Main MCP server implementation
├── oro-client.ts         # ORO Commerce OAuth2 client
├── swagger-parser.ts     # Dynamic schema parser
├── dynamic-client.ts     # API execution engine
└── types.ts              # TypeScript type definitions

dist/                     # Compiled JavaScript output
examples/                 # Usage examples and documentation
```

## Key Technologies

- **MCP (Model Context Protocol)** - Anthropic's protocol for AI tool integration
- **ORO Commerce** - Enterprise B2B e-commerce platform
- **OAuth2** - Authentication with ORO Commerce API
- **Swagger/OpenAPI** - Dynamic tool generation from API schema
- **TypeScript** - Type-safe development

## Development Commands

```bash
# Build the project
npm run build

# Development with watch mode
npm run dev

# Start the server
npm start

# Clean build artifacts
npm run clean
```

## Environment Variables

**Required:**
- `ORO_SHOP_URL` - ORO Commerce instance URL
- `ORO_CLIENT_ID` - OAuth2 client ID
- `ORO_CLIENT_SECRET` - OAuth2 client secret

**Optional:**
- `NODE_ENV=development` - Disables SSL verification for dev environments
- `DISABLE_SSL_VERIFY=true` - Explicitly disable SSL verification
- `DEBUG=mcp:*` - Enable debug logging

## SSL Certificate Handling

The project supports different SSL configurations:
- **Development:** Set `NODE_ENV=development` to ignore self-signed certificates
- **Production with self-signed certs:** Use `DISABLE_SSL_VERIFY=true`
- **Production with valid certs:** No additional configuration needed

## Testing

To test the server functionality:

```bash
# Test OAuth2 connection
export ORO_SHOP_URL="https://your-oro-commerce.com"
export ORO_CLIENT_ID="your_client_id"
export ORO_CLIENT_SECRET="your_client_secret"
export NODE_ENV=development

# Run server
npm start
```

## Key Files

- **`oro_commerce_swagger_dump.json`** - Generated ORO Commerce API schema (required for dynamic tools)
- **`.env`** - Local environment configuration (gitignored)
- **`.mcp.json`** - Claude Code MCP server configuration (gitignored)
- **`.mcp.json.example`** - Example Claude Code MCP configuration template
- **`.claude/`** - Claude Code project settings directory (gitignored)
- **`package.json`** - Node.js dependencies and scripts
- **`CHANGELOG.md`** - Version history and changes

## API Schema Management

The server requires an ORO Commerce Swagger schema file:

```bash
# On ORO Commerce server
console api:swagger:dump > oro_commerce_swagger_dump.json

# Copy to MCP project directory
cp oro_commerce_swagger_dump.json /path/to/mcp-project/
```

## Common Issues

1. **SSL Certificate Errors** - Use `NODE_ENV=development` or `DISABLE_SSL_VERIFY=true`
2. **OAuth2 Authentication Failures** - Check client credentials and API permissions
3. **Missing Dynamic Tools** - Ensure `oro_commerce_swagger_dump.json` is in project root
4. **Connection Timeouts** - Verify ORO Commerce URL and network connectivity

## Release Process

1. Update version in `package.json` and `mcp-registry.json`
2. Update `CHANGELOG.md` with new features/fixes
3. Build and test: `npm run build`
4. Commit changes: `git add -A && git commit`
5. Create tag: `git tag v0.1.x`
6. Push: `git push origin main && git push origin v0.1.x`
7. Create GitHub release: `gh release create v0.1.x`
8. Publish to NPM: `npm publish`

## Dependencies

**Runtime:**
- `@modelcontextprotocol/sdk` - MCP server framework
- `axios` - HTTP client for API requests
- `dotenv` - Environment variable management
- `openapi-types` - TypeScript types for OpenAPI
- `zod` - Schema validation

**Development:**
- `typescript` - TypeScript compiler
- `@types/node` - Node.js type definitions

## Architecture Notes

The server uses a dynamic architecture:
1. **Auto-configuration** - Loads settings from environment variables on startup
2. **Dynamic tool generation** - Creates API tools from Swagger schema at runtime
3. **Smart endpoint selection** - Focuses on most useful ORO Commerce APIs
4. **OAuth2 token management** - Automatic token refresh and error handling