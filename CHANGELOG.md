# Changelog

All notable changes to the ORO Commerce MCP Server will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.2.0] - 2025-01-03

### 🚀 Major Release - Complete API Coverage

### ✨ Breaking Changes
- **COMPLETE API COVERAGE** - Now loads ALL endpoints from swagger schema instead of filtering to "popular" ones
- **Removed 50-tool limit** - All 3500+ API endpoints are now available as MCP tools
- **Removed restrictive filtering** - Only OPTIONS and HEAD methods are excluded, everything else is included

### ✨ New Features
- **📊 New Tool: `get_endpoint_statistics`** - Comprehensive statistics about loaded API endpoints
  - Total endpoints count
  - Breakdown by HTTP method (GET, POST, PUT, DELETE, etc.)
  - Breakdown by category/tags
  - Special counts for Kit Items, Orders, Products, Relationships
  - Complete list of all available categories

### 🔧 Improvements
- **Complete Kit Items Support** - `/admin/api/products/{id}/kitItems` and related endpoints now available
- **Full Order Management** - All order-related endpoints including line items with kit details
- **Comprehensive Product Catalog** - All product endpoints including relationships and complex operations
- **No API Limitations** - Relationships, complex parameters, and all HTTP methods supported

### 🛠️ Technical Changes
- **Modified `dynamic-client.ts`** - Now uses `getAllEndpoints()` instead of `getPopularEndpoints()`
- **Updated `swagger-parser.ts`** - Removed restrictive filtering logic
- **Enhanced logging** - Better console output showing total loaded tools

### 📋 Testing & Development
- **MCP Inspector Support** - Tested with `npx @modelcontextprotocol/inspector`
- **Local Testing** - Confirmed with Command: "node" Arguments: "dist/index.js"
- **Full API Schema Loading** - Verified complete swagger schema processing

### 📊 Statistics
- **Previous:** ~50 tools (limited to "popular" endpoints)
- **Current:** ALL available endpoints from your ORO Commerce API schema
- **Kit Items:** Full support for kit item management
- **Orders:** Complete order processing with line item details
- **Products:** Full product catalog with all relationships

### 🎯 Use Cases Now Supported
- **Complete Kit Item Management** - Create, read, update kit configurations
- **Advanced Order Processing** - Full order lifecycle with detailed line items
- **Comprehensive Product Management** - All product operations and relationships
- **Complete B2B Workflow** - No API limitations for complex business processes

## [0.1.3] - 2024-12-28

### ✨ Features
- **Claude Code Support** - Added `.mcp.json` configuration for project-specific MCP server setup
- **Configuration Templates** - Added `.mcp.json.example` for easy setup
- **Enhanced Documentation** - Updated README with both Claude Desktop and Claude Code configuration examples
- **Project Documentation** - Added `CLAUDE.md` with comprehensive project information for AI assistants

### 🔧 Improvements
- **Simplified Setup** - Copy-paste configuration workflow with example files
- **Better Git Management** - Proper `.gitignore` entries for Claude Code configurations
- **Dual Platform Support** - Works seamlessly with both Claude Desktop and Claude Code
- **Developer Experience** - Clear documentation for different use cases

### 📝 Documentation
- **Claude Code Integration Guide** - Step-by-step setup for project-specific MCP servers
- **Configuration Examples** - Both global (Claude Desktop) and project-specific (Claude Code) setups
- **Project Recognition** - Added attribution for Claude.ai assistance in development

## [0.1.2] - 2024-12-28

### ✨ Features
- **Enhanced SSL Certificate Handling** - Added `DISABLE_SSL_VERIFY` environment variable for production environments with self-signed certificates
- **Improved Auto-Configuration** - Better startup logging and error messages for configuration debugging
- **Enhanced User Experience** - Clearer console output showing configuration status and connection test results

### 🔧 Improvements  
- **Flexible SSL Configuration** - SSL verification can now be disabled with `DISABLE_SSL_VERIFY=true` or `NODE_ENV=development`
- **Better Startup Flow** - More informative messages during auto-configuration and connection testing
- **Documentation Updates** - Clear SSL configuration examples for different deployment scenarios

### 📝 Documentation
- **SSL Configuration Guide** - Added comprehensive SSL certificate handling instructions
- **Environment Examples** - Updated all examples with SSL configuration options
- **Usage Scenarios** - Clear guidance for development vs production SSL handling

## [0.1.1] - 2024-12-28

### 🐛 Bug Fixes
- **CRITICAL: Fixed OAuth2 authentication failure** - Changed Content-Type from application/json to application/x-www-form-urlencoded
- **Fixed token request format** - Use URL-encoded form data instead of JSON for OAuth2 token requests
- **Improved error handling** - OAuth2 requests now follow standard form-encoding as required by ORO Commerce

### 📝 Documentation  
- **Fixed confusing API schema setup instructions** - Clarified that schema file must be copied to MCP project directory
- **Improved README section 3** - Added clear steps for generating schema on ORO server and copying to MCP project
- **Updated usage examples** - Added schema generation step to basic setup workflow

## [0.1.0] - 2024-12-28

### 🚀 Initial Release
- **Dynamic Model Context Protocol server** for ORO Commerce integration
- **Automatic tool generation** from ORO Commerce Swagger/OpenAPI schema
- **30+ tools available** (4 core + 26+ dynamically generated)
- **Self-updating system** - New API endpoints become available automatically

### ✨ Added
- **Dynamic Swagger Parser** (`swagger-parser.ts`) - Parses ORO Commerce API schema
- **Dynamic API Client** (`dynamic-client.ts`) - Executes API calls dynamically
- **Smart endpoint selection** - Focuses on most useful APIs automatically
- **Category-based tool organization** (Accounts, B2B Customers, etc.)
- **Comprehensive error handling** and response formatting
- **Parameter validation** using OpenAPI schema
- **Tool discovery system** (`list_dynamic_tools`, `get_dynamic_tool_info`)

### 🔧 Core Tools
- `configure_oro_connection` - Set up ORO Commerce API connection
- `test_connections` - Verify API connectivity
- `list_dynamic_tools` - Browse all available tools with filtering
- `get_dynamic_tool_info` - Get detailed documentation for specific tools

### 🏪 Dynamic Tools (26+)
Generated automatically from your ORO Commerce API:

**Accounts Management (15 tools)**
- `accounts_get` - List all accounts
- `accounts_id_get` - Get specific account details
- `accounts_id_contacts_get` - Get account contacts
- `accounts_id_b2bcustomers_get` - Get B2B customers
- `accounts_id_activitycalls_get` - Get account calls
- `accounts_id_activityemails_get` - Get account emails
- `accounts_id_activitynotes_get` - Get account notes
- `accounts_id_activitytasks_get` - Get account tasks
- `accounts_id_attachments_get` - Get account attachments
- `accounts_id_customers_get` - Get account customers
- `accounts_id_defaultcontact_get` - Get default contact
- `accounts_id_organization_get` - Get account organization
- `accounts_id_owner_get` - Get account owner
- `accounts_id_referredby_get` - Get referral information
- `accounts_id_tags_get` - Get account tags

**B2B Customer Management (11 tools)**
- `b2bcustomers_get` - List all B2B customers
- `b2bcustomers_id_get` - Get specific customer details
- `b2bcustomers_id_account_get` - Get customer account
- `b2bcustomers_id_activitycalls_get` - Get customer calls
- `b2bcustomers_id_activityemails_get` - Get customer emails
- `b2bcustomers_id_activitytasks_get` - Get customer tasks
- `b2bcustomers_id_billingaddress_get` - Get billing address
- `b2bcustomers_id_contact_get` - Get customer contact
- `b2bcustomers_id_datachannel_get` - Get data channel
- `b2bcustomers_id_organization_get` - Get customer organization
- `b2bcustomers_id_owner_get` - Get customer owner

### 🔐 Security & Performance
- **OAuth2 authentication** with automatic token management
- **Read-only by default** - Safe for production environments
- **Configurable endpoint filtering** - Control which APIs are exposed
- **Comprehensive logging** and debug support
- **Parameter validation** prevents invalid API calls
- **Error handling** with detailed error messages

### 📚 Documentation
- **Complete README rewrite** with professional GitHub/MCP Registry format
- **Usage examples** with real-world scenarios
- **Contributing guidelines** for open source development
- **GitHub Actions CI/CD** pipeline
- **MCP Registry schema** for automatic discovery

### 🏗️ Architecture
- **Modular TypeScript architecture** with clear separation of concerns
- **Dynamic tool generation** system that scales automatically
- **Intelligent endpoint selection** algorithm
- **Response formatting** engine for consistent output
- **Schema validation** using OpenAPI specifications

### 📦 Package & Distribution
- **NPM package optimized** for global installation
- **GitHub repository ready** for open source release
- **MIT License** for maximum compatibility
- **Professional branding** and documentation

### 🔄 Migration from 1.x
- **Breaking change:** All hardcoded tools replaced with dynamic equivalents
- **Configuration:** Same OAuth2 setup process
- **Schema requirement:** Requires `oro_commerce_swagger_dump.json`
- **Tool names:** New naming convention (e.g., `accounts_get` instead of `get_accounts_from_oro`)

### 🛠️ Technical Details
- **Node.js 18+** required
- **TypeScript 5.3+** for development
- **OpenAPI 3.1** schema support
- **3591 total API endpoints** discoverable
- **26 active tools** in initial release
- **176 API categories** available for expansion

### 📋 Requirements
- **ORO Commerce instance** with API access
- **OAuth2 credentials** (Client ID and Secret)
- **Updated Swagger schema** via `console api:swagger:dump`

### 🚀 Installation
```bash
npm install -g oro-commerce-mcp-server
```

### ⚙️ Configuration
```bash
export ORO_SHOP_URL="https://your-oro-commerce.com"
export ORO_CLIENT_ID="your_client_id"
export ORO_CLIENT_SECRET="your_client_secret"
```

### 🎯 Use Cases
- **Customer Relationship Management** - Complete B2B customer lifecycle
- **Sales Analytics** - Order patterns and customer behavior analysis
- **Account Management** - B2B account health monitoring
- **Business Intelligence** - AI-powered insights from ORO Commerce data

---

## [1.0.0] - 2024-11-01

### Added
- Initial release with hardcoded API integrations
- Basic ORO Commerce connectivity
- Manual tool definitions for products, customers, orders
- OAuth2 authentication support

### Deprecated
- All hardcoded API endpoints (replaced by dynamic system in 2.0.0)
- Manual tool definitions (replaced by Swagger-generated tools)