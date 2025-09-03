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

**WICHTIG: Vollständiger Release-Prozess - alle Schritte müssen ausgeführt werden!**

### 1. Version Updates
```bash
# Update version in package.json and mcp-registry.json
# Example: "0.1.3" → "0.2.0"
```

### 2. Documentation Updates
```bash
# Update CHANGELOG.md with:
# - New features
# - Breaking changes  
# - Technical changes
# - Testing information
# - Impact/statistics

# Update README.md if needed:
# - New features
# - Installation instructions
# - Usage examples
```

### 3. Build and Test
```bash
npm run build
npm run test  # (currently just exits 0, but run anyway)
```

### 4. Git Commit and Tag
```bash
git add -A
git status  # Check what will be committed
git commit -m "Release vX.X.X: Description

🚀 Major Features:
- Feature 1
- Feature 2

🔧 Technical Changes:  
- Change 1
- Change 2

🤖 Generated with [Claude Code](https://claude.ai/code)

Co-Authored-By: Claude <noreply@anthropic.com>"

git tag vX.X.X
```

### 5. Push to Repository
```bash
git push origin main
git push origin vX.X.X
```

### 6. Create GitHub Release
```bash
gh release create vX.X.X --title "vX.X.X: Release Title" --notes "Detailed release notes..."
```

### 7. **CRITICAL: Publish to NPM**
```bash
npm publish
# ⚠️ WICHTIG: Dieser Schritt wird oft vergessen!
# Das Package ist erst nach npm publish in npmjs.org verfügbar!
```

### 8. Verification
```bash
# Verify NPM publication
npm view oro-commerce-mcp-server@X.X.X

# Verify GitHub release
# Check: https://github.com/clicktrend/oro-commerce-mcp-server/releases
```

### ✅ Checklist für jeden Release:
- [ ] package.json version updated
- [ ] mcp-registry.json version updated  
- [ ] CHANGELOG.md updated
- [ ] README.md updated (if needed)
- [ ] Build successful (`npm run build`)
- [ ] Git commit created
- [ ] Git tag created
- [ ] Pushed to GitHub (`git push origin main && git push origin vX.X.X`)
- [ ] GitHub release created (`gh release create`)
- [ ] **NPM published** (`npm publish`) - **NICHT VERGESSEN!**
- [ ] NPM publication verified (`npm view oro-commerce-mcp-server@X.X.X`)

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