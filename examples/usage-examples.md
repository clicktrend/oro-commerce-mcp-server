# Usage Examples

This document provides practical examples of using the ORO Commerce MCP Server with various AI assistants and MCP clients.

## 🚀 Getting Started

### Basic Setup

1. **Install the server:**
```bash
npm install -g oro-commerce-mcp-server
```

2. **Get API schema from ORO Commerce:**
```bash
# On your ORO Commerce server:
console api:swagger:dump > oro_commerce_swagger_dump.json

# Copy to your MCP project directory:
scp user@oro-server:/path/to/oro_commerce_swagger_dump.json ./oro_commerce_swagger_dump.json
```

3. **Configure your environment:**
```bash
export ORO_SHOP_URL="https://your-oro-commerce.com"
export ORO_CLIENT_ID="your_client_id"
export ORO_CLIENT_SECRET="your_client_secret"

# For self-signed/local certificates:
export NODE_ENV=development
# OR for production with self-signed certs:
export DISABLE_SSL_VERIFY=true
```

4. **Start the server:**
```bash
# In the directory containing oro_commerce_swagger_dump.json
oro-commerce-mcp-server
```

## 💬 Claude Desktop Integration

### Configuration

Add to your Claude Desktop config file (`~/Library/Application Support/Claude/claude_desktop_config.json` on macOS):

```json
{
  "mcpServers": {
    "oro-commerce": {
      "command": "oro-commerce-mcp-server",
      "env": {
        "ORO_SHOP_URL": "https://your-oro-commerce.com",
        "ORO_CLIENT_ID": "your_client_id",
        "ORO_CLIENT_SECRET": "your_client_secret",
        "NODE_ENV": "development"
      }
    }
  }
}
```

### Example Conversations

#### Customer Analysis

**You:** "Show me our top 10 B2B customers and their account details"

**Claude Response:** Using the `b2bcustomers_get` tool...
```json
{
  "name": "b2bcustomers_get",
  "arguments": {
    "page[limit]": 10,
    "sort": "-totalOrderValue"
  }
}
```

#### Account Management

**You:** "Get all contacts for account ID 123 and their recent activities"

**Claude Response:** I'll get the account contacts and activities...
```json
{
  "name": "accounts_id_contacts_get",
  "arguments": {
    "id": "123"
  }
}
```

Then:
```json
{
  "name": "accounts_id_activityemails_get", 
  "arguments": {
    "id": "123"
  }
}
```

#### Discovery and Exploration

**You:** "What tools are available for managing products?"

**Claude Response:** Let me search for product-related tools...
```json
{
  "name": "list_dynamic_tools",
  "arguments": {
    "search": "product"
  }
}
```

## 🔧 Direct API Usage

### Using with MCP Client

```javascript
import { Client } from '@modelcontextprotocol/client';

const client = new Client();
await client.connect('oro-commerce-mcp-server');

// List available tools
const tools = await client.listTools();
console.log('Available tools:', tools.tools.map(t => t.name));

// Get all accounts
const accounts = await client.callTool('accounts_get', {});
console.log('Accounts:', accounts);

// Get specific customer
const customer = await client.callTool('b2bcustomers_id_get', {
  id: '123'
});
console.log('Customer details:', customer);
```

### JSON-RPC Over Stdio

```bash
# Start server
oro-commerce-mcp-server &

# Send requests
echo '{"jsonrpc":"2.0","id":1,"method":"tools/list"}' | oro-commerce-mcp-server
```

## 📊 Business Intelligence Use Cases

### Sales Analysis

**Scenario:** Analyze recent orders and customer trends

```javascript
// Get recent orders
{
  "name": "orders_get",
  "arguments": {
    "filter[createdAt][gte]": "2024-01-01",
    "include": "customer,lineItems",
    "page[limit]": 50
  }
}

// Get top customers
{
  "name": "b2bcustomers_get", 
  "arguments": {
    "sort": "-totalOrderValue",
    "page[limit]": 20
  }
}
```

### Customer Relationship Management

**Scenario:** Review customer communications and follow-ups

```javascript
// Get customer details
{
  "name": "b2bcustomers_id_get",
  "arguments": {
    "id": "customer_id",
    "include": "account,contact,addresses"
  }
}

// Get recent emails
{
  "name": "b2bcustomers_id_activityemails_get",
  "arguments": {
    "id": "customer_id",
    "filter[sentAt][gte]": "2024-01-01"
  }
}

// Get scheduled tasks
{
  "name": "b2bcustomers_id_activitytasks_get",
  "arguments": {
    "id": "customer_id",
    "filter[dueDate][lte]": "2024-12-31"
  }
}
```

### Account Management

**Scenario:** Complete account overview for relationship managers

```javascript
// Get account overview
{
  "name": "accounts_id_get",
  "arguments": {
    "id": "account_id",
    "include": "defaultContact,organization,owner"
  }
}

// Get all B2B customers under this account
{
  "name": "accounts_id_b2bcustomers_get",
  "arguments": {
    "id": "account_id"
  }
}

// Get recent account activities
{
  "name": "accounts_id_activitynotes_get",
  "arguments": {
    "id": "account_id",
    "page[limit]": 10
  }
}
```

## 🛠️ Advanced Configuration

### Custom Tool Selection

Modify `swagger-parser.ts` to include more endpoints:

```javascript
getPopularEndpoints(): SwaggerEndpoint[] {
  const popularTags = [
    'accounts', 'b2bcustomers', 'orders', 'products',
    'categories', 'inventorylevels', 'prices', 'promotions'
  ];
  
  return this.getReadOnlyEndpoints()
    .filter(endpoint => 
      endpoint.tags.some(tag => popularTags.includes(tag))
    );
}
```

### Environment-Specific Configurations

#### Development
```bash
export ORO_SHOP_URL="https://dev-oro.company.com"
export DEBUG="mcp:*"
export NODE_ENV="development"
```

#### Production
```bash
export ORO_SHOP_URL="https://oro.company.com"
export NODE_ENV="production"
```

#### Testing
```bash
export ORO_SHOP_URL="https://test-oro.company.com"
export DEBUG="mcp:error"
```

## 📈 Real-World Scenarios

### Daily Sales Report

**Prompt:** "Create a daily sales summary for yesterday"

The AI will use multiple tools:
1. `orders_get` - Get yesterday's orders
2. `b2bcustomers_get` - Get customer details
3. Analyze and summarize the data

### Customer Onboarding

**Prompt:** "Show me new B2B customers from this month and their initial orders"

The AI will:
1. `b2bcustomers_get` with date filter
2. `orders_get` for each new customer
3. Provide onboarding insights

### Account Health Check

**Prompt:** "Review account health for our top 5 accounts"

The AI will:
1. `accounts_get` with sorting
2. `accounts_id_activityemails_get` for each account
3. `accounts_id_b2bcustomers_get` for customer status
4. Provide health assessment

## 🚨 Troubleshooting Examples

### Authentication Issues

```bash
# Test OAuth2 manually
curl -X POST https://your-oro-commerce.com/oauth2-token \
  -d "grant_type=client_credentials" \
  -d "client_id=your_client_id" \
  -d "client_secret=your_client_secret"
```

### Tool Discovery Problems

```javascript
// Check if tools are being generated
{
  "name": "list_dynamic_tools",
  "arguments": {}
}

// Get info about a specific tool
{
  "name": "get_dynamic_tool_info",
  "arguments": {
    "toolName": "accounts_get"
  }
}
```

### Schema Updates

```bash
# Update schema and restart
console api:swagger:dump > oro_commerce_swagger_dump.json
npm restart
```

## 💡 Tips and Best Practices

### Performance Optimization

1. **Use pagination** for large datasets:
```javascript
{
  "name": "b2bcustomers_get",
  "arguments": {
    "page[limit]": 25,
    "page[offset]": 0
  }
}
```

2. **Filter data appropriately**:
```javascript
{
  "name": "orders_get",
  "arguments": {
    "filter[createdAt][gte]": "2024-01-01",
    "filter[internalStatus.name]": "processing"
  }
}
```

### Data Analysis Workflows

1. **Start broad, then narrow**:
   - List entities first
   - Get specific details for interesting items
   - Use filters to focus on relevant data

2. **Combine multiple tools**:
   - Use account tools with customer tools
   - Correlate activities with business outcomes
   - Build comprehensive views of customer relationships

### Security Considerations

1. **Use read-only operations** by default
2. **Limit API permissions** in ORO Commerce
3. **Rotate OAuth2 credentials** regularly
4. **Monitor API usage** and access logs

---

For more examples and use cases, visit our [GitHub repository](https://github.com/adomio/oro-commerce-mcp-server) or join the [discussions](https://github.com/adomio/oro-commerce-mcp-server/discussions).