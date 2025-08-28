# 🏪 ORO Commerce MCP Server

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js](https://img.shields.io/badge/Node.js-18%2B-green.svg)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.3%2B-blue.svg)](https://www.typescriptlang.org/)

A **dynamic Model Context Protocol (MCP) server** that provides seamless integration with ORO Commerce. Automatically generates tools from your ORO Commerce API schema, giving you instant access to all available endpoints through AI assistants like Claude.

## ✨ Features

🚀 **Dynamic API Integration**
- **Automatically discovers all API endpoints** from your ORO Commerce Swagger schema
- **30+ tools generated instantly** - no manual configuration needed
- **Self-updating** - new API endpoints become available automatically
- **Zero hardcoded API calls** - everything generated at runtime

🔧 **Intelligent Tool Generation**
- **Smart endpoint selection** - focuses on most useful APIs first  
- **Automatic parameter validation** using OpenAPI schema
- **Comprehensive error handling** and response formatting
- **Category-based organization** (Accounts, Customers, Products, etc.)

🏪 **Complete ORO Commerce Coverage**
- **Accounts & Customer Management** - Full B2B customer lifecycle
- **Product Catalog & Attributes** - Products, categories, custom fields
- **Order Processing** - Orders, line items, status tracking
- **Activity Management** - Calls, emails, notes, tasks
- **Extended Entities** - Custom fields and entity extensions

🔐 **Enterprise Ready**
- **OAuth2 authentication** with automatic token management
- **Read-only by default** - safe for production environments  
- **Configurable endpoint filtering** - control which APIs are exposed
- **Comprehensive logging** and debug support

## 🚀 Quick Start

### 1. Installation

```bash
npm install -g oro-commerce-mcp-server
```

Or run locally:

```bash
git clone https://github.com/clicktrend/oro-commerce-mcp-server.git
cd oro-commerce-mcp-server
npm install
npm run build
```

### 2. Configure ORO Commerce

Create an OAuth application in your ORO Commerce backend:

1. Go to **System → Integrations → OAuth Applications**
2. Create new application with **Client Credentials** grant type
3. Note the **Client ID** and **Client Secret**
4. Grant API access permissions for entities you want to query

### 3. Update API Schema

Generate and copy your current API schema:

**On your ORO Commerce server:**
```bash
# In your ORO Commerce application directory
console api:swagger:dump > oro_commerce_swagger_dump.json
```

**Copy to your MCP project directory:**
```bash
# Copy the file to where you'll run the MCP server
# Example: scp from remote server
scp user@oro-server:/path/to/oro_commerce_swagger_dump.json ./oro_commerce_swagger_dump.json

# Or: Copy from local ORO Commerce installation
cp /path/to/oro-commerce/oro_commerce_swagger_dump.json ./oro_commerce_swagger_dump.json
```

**Note:** The `oro_commerce_swagger_dump.json` file must be in the same directory where you start the MCP server.

### 4. Start the Server

```bash
# Set environment variables
export ORO_SHOP_URL="https://your-oro-commerce.com"
export ORO_CLIENT_ID="your_client_id"
export ORO_CLIENT_SECRET="your_client_secret"

# For local/development with self-signed certificates:
export NODE_ENV=development
# OR use this for production with self-signed certs:
export DISABLE_SSL_VERIFY=true

# Start server
npm start
```

**SSL Certificate Handling:**
- **Development/Local:** Set `NODE_ENV=development` to automatically ignore SSL certificate errors
- **Production with self-signed certs:** Set `DISABLE_SSL_VERIFY=true` to disable SSL verification
- **Production with valid certs:** No additional configuration needed

### 5. Use with Claude Desktop or Claude Code

**Claude Desktop Configuration:**

Add to your Claude Desktop config:

```json
{
  \"mcpServers\": {
    \"oro-commerce\": {
      \"command\": \"oro-commerce-mcp-server\",
      \"env\": {
        \"ORO_SHOP_URL\": \"https://your-oro-commerce.com\",
        \"ORO_CLIENT_ID\": \"your_client_id\", 
        \"ORO_CLIENT_SECRET\": \"your_client_secret\",
        \"NODE_ENV\": \"development\"
      }
    }
  }
}
```

**Claude Code Configuration:**

For Claude Code projects, copy the example configuration:

```bash
# Copy example configuration
cp .mcp.json.example .mcp.json

# Edit with your credentials
nano .mcp.json
```

Or create `.mcp.json` manually in your project root:

```json
{
  \"mcpServers\": {
    \"oro-commerce\": {
      \"command\": \"oro-commerce-mcp-server\",
      \"env\": {
        \"ORO_SHOP_URL\": \"https://your-oro-commerce.com\",
        \"ORO_CLIENT_ID\": \"your_client_id\",
        \"ORO_CLIENT_SECRET\": \"your_client_secret\",
        \"NODE_ENV\": \"development\"
      },
      \"description\": \"Dynamic ORO Commerce API integration\"
    }
  }
}
```

**Note:** The `.mcp.json` file is automatically loaded by Claude Code on restart and is added to `.gitignore` to prevent credential exposure.

## 🛠️ Available Tools

The server provides **30+ dynamically generated tools**:

### Core Tools (4)
- `configure_oro_connection` - Set up API connection
- `test_connections` - Verify API connectivity  
- `list_dynamic_tools` - Browse all available tools
- `get_dynamic_tool_info` - Get detailed tool documentation

### Dynamic Tools (26+)
Generated automatically from your ORO Commerce API:

**Accounts Management (15 tools)**
- `accounts_get` - List all accounts
- `accounts_id_get` - Get specific account details
- `accounts_id_contacts_get` - Get account contacts
- `accounts_id_b2bcustomers_get` - Get B2B customers
- And more account-related endpoints...

**B2B Customer Management (11+ tools)**  
- `b2bcustomers_get` - List B2B customers
- `b2bcustomers_id_get` - Get customer details
- `b2bcustomers_id_orders_get` - Get customer orders
- And more customer-related endpoints...

**Additional Categories**
- Products & Catalog Management
- Order Processing & Tracking
- Inventory & Pricing
- Activity Management (calls, emails, tasks)
- Custom Entity Extensions

## 📖 Usage Examples

### Basic Data Queries

```javascript
// List all accounts
{
  \"name\": \"accounts_get\",
  \"arguments\": {}
}

// Get specific customer details  
{
  \"name\": \"b2bcustomers_id_get\",
  \"arguments\": { \"id\": \"123\" }
}

// Search tools by category
{
  \"name\": \"list_dynamic_tools\", 
  \"arguments\": { \"category\": \"accounts\" }
}
```

### Advanced Integration

```javascript
// Get comprehensive account data
{
  \"name\": \"accounts_id_get\",
  \"arguments\": { 
    \"id\": \"1\",
    \"include\": \"contacts,addresses,activities\"
  }
}

// Filter B2B customers by criteria
{
  \"name\": \"b2bcustomers_get\",
  \"arguments\": {
    \"filter[name]\": \"Acme Corp\",
    \"page[limit]\": 10
  }
}
```

## ⚙️ Configuration

### Environment Variables

```bash
# Required
ORO_SHOP_URL=https://your-oro-commerce.com
ORO_CLIENT_ID=your_oauth_client_id
ORO_CLIENT_SECRET=your_oauth_client_secret

# Optional  
DEBUG=mcp:*
NODE_ENV=development
DISABLE_SSL_VERIFY=true
```

### Keeping Schema Current

**Important:** Update your API schema regularly to ensure all tools reflect your current ORO Commerce setup:

```bash
# Update schema after:
# - Installing new ORO Commerce bundles
# - Adding custom entities/fields  
# - Upgrading ORO Commerce versions
# - Modifying API configurations

# On ORO Commerce server:
console api:swagger:dump > oro_commerce_swagger_dump.json

# Copy to MCP project directory and restart server:
cp oro_commerce_swagger_dump.json /path/to/mcp-project/
# Restart MCP server to reload tools
```

## 🏗️ Architecture

### Dynamic Tool Generation

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│ ORO Commerce    │───▶│ Swagger Schema   │───▶│ MCP Tools       │
│ API Endpoints   │    │ oro_commerce_    │    │ (Generated      │
│ (3500+ total)   │    │ swagger_dump.json│    │ Automatically)  │
└─────────────────┘    └──────────────────┘    └─────────────────┘
```

### Smart Endpoint Selection

The server intelligently selects the most useful endpoints:
- **Popular entities** (accounts, customers, orders, products)
- **Read-only operations** (safe for production)
- **Well-documented endpoints** with clear parameters
- **Filtered by categories** to avoid overwhelming users

## 🔧 Development

### Project Structure

```
src/
├── index.ts              # Main MCP server
├── oro-client.ts         # ORO Commerce OAuth2 client  
├── swagger-parser.ts     # Dynamic schema parser
├── dynamic-client.ts     # API execution engine
└── types.ts              # TypeScript definitions
```

### Building from Source

```bash
git clone https://github.com/clicktrend/oro-commerce-mcp-server.git
cd oro-commerce-mcp-server
npm install
npm run build
npm start
```

### Extending the Server

```javascript
// Add more endpoint categories in swagger-parser.ts
getEndpointsByTags([
  'products', 'orders', 'categories', 
  'inventory', 'prices', 'promotions'
])
```

## 🚀 Use Cases

### E-commerce Management
- **Customer relationship management** - Access full customer profiles
- **Order processing** - Track orders, line items, and fulfillment  
- **Product catalog management** - Query products, attributes, categories
- **Inventory monitoring** - Check stock levels and availability

### Business Intelligence
- **Sales analytics** - Analyze order patterns and customer behavior
- **Customer insights** - Understand customer lifecycle and preferences
- **Product performance** - Track bestsellers and inventory turnover
- **Account management** - Monitor B2B customer relationships

### Integration & Automation
- **Data synchronization** - Keep external systems in sync with ORO Commerce
- **Report generation** - Create custom reports from ORO Commerce data
- **Workflow automation** - Trigger actions based on ORO Commerce events
- **AI-powered insights** - Use AI assistants to analyze business data

## 🤝 Contributing

We welcome contributions! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

### Quick Contribution Guide

1. **Fork** the repository
2. **Create** a feature branch: `git checkout -b feature/amazing-feature`
3. **Commit** changes: `git commit -m 'Add amazing feature'`
4. **Push** to branch: `git push origin feature/amazing-feature`  
5. **Open** a Pull Request

## 📋 Requirements

- **Node.js 18+** - Runtime environment
- **TypeScript 5.3+** - Development dependency
- **ORO Commerce instance** - With API access enabled
- **OAuth2 credentials** - Client ID and secret from ORO Commerce

## 🐛 Troubleshooting

### Common Issues

**Authentication failures:**
```bash
# Test OAuth2 credentials manually
curl -X POST https://your-oro-commerce.com/oauth2-token \\
  -d \"grant_type=client_credentials&client_id=YOUR_ID&client_secret=YOUR_SECRET\"
```

**Missing tools:**
```bash
# Update your API schema
console api:swagger:dump > oro_commerce_swagger_dump.json
# Restart the server
npm restart
```

**Connection issues:**
```bash
# Enable debug logging
DEBUG=mcp:* npm start
```

### Getting Help

- **Issues:** [GitHub Issues](https://github.com/clicktrend/oro-commerce-mcp-server/issues)
- **Discussions:** [GitHub Discussions](https://github.com/clicktrend/oro-commerce-mcp-server/discussions)
- **Documentation:** [Wiki](https://github.com/clicktrend/oro-commerce-mcp-server/wiki)

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **ORO Commerce** - For providing comprehensive API documentation
- **Model Context Protocol** - For enabling AI assistant integrations
- **Anthropic Claude** - For inspiring intelligent API interactions

---

**Made with ❤️ by [Clicktrend](https://github.com/clicktrend)**  
**Built with [Claude.ai](https://claude.ai) assistance**

*Transform your ORO Commerce data into AI-accessible insights*