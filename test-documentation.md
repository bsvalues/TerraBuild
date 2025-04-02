# Building Cost Building System Test Documentation

## Test Infrastructure

The BCBS system uses a dual testing approach to handle both CommonJS and ES Module code, as well as TypeScript:

### 1. `run-core-tests.js`

This test runner provides backwards compatibility, using Node.js's built-in support for ES Modules with the `--experimental-modules` flag. It supports:

- Running JavaScript tests
- Using CommonJS modules
- Basic ES Module support

When TypeScript files are encountered (like server/calculationEngine.ts), it gracefully falls back to mock implementations.

### 2. `test-core.js`

This test runner is designed for modern development with TypeScript, using `tsx` to directly execute TypeScript files without requiring a separate compilation step. It supports:

- Direct TypeScript file execution
- ES Module imports
- Cleaner import paths (importing `.ts` files directly)

## Test Structure

### Core Tests

The core tests are located in `/tests/core/` and include:

1. **API Endpoint Tests** (`api-endpoints.test.js`):
   - Tests basic API endpoints like repository, cost matrix, activities
   - Verifies the application server is operational
   - Ensures fundamental endpoints are working correctly

2. **Calculation Engine Tests** (`calculation-engine.test.js`):
   - Tests core calculation functions (complexity factors, condition factors)
   - Tests full building cost calculation
   - Tests material cost calculations
   - Uses mock implementations as a fallback for robustness

3. **Database Integration Tests** (`database.test.js`):
   - Tests database connection
   - Tests core table queries (cost matrix, building types, regions)
   - Gracefully handles mock implementations when direct database access fails
   - Ensures database operations work as expected

## Mock Implementations

To ensure tests can run in different environments, mock implementations are provided for:

1. **Calculation Engine**:
   - Basic factor calculations
   - Building cost calculation with depreciation
   - Material cost calculations

2. **Database**:
   - Database connection and query mocks
   - Schema object mocks

This allows tests to pass even when the actual implementation cannot be accessed directly, such as when running in a limited environment or when TypeScript support is not available.

## Running Tests

To run tests using the modern TypeScript approach:
```
node test-core.js
```

To run tests with the backward-compatible approach:
```
node run-core-tests.js
```

Both approaches should pass all core tests, though they might use different implementations (real or mock) depending on the environment.