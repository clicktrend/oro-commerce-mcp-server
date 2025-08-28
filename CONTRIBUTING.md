# Contributing to ORO Commerce MCP Server

Thank you for your interest in contributing to the ORO Commerce MCP Server! This document provides guidelines and information for contributors.

## 🤝 How to Contribute

### Reporting Issues

Before creating a new issue, please:

1. **Search existing issues** to avoid duplicates
2. **Use the issue template** provided
3. **Include detailed information**:
   - ORO Commerce version
   - Node.js version
   - Operating system
   - Steps to reproduce
   - Expected vs actual behavior
   - Relevant logs or error messages

### Suggesting Features

We welcome feature suggestions! Please:

1. **Check existing feature requests** first
2. **Describe the use case** clearly
3. **Explain the expected behavior**
4. **Consider the scope** - will this benefit other users?

### Code Contributions

1. **Fork the repository**
2. **Create a feature branch**: `git checkout -b feature/your-feature-name`
3. **Make your changes** following our coding standards
4. **Test your changes** thoroughly
5. **Commit with clear messages**: `git commit -m "Add: your feature description"`
6. **Push to your fork**: `git push origin feature/your-feature-name`
7. **Create a Pull Request**

## 📋 Development Setup

### Prerequisites

- Node.js 18+
- npm or yarn
- ORO Commerce instance for testing
- Git

### Local Development

```bash
# Clone your fork
git clone https://github.com/YOUR_USERNAME/oro-commerce-mcp-server.git
cd oro-commerce-mcp-server

# Install dependencies
npm install

# Create environment file
cp .env.example .env
# Edit .env with your ORO Commerce credentials

# Build the project
npm run build

# Start development server
npm run dev
```

### Testing Your Changes

```bash
# Build and test
npm run build
npm start

# In another terminal, test with the MCP client
node -e "
import('./dist/swagger-parser.js').then(({ SwaggerParser }) => {
  const parser = new SwaggerParser('./oro_commerce_swagger_dump.json');
  console.log('Tools generated:', parser.generateMCPTools(parser.getPopularEndpoints()).length);
});
"
```

## 🎯 Coding Standards

### TypeScript Guidelines

- **Use TypeScript** for all new code
- **Define interfaces** for data structures
- **Use strict type checking**
- **Document complex functions** with JSDoc

### Code Style

- **Use 2 spaces** for indentation
- **Use semicolons** consistently
- **Use single quotes** for strings
- **Follow naming conventions**:
  - `camelCase` for variables and functions
  - `PascalCase` for classes and interfaces
  - `UPPER_SNAKE_CASE` for constants

### API Integration

When adding new API integrations:

- **Use the dynamic system** - don't hardcode endpoints
- **Add appropriate error handling**
- **Include parameter validation**
- **Test with real ORO Commerce data**
- **Update documentation**

### Example Code Structure

```typescript
// Good: Dynamic endpoint handling
async executeEndpoint(endpoint: SwaggerEndpoint, options: DynamicRequestOptions): Promise<DynamicResponse> {
  try {
    // Validate parameters
    const validation = this.validateArguments(endpoint, options);
    if (!validation.valid) {
      throw new Error(`Invalid arguments: ${validation.errors.join(', ')}`);
    }
    
    // Execute request
    const response = await this.axiosClient.request(config);
    
    return {
      success: true,
      data: response.data,
      statusCode: response.status
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
      statusCode: error.response?.status
    };
  }
}
```

## 🧪 Testing Guidelines

### Manual Testing

1. **Test with real ORO Commerce instance**
2. **Verify all generated tools work**
3. **Test error scenarios**
4. **Check authentication handling**
5. **Validate response formatting**

### Integration Testing

```bash
# Test swagger parsing
npm run build
node -e "
const parser = require('./dist/swagger-parser.js').SwaggerParser;
const p = new parser('./oro_commerce_swagger_dump.json');
console.log('Endpoints:', p.getAllEndpoints().length);
console.log('Popular:', p.getPopularEndpoints().length);
"
```

## 📚 Documentation

### Code Documentation

- **Document all public methods** with JSDoc
- **Include parameter descriptions**
- **Provide usage examples**
- **Document complex algorithms**

### README Updates

When adding features, update:
- **Feature list**
- **Usage examples**
- **Configuration options**
- **Troubleshooting section**

## 🔄 Pull Request Process

### Before Submitting

- [ ] **Code builds successfully** (`npm run build`)
- [ ] **All existing functionality works**
- [ ] **New features are documented**
- [ ] **Commit messages are clear**
- [ ] **No sensitive data in commits**

### PR Description Template

```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Documentation update
- [ ] Performance improvement
- [ ] Code refactoring

## Testing
- [ ] Tested with real ORO Commerce instance
- [ ] All generated tools work correctly
- [ ] Error handling tested

## Checklist
- [ ] Code follows style guidelines
- [ ] Self-review completed
- [ ] Documentation updated
- [ ] No breaking changes (or documented)
```

### Review Process

1. **Automated checks** must pass
2. **Code review** by maintainer
3. **Testing** with different ORO Commerce versions
4. **Approval** and merge

## 🏗️ Architecture Guidelines

### Dynamic System Design

The server uses a dynamic architecture. When contributing:

- **Don't hardcode API endpoints** - use the swagger parser
- **Make tools discoverable** through the dynamic system
- **Handle schema variations** gracefully
- **Support different ORO Commerce versions**

### Adding New Categories

To add support for new ORO Commerce entity types:

```typescript
// In swagger-parser.ts
getPopularEndpoints(): SwaggerEndpoint[] {
  const popularTags = [
    'accounts', 'b2bcustomers', 'orders', 'products', 
    'categories', 'inventorylevels', 'rfqs',
    'your-new-category' // Add here
  ];
  // ... rest of method
}
```

## ❓ Questions?

- **GitHub Discussions**: For general questions
- **GitHub Issues**: For bug reports and feature requests
- **Email**: For security-related issues

## 📜 Code of Conduct

This project follows a standard code of conduct:

- **Be respectful** to all contributors
- **Provide constructive feedback**
- **Focus on the code, not the person**
- **Help others learn and grow**

## 🎉 Recognition

Contributors will be:
- **Listed in the contributors section**
- **Mentioned in release notes** for significant contributions
- **Given credit** in documentation

Thank you for contributing to the ORO Commerce MCP Server! 🚀