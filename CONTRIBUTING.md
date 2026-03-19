# Contributing to @inheritage-foundation/sdk

Thank you for your interest in contributing to the Inheritage SDK! This document provides guidelines and instructions for contributing.

## 🌟 How to Contribute

### Reporting Bugs

Before creating bug reports, please check existing issues. When creating a bug report, include:

- **Clear title and description**
- **Steps to reproduce** the behavior
- **Expected vs actual behavior**
- **Screenshots** if applicable
- **Environment details** (Node version, SDK version, OS)

**Example:**
```markdown
**Bug**: useHeritage hook doesn't refetch on slug change

**Steps to Reproduce:**
1. Create component with useHeritage('site-a')
2. Change slug to 'site-b'
3. Hook returns old data

**Expected:** New site data
**Actual:** Cached data from first site

**Environment:**
- SDK: 0.3.0
- React: 19.0.0
- Node: 20.10.0
```

### Suggesting Features

Feature suggestions are welcome! Please provide:

- **Use case**: Why is this feature needed?
- **Proposed API**: How should it work?
- **Examples**: Code snippets showing usage

### Pull Requests

1. **Fork** the repository
2. **Create a branch** from `main`:
   ```bash
   git checkout -b feature/amazing-feature
   ```
3. **Make your changes**
4. **Run tests**:
   ```bash
   npm test
   npm run lint
   ```
5. **Commit** with clear messages:
   ```bash
   git commit -m "feat: add amazing feature"
   ```
6. **Push** and create a PR

## 📋 Development Setup

### Prerequisites

- Node.js >= 18.0.0
- npm >= 9.0.0

### Installation

```bash
# Clone your fork
git clone https://github.com/your-username/Inheritage-SDK-v1.git
cd Inheritage-SDK-v1

# Install dependencies
npm install

# Build the SDK
npm run build

# Run tests
npm test
```

### Development Workflow

```bash
# Watch mode for development
npm run test:watch

# Build and test
npm run build && npm test

# Check TypeScript types
npm run lint
```

## 🏗️ Code Style

### TypeScript

- Use **strict mode** (`strict: true`)
- Prefer **interfaces** for public APIs
- Use **type aliases** for unions
- Add **JSDoc** comments for public methods

```typescript
/**
 * Fetch heritage site by slug
 * @param slug - Heritage site identifier
 * @param options - Request options
 * @returns Heritage site data
 */
export async function getHeritage(
  slug: string,
  options?: ApiRequestOptions
): Promise<ApiResponse<Heritage>> {
  // Implementation
}
```

### Testing

- Write **unit tests** for all public methods
- Aim for **80%+ coverage**
- Use **descriptive test names**:
  ```typescript
  it('fetches heritage site by slug', async () => {
    // Test implementation
  })
  
  it('throws error for non-existent slug', async () => {
    // Test implementation
  })
  ```

### Documentation

- Update **README.md** for new features
- Add **JSDoc** comments
- Include **usage examples**

## 📦 Release Process

### Versioning

We follow [Semantic Versioning](https://semver.org/):

- **MAJOR** (1.0.0 → 2.0.0): Breaking changes
- **MINOR** (0.2.0 → 0.3.0): New features (backward compatible)
- **PATCH** (0.2.0 → 0.2.1): Bug fixes

### Publishing

1. Update version in `package.json`
2. Update `CHANGELOG.md`
3. Create release notes
4. Publish to npm:
   ```bash
   npm publish
   ```

## 🎯 Areas Needing Contribution

### High Priority

- [ ] Add tests for all React hooks (currently 11 untested)
- [ ] Add more React components (`<HeritageCard />`, `<HeritageMap />`)
- [ ] Add API key authentication support
- [ ] Add runtime validation with Zod

### Medium Priority

- [ ] Add Svelte hooks
- [ ] Add Vue hooks
- [ ] Add Next.js Server Components support
- [ ] Add offline caching support

### Low Priority

- [ ] Add more language translations
- [ ] Add CLI tool for batch operations
- [ ] Add GraphQL adapter

## 💬 Questions?

- **General questions**: [GitHub Discussions](https://github.com/Inheritage-Foundation/Inheritage-SDK-v1/discussions)
- **Bug reports**: [GitHub Issues](https://github.com/Inheritage-Foundation/Inheritage-SDK-v1/issues)
- **Discord**: [Join our community](https://discord.gg/inheritage)
- **Contact Ayush**: [ayush.studio](https://ayush.studio)

## 📜 Code of Conduct

Please read our [Code of Conduct](./CODE_OF_CONDUCT.md) to understand expected behavior.

## 🙏 Thank You!

Your contributions make open source great! Every PR, issue, and discussion helps improve the SDK for everyone.

---

**Designed & Maintained by [Ayush Mishra](https://ayush.studio)** • **Team Inheritage**
