# Contributing to Inheritage SDK

Thank you for your interest in contributing to the Inheritage SDK! This document provides guidelines and instructions for contributing to the project.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Setup](#development-setup)
- [Project Structure](#project-structure)
- [Code Style & Conventions](#code-style--conventions)
- [Testing](#testing)
- [Documentation](#documentation)
- [Pull Request Process](#pull-request-process)
- [Commit Message Guidelines](#commit-message-guidelines)
- [License & Attribution](#license--attribution)

---

## Code of Conduct

This project adheres to a code of conduct that all contributors are expected to follow. By participating, you agree to maintain a respectful and inclusive environment for everyone.

### Our Standards

- **Be respectful**: Treat all contributors with respect and kindness
- **Be inclusive**: Welcome newcomers and help them get started
- **Be constructive**: Provide helpful feedback and suggestions
- **Be professional**: Maintain a professional and courteous tone

---

## Getting Started

### Prerequisites

- **Node.js**: Version 18.x or higher
- **npm**: Version 9.x or higher (or yarn/pnpm)
- **Git**: Latest version
- **TypeScript**: Knowledge of TypeScript (v5.4+)

### Fork and Clone

1. Fork the repository on GitHub
2. Clone your fork:
   ```bash
   git clone https://github.com/YOUR_USERNAME/Inheritage-SDK-v1.git
   cd Inheritage-SDK-v1
   ```
3. Add the upstream repository:
   ```bash
   git remote add upstream https://github.com/Inheritage-Foundation/Inheritage-SDK-v1.git
   ```

---

## Development Setup

### Installation

```bash
# Install dependencies
npm install

# Verify installation
npm run lint
npm test
```

### Available Scripts

```bash
# Build the project
npm run build

# Clean build artifacts
npm run clean

# Type checking (no emit)
npm run lint

# Run all tests
npm test

# Run unit tests only
npm run test:unit

# Run tests in watch mode
npm run test:watch

# Build and test before publishing
npm run prepublishOnly
```

### Development Workflow

1. **Create a branch** from `main`:
   ```bash
   git checkout -b feature/your-feature-name
   # or
   git checkout -b fix/your-bug-fix
   # or
   git checkout -b docs/your-documentation-update
   ```

2. **Make your changes** following the [Code Style & Conventions](#code-style--conventions)

3. **Write tests** for your changes (see [Testing](#testing))

4. **Run tests and linting**:
   ```bash
   npm run lint
   npm test
   ```

5. **Build the project** to ensure it compiles:
   ```bash
   npm run build
   ```

6. **Commit your changes** (see [Commit Message Guidelines](#commit-message-guidelines))

7. **Push to your fork**:
   ```bash
   git push origin feature/your-feature-name
   ```

8. **Create a Pull Request** on GitHub

---

## Project Structure

```
sdk/
├── src/                    # Source code
│   ├── client.ts          # Main API client
│   ├── errors.ts          # Error classes
│   ├── types.ts           # TypeScript type definitions
│   ├── hooks.ts           # React hooks
│   ├── langchain.ts       # LangChain integration
│   ├── components/        # React components
│   │   └── InheritageCitation.tsx
│   └── modules/           # Additional modules (if any)
├── tests/                 # Test files
│   ├── client.test.ts    # Client unit tests
│   ├── hooks.test.ts     # Hooks tests
│   ├── langchain.test.ts # LangChain tests
│   └── e2e.test.ts       # End-to-end tests
├── examples/              # Example code
├── docs/                  # Documentation
├── dist/                  # Build output (gitignored)
└── package.json
```

### Key Files

- **`src/client.ts`**: Core API client implementation
- **`src/types.ts`**: TypeScript type definitions (generated from OpenAPI spec)
- **`src/hooks.ts`**: React hooks for data fetching
- **`src/components/InheritageCitation.tsx`**: Attribution component
- **`src/langchain.ts`**: LangChain/LangGraph integration

---

## Code Style & Conventions

### TypeScript

- **Strict Mode**: All code must pass TypeScript strict mode checks
- **Type Safety**: Prefer explicit types over `any`
- **Interfaces**: Use interfaces for object shapes, types for unions/intersections
- **Naming**: Use PascalCase for types/interfaces, camelCase for variables/functions

```typescript
// ✅ Good
export interface ApiResponse<T> {
  data: T | null
  headers: Headers
  rateLimit?: RateLimitInfo
}

// ❌ Bad
export type ApiResponse = {
  data: any
  headers: any
}
```

### Code Formatting

- **Indentation**: 2 spaces (no tabs)
- **Quotes**: Use double quotes for strings
- **Semicolons**: Use semicolons
- **Trailing Commas**: Use trailing commas in multi-line objects/arrays
- **Line Length**: Keep lines under 100 characters when possible

### File Organization

- **Exports**: Use named exports, avoid default exports
- **Imports**: Group imports: external → internal, alphabetical within groups
- **Barrel Exports**: Export from `src/index.ts` for public API

```typescript
// ✅ Good import order
import { describe, it, expect } from "vitest"
import { InheritageClient } from "../src/client"
import type { Heritage } from "../src/types"
```

### Documentation

- **JSDoc Comments**: Document all public APIs with JSDoc
- **Examples**: Include usage examples in JSDoc when helpful
- **Type Annotations**: Prefer type annotations over JSDoc types

```typescript
/**
 * Fetches a heritage site by slug
 * 
 * @param slug - The unique identifier for the heritage site
 * @param options - Optional request options (ETag, conditional requests)
 * @returns Promise resolving to API response with heritage data
 * 
 * @example
 * ```typescript
 * const site = await client.getHeritage('taj-mahal')
 * console.log(site.data?.name)
 * ```
 */
async getHeritage(
  slug: string,
  options?: ApiRequestOptions
): Promise<ApiResponse<Heritage>> {
  // ...
}
```

### Error Handling

- **Custom Errors**: Use `InheritageApiError` for API errors
- **Error Messages**: Provide clear, actionable error messages
- **Error Context**: Include relevant context (status codes, trace IDs)

```typescript
// ✅ Good
throw new InheritageApiError({
  status: response.status,
  code: "NOT_FOUND",
  message: `Heritage site '${slug}' not found`,
  traceId: response.headers.get("X-Trace-Id") ?? undefined,
})

// ❌ Bad
throw new Error("Error")
```

### React Components

- **Functional Components**: Use functional components with TypeScript
- **Props Interface**: Define props interface with descriptive names
- **Default Props**: Use default parameters, not `defaultProps`
- **Accessibility**: Ensure components are accessible

```typescript
// ✅ Good
export interface InheritageCitationProps {
  citation?: CitationEntry
  display?: "inline" | "block"
  showBadge?: boolean
}

export const InheritageCitation: React.FC<InheritageCitationProps> = ({
  citation,
  display = "inline",
  showBadge = false,
}) => {
  // ...
}
```

### React Hooks

- **Hook Naming**: Prefix hooks with `use`
- **Dependencies**: Include all dependencies in dependency arrays
- **Error Handling**: Provide error states in hook return values
- **Loading States**: Include loading states

```typescript
// ✅ Good
export function useHeritage(
  slug: string,
  options?: UseHeritageOptions
): UseHeritageResult {
  const [data, setData] = useState<Heritage | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    // ...
  }, [slug, options?.enabled])

  return { data, loading, error, refetch }
}
```

---

## Testing

### Test Structure

- **Test Files**: Place tests in `tests/` directory, mirroring `src/` structure
- **Test Naming**: Use descriptive test names: `describe("FeatureName", () => { it("should do something", () => {}) })`
- **Test Coverage**: Aim for high coverage, especially for core functionality

### Writing Tests

```typescript
// ✅ Good test structure
describe("InheritageClient", () => {
  let client: InheritageClient
  let fetchMock: ReturnType<typeof vi.fn>

  beforeEach(() => {
    fetchMock = vi.fn()
    globalThis.fetch = fetchMock as unknown as typeof fetch
    client = new InheritageClient()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it("fetches heritage site and returns data", async () => {
    fetchMock.mockResolvedValue(
      new Response(JSON.stringify({ name: "Taj Mahal" }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      })
    )

    const result = await client.getHeritage("taj-mahal")

    expect(result.data).not.toBeNull()
    expect(result.data?.name).toBe("Taj Mahal")
  })
})
```

### Test Categories

- **Unit Tests**: Test individual functions/methods in isolation
- **Integration Tests**: Test interactions between components
- **E2E Tests**: Test full workflows (marked with `e2e` tag)

### Running Tests

```bash
# All tests
npm test

# Unit tests only
npm run test:unit

# Watch mode
npm run test:watch

# Specific test file
npm test tests/client.test.ts
```

### Mocking

- **Fetch API**: Mock `globalThis.fetch` for API tests
- **React Hooks**: Use React Testing Library for component tests
- **Vitest**: Use Vitest's mocking utilities (`vi.fn()`, `vi.mock()`)

---

## Documentation

### Code Documentation

- **Public APIs**: All public functions, classes, and interfaces must have JSDoc comments
- **Parameters**: Document all parameters with `@param`
- **Returns**: Document return values with `@returns`
- **Examples**: Include `@example` for complex APIs

### README Updates

- **Features**: Update README when adding new features
- **Examples**: Add examples for new functionality
- **API Coverage**: Update API coverage section when adding endpoints

### Changelog

- **CHANGELOG.md**: Add entries for all user-facing changes
- **Format**: Follow [Keep a Changelog](https://keepachangelog.com/) format
- **Categories**: Use Added, Changed, Deprecated, Removed, Fixed, Security

```markdown
## [Unreleased]

### Added
- New `useAIVectorIndex` hook for paginated vector data

### Fixed
- ETag caching in React hooks
```

---

## Pull Request Process

### Before Submitting

1. **Update CHANGELOG.md** with your changes
2. **Run tests**: `npm test`
3. **Run linting**: `npm run lint`
4. **Build project**: `npm run build`
5. **Update documentation** if needed

### PR Title Format

Use conventional commit format:
- `feat: Add new useAIVectorIndex hook`
- `fix: Correct ETag caching in hooks`
- `docs: Update README with new examples`
- `test: Add tests for error handling`
- `refactor: Simplify client request logic`

### PR Description Template

```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing
- [ ] Unit tests added/updated
- [ ] Integration tests added/updated
- [ ] E2E tests added/updated
- [ ] Manual testing completed

## Checklist
- [ ] Code follows style guidelines
- [ ] Self-review completed
- [ ] Comments added for complex code
- [ ] Documentation updated
- [ ] CHANGELOG.md updated
- [ ] No new warnings
- [ ] Tests pass locally
```

### Review Process

1. **Automated Checks**: CI will run tests and linting
2. **Code Review**: At least one maintainer will review
3. **Feedback**: Address all review comments
4. **Approval**: PR must be approved before merging

### Merging

- **Squash and Merge**: PRs are typically squashed
- **Commit Message**: Use PR title as commit message
- **Main Branch**: All PRs merge to `main`

---

## Commit Message Guidelines

Follow [Conventional Commits](https://www.conventionalcommits.org/) format:

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Types

- **feat**: New feature
- **fix**: Bug fix
- **docs**: Documentation changes
- **style**: Code style changes (formatting, etc.)
- **refactor**: Code refactoring
- **test**: Adding/updating tests
- **chore**: Maintenance tasks

### Examples

```bash
feat(hooks): Add useAIVectorIndex hook for paginated vector data

fix(client): Correct ETag header handling in conditional requests

docs(readme): Add examples for new AI endpoints

test(client): Add tests for rate limit handling
```

---

## License & Attribution

### Code License

- **SDK Code**: Apache 2.0 License
- **Contributions**: By contributing, you agree to license your code under Apache 2.0

### Data Attribution

- **API Data**: CC BY 4.0 (requires attribution)
- **Attribution Required**: "Data © Inheritage Foundation"
- **Components**: Use `<InheritageCitation />` component for web apps
- **Headers**: SDK automatically includes required headers

### AI Usage

- **AI Data**: See [AI Usage Policy](https://inheritage.foundation/license/ai)
- **Embeddings**: Include `embedding_checksum` and `model_version` in AI responses
- **Metadata**: Include AI metadata headers in responses

---

## Getting Help

### Resources

- **Documentation**: [https://inheritage.foundation/docs](https://inheritage.foundation/docs)
- **API Playground**: [https://inheritage.foundation/docs/playground](https://inheritage.foundation/docs/playground)
- **OpenAPI Spec**: [https://inheritage.foundation/openapi/v1.yaml](https://inheritage.foundation/openapi/v1.yaml)

### Communication

- **Issues**: [GitHub Issues](https://github.com/Inheritage-Foundation/Inheritage-SDK-v1/issues)
- **Email**: [hello@inheritage.foundation](mailto:hello@inheritage.foundation)
- **Discord**: [Join our community](https://discord.gg/inheritage)

### Questions?

If you're unsure about anything:
1. Check existing issues and PRs
2. Ask in a GitHub issue
3. Reach out via email or Discord

---

## Recognition

Contributors will be recognized in:
- CHANGELOG.md (for significant contributions)
- Release notes
- Project documentation

Thank you for contributing to the Inheritage SDK! 🎉

