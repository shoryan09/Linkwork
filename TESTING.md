# LinkWork Testing Suite

This document describes the comprehensive Jest testing suite for the LinkWork freelancing platform.

## Quick Start

### Install Dependencies

```bash
# Install all dependencies (including test dependencies)
pnpm install

# Or if using npm
npm install
```

### Run Tests

```bash
# Run all tests
pnpm test

# Run tests in watch mode (great for development)
pnpm test:watch

# Run tests with coverage report
pnpm test:coverage

# Run tests for CI (no watch, with coverage)
pnpm test:ci

# Update test snapshots
pnpm test:update
```

## Test Structure

```
__tests__/
├── components/          # Component tests
│   ├── navbar.test.tsx
│   └── protected-route.test.tsx
├── context/            # Context provider tests
│   ├── auth-context.test.tsx
│   └── data-context.test.tsx
├── hooks/              # Custom hook tests
│   ├── use-mobile.test.ts
│   └── use-toast.test.ts
├── lib/                # Utility function tests
│   └── utils.test.ts
├── integration/        # Integration tests
│   └── auth-flow.test.tsx
└── utils/             # Test utilities
    └── test-utils.tsx
```

## What's Tested

### ✅ Authentication System
- User registration and login
- Role-based access (client/freelancer)
- Session persistence
- Protected routes
- Logout functionality

### ✅ Data Management
- Project creation and management
- Proposal submission and approval
- Local storage persistence
- Data context providers

### ✅ UI Components
- Navigation with authentication states
- Protected route behavior
- Toast notifications
- Responsive design hooks

### ✅ Utilities
- Class name merging (Tailwind CSS)
- Custom React hooks
- Helper functions

## Test Utilities

The test suite includes helpful utilities in `__tests__/utils/test-utils.tsx`:

- `renderWithProviders()` - Render components with all context providers
- `createMockUser()` - Generate test user data
- `createMockProject()` - Generate test project data
- `createMockProposal()` - Generate test proposal data
- `resetAllMocks()` - Reset all mocks between tests

## Custom Matchers

```typescript
// Email validation
expect('user@example.com').toBeValidEmail()

// Price validation
expect(5000).toHaveValidPrice()
```

## Coverage Goals

The test suite maintains high coverage standards:
- **Lines**: 80%
- **Statements**: 80%
- **Functions**: 80%
- **Branches**: 70%

## Adding New Tests

### Component Tests
1. Create test file in `__tests__/components/`
2. Import the component and testing utilities
3. Mock any external dependencies
4. Write test cases for different states and interactions

### Integration Tests
1. Create test file in `__tests__/integration/`
2. Focus on user workflows and component interactions
3. Test data flow between contexts
4. Include error scenarios

## Debugging Tests

### Common Issues

1. **Module not found errors**
   - Check `tsconfig.json` path mapping
   - Verify Jest `moduleNameMapping` in `jest.config.js`

2. **Async test failures**
   - Use `waitFor()` for async operations
   - Check mock implementations

3. **Context provider errors**
   - Use `renderWithProviders()` helper
   - Ensure all required providers are wrapped

### Debug Mode

```bash
# Run specific test file
pnpm test navbar.test.tsx

# Run tests matching pattern
pnpm test auth

# Debug with verbose output
pnpm test --verbose
```

## Mocked Dependencies

The test suite mocks the following:
- Next.js router (`next/navigation`)
- Browser APIs (`localStorage`, `sessionStorage`, `matchMedia`)
- Crypto API (`crypto.randomUUID`)
- Context providers (when testing components in isolation)

## Best Practices

1. **Test user behavior, not implementation details**
2. **Use descriptive test names**
3. **Keep tests focused and isolated**
4. **Mock external dependencies**
5. **Test both happy path and error scenarios**
6. **Use factory functions for test data**
7. **Clean up after each test**

## Contributing

When adding new features:
1. Write tests for new components/functions
2. Update existing tests if behavior changes
3. Maintain coverage thresholds
4. Add integration tests for new workflows

## Performance

Tests are optimized for speed:
- Parallel execution enabled
- Efficient mocking strategies
- Fast setup and teardown
- Minimal DOM operations

The full test suite should complete in under 30 seconds on most machines.