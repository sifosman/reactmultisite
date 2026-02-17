# Testing Guide for React Multisite

This guide covers the comprehensive test suite for the React Multisite e-commerce application, including all the features we've implemented.

## 🧪 Test Overview

The test suite covers all major functionality:
- ✅ Order number generation
- ✅ Invoice stock management
- ✅ Product search functionality
- ✅ Coupon discount flow
- ✅ Checkout integration tests

## 🚀 Quick Start

### Run All Tests
```bash
npm run test
```

### Run Tests with Coverage
```bash
npm run test:coverage
```

### Run Specific Test Suites
```bash
# Order numbers
npm run test:order-numbers

# Stock management
npm run test:stock-management

# Product search
npm run test:product-search

# Coupons
npm run test:coupons

# Checkout integration
npm run test:checkout
```

### Watch Mode
```bash
# Watch all tests
npm run test:watch

# Watch unit tests only
npm run test:watch:unit

# Watch integration tests only
npm run test:watch:integration
```

### Advanced Test Runner
```bash
# Run all tests with detailed reporting
npm run test:runner

# Run specific suite with runner
npm run test:runner --order-numbers
npm run test:runner --stock-management
npm run test:runner --product-search
npm run test:runner --coupons
npm run test:runner --checkout

# Run with coverage
npm run test:runner --coverage
```

## 📋 Test Suites

### 1. Order Number Generation Tests
**Location**: `src/lib/orders/orderNumbers.test.ts`

**What it tests**:
- ✅ Generates order numbers in ORD-#### format
- ✅ Sequential numbering (ORD-1000, ORD-1001, etc.)
- ✅ Uniqueness of order numbers
- ✅ Customer-friendly format (easy to communicate over phone)
- ✅ Database integration

**Key test cases**:
```typescript
it('should generate order numbers in ORD-#### format')
it('should generate sequential order numbers')
it('should have unique order numbers')
it('should be customer-friendly format')
it('should be easy to communicate over phone')
```

### 2. Invoice Stock Management Tests
**Location**: `src/lib/invoices/stockManagement.test.ts`

**What it tests**:
- ✅ Stock deduction when issuing invoices
- ✅ Stock restoration when canceling invoices
- ✅ Stock adjustment for line quantity updates
- ✅ Stock restoration when removing lines
- ✅ Stock validation (prevents overselling)
- ✅ Product vs variant stock handling

**Key test cases**:
```typescript
it('should deduct stock when issuing an invoice')
it('should restore stock when canceling an issued invoice')
it('should deduct additional stock when increasing line quantity')
it('should restore stock when decreasing line quantity')
it('should restore all stock when removing a line')
it('should prevent issuing invoice with insufficient stock')
```

### 3. Product Search Functionality Tests
**Location**: `src/lib/admin/productSearch.test.ts`

**What it tests**:
- ✅ Weighted search results (exact matches first)
- ✅ Search across multiple fields (name, SKU, description)
- ✅ Exact phrase matching
- ✅ Multi-word searches
- ✅ Search quality indicators
- ✅ Result formatting and stock information

**Key test cases**:
```typescript
it('should return weighted search results')
it('should handle exact phrase matches with highest priority')
it('should search across multiple fields')
it('should classify exact matches correctly')
it('should score exact matches higher than partial matches')
```

### 4. Coupon Discount Flow Tests
**Location**: `src/lib/checkout/coupons.test.ts`

**What it tests**:
- ✅ Coupon calculation logic (percentage vs fixed)
- ✅ Minimum order value validation
- ✅ Yoco payment integration
- ✅ Frontend display logic
- ✅ Database storage in pending_checkouts
- ✅ End-to-end flow consistency

**Key test cases**:
```typescript
it('should calculate percentage discount correctly')
it('should calculate fixed discount correctly')
it('should respect minimum order value')
it('should include coupon discount in total sent to Yoco')
it('should maintain consistency across all stages')
```

### 5. Checkout Integration Tests
**Location**: `src/components/checkout/CheckoutClient.integration.test.tsx`

**What it tests**:
- ✅ Coupon functionality (apply, clear, error handling)
- ✅ Form validation
- ✅ Payment method selection (Yoco vs Bank Transfer)
- ✅ Yoco payment flow
- ✅ Bank transfer flow
- ✅ Cart management
- ✅ Error handling

**Key test cases**:
```typescript
it('should apply coupon and update total')
it('should validate all required fields before submission')
it('should show Yoco as default payment method')
it('should redirect to Yoco when paying with card')
it('should create order when paying with bank transfer')
it('should show empty cart message when cart is empty')
```

## 🔧 Test Configuration

### Vitest Configuration
**File**: `vitest.config.ts`
```typescript
export default defineConfig({
  test: {
    environment: "jsdom",
    setupFiles: "./test/setupTests.ts",
    globals: true,
    include: ["src/**/*.{test,spec}.{ts,tsx}"],
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
    },
  },
});
```

### Test Setup
**File**: `test/setupTests.ts`
```typescript
import "@testing-library/jest-dom";
```

## 📊 Coverage Reports

### Generate Coverage
```bash
npm run test:coverage
```

Coverage reports are generated in the `coverage/` directory:
- `coverage/index.html` - Interactive HTML report
- `coverage/lcov-report/` - Detailed LCOV format
- `coverage/clover.xml` - Clover XML format
- `coverage/coverage-final.json` - JSON format

### Coverage Targets
- **Statements**: 90%+
- **Branches**: 85%+
- **Functions**: 90%+
- **Lines**: 90%+

## 🔄 CI/CD Integration

### GitHub Actions Example
```yaml
name: Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
      - run: npm run test:ci
      - uses: codecov/codecov-action@v3
```

### Test Commands for CI
```bash
# CI with coverage and JUnit reports
npm run test:ci

# Individual suites for parallel testing
npm run test:unit
npm run test:integration
```

## 🐛 Debugging Tests

### Run Tests in Debug Mode
```bash
# Run specific test file
npx vitest run src/lib/orders/orderNumbers.test.ts

# Run with verbose output
npx vitest run --verbose

# Run specific test
npx vitest run -t "should generate order numbers in ORD-#### format"
```

### Common Issues and Solutions

#### 1. Mock Issues
```typescript
// Proper mock setup
vi.mock('@/lib/supabase/admin', () => ({
  createSupabaseAdminClient: vi.fn(),
}));
```

#### 2. Async Test Issues
```typescript
// Use waitFor for async operations
await waitFor(() => {
  expect(screen.getByText(/Coupon applied/)).toBeInTheDocument();
});
```

#### 3. User Event Issues
```typescript
// Use selectOptions for dropdowns
await userEvent.selectOptions(provinceSelect, 'WC');

// Use clear() before typing
await userEvent.clear(input);
await userEvent.type(input, 'text');
```

## 📝 Writing New Tests

### Test File Naming
- Unit tests: `*.test.ts`
- Integration tests: `*.integration.test.tsx`
- Place in same directory as the file being tested

### Test Structure
```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';

describe('Feature Name', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Setup mocks
  });

  it('should do something', () => {
    // Test implementation
    expect(result).toBe(expected);
  });
});
```

### Best Practices
1. **Arrange, Act, Assert** pattern
2. Use descriptive test names
3. Mock external dependencies
4. Test both success and failure cases
5. Keep tests focused and independent
6. Use proper TypeScript typing

## 🚀 Running Tests Before Deployment

### Pre-deployment Checklist
```bash
# 1. Run all tests
npm run test:runner

# 2. Check coverage
npm run test:coverage

# 3. Run linting
npm run lint

# 4. Build the application
npm run build
```

### Automated Pre-commit Hook
```json
// package.json
{
  "husky": {
    "hooks": {
      "pre-commit": "npm run test:runner && npm run lint"
    }
  }
}
```

## 📚 Additional Resources

- [Vitest Documentation](https://vitest.dev/)
- [Testing Library Documentation](https://testing-library.com/)
- [Jest DOM Matchers](https://github.com/testing-library/jest-dom)
- [Mock Service Worker](https://mswjs.io/) for API mocking

## 🤝 Contributing

When adding new features:
1. Write tests for the new functionality
2. Ensure coverage doesn't drop below targets
3. Update this documentation if needed
4. Run the full test suite before submitting

---

**Happy Testing! 🧪**
