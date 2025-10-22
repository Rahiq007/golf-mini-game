# Testing Setup Guide for Golf Mini-Game

This guide will help you set up Jest testing for your Next.js golf game application.

## 📋 Prerequisites

- Node.js 18+ installed
- Next.js project already set up

## 🚀 Quick Start

### Step 1: Install Dependencies

Run this command in your project root:

```bash
npm install --save-dev jest jest-environment-jsdom @testing-library/react @testing-library/jest-dom @testing-library/user-event @next/jest @types/jest
```

Or use the provided setup script:
```bash
chmod +x setup-testing.sh
./setup-testing.sh
```

### Step 2: Copy Configuration Files

Copy these files to your project root:
1. `jest.config.js` - Jest configuration
2. `jest.setup.js` - Test environment setup

### Step 3: Copy Test Files

Copy the `__tests__` folder to your project root. The structure should be:
```
your-project/
├── __tests__/
│   ├── api/
│   │   └── mock-api.test.ts
│   ├── physics/
│   │   └── simulator.test.ts
│   └── wallet/
│       └── walletManager.test.ts
├── jest.config.js
├── jest.setup.js
└── package.json
```

### Step 4: Update package.json

Add these scripts to your `package.json`:

```json
{
  "scripts": {
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage"
  }
}
```

### Step 5: Run Tests

```bash
# Run all tests once
npm test

# Run tests in watch mode (re-runs on file changes)
npm run test:watch

# Run tests with coverage report
npm run test:coverage
```

## 📁 Test Files Overview

### 1. API Tests (`__tests__/api/mock-api.test.ts`)

Tests your API endpoints:
- ✅ Coupon fetching
- ✅ Session creation
- ✅ Game play logic
- ✅ Input validation
- ✅ Coupon awarding

### 2. Physics Tests (`__tests__/physics/simulator.test.ts`)

Tests the physics simulation:
- ✅ Deterministic behavior
- ✅ Input validation
- ✅ Trajectory calculation
- ✅ Win/lose detection
- ✅ Seeded random number generation

### 3. Wallet Tests (`__tests__/wallet/walletManager.test.ts`)

Tests wallet functionality:
- ✅ LocalStorage operations
- ✅ Coupon expiration
- ✅ Statistics calculation
- ✅ Data export

## 🔧 Configuration Explained

### jest.config.js

This file configures Jest to work with Next.js:
- Uses `next/jest` for Next.js compatibility
- Sets up path aliases (`@/` → project root)
- Configures test environment as `jsdom` for browser APIs
- Specifies test file patterns

### jest.setup.js

This file sets up the test environment:
- Imports `@testing-library/jest-dom` for DOM matchers
- Mocks `localStorage` for tests
- Mocks `window.matchMedia` for responsive tests

## 📊 Running Specific Tests

```bash
# Run only API tests
npm test -- __tests__/api

# Run only physics tests
npm test -- __tests__/physics

# Run only wallet tests
npm test -- __tests__/wallet

# Run a specific test file
npm test -- __tests__/api/mock-api.test.ts
```

## 🐛 Common Issues and Solutions

### Issue 1: "Cannot find module '@/...'"

**Solution:** Make sure `jest.config.js` is in your project root with the correct `moduleNameMapper` configuration.

### Issue 2: "describe is not defined"

**Solution:** Make sure you installed `@types/jest`:
```bash
npm install --save-dev @types/jest
```

### Issue 3: Tests failing with "localStorage is not defined"

**Solution:** Make sure `jest.setup.js` is properly configured and referenced in `jest.config.js`.

### Issue 4: "Cannot find name 'jest'"

**Solution:** Add this to your `tsconfig.json` or create a `tsconfig.test.json`:
```json
{
  "compilerOptions": {
    "types": ["jest", "@testing-library/jest-dom"]
  }
}
```

## 📈 Coverage Reports

After running `npm run test:coverage`, you'll see:
```
----------|---------|----------|---------|---------|
File      | % Stmts | % Branch | % Funcs | % Lines |
----------|---------|----------|---------|---------|
All files |   85.71 |    75.00 |   90.00 |   85.71 |
----------|---------|----------|---------|---------|
```

A detailed HTML report will be in `coverage/lcov-report/index.html`.

## ✨ Writing New Tests

### Example: Testing a new component

```typescript
import { render, screen } from '@testing-library/react'
import MyComponent from '@/components/MyComponent'

describe('MyComponent', () => {
  it('should render correctly', () => {
    render(<MyComponent />)
    expect(screen.getByText('Hello')).toBeInTheDocument()
  })
})
```

### Example: Testing an async function

```typescript
it('should fetch data', async () => {
  const data = await fetchSomeData()
  expect(data).toHaveProperty('id')
})
```

### Example: Testing with mocks

```typescript
jest.mock('@/lib/api', () => ({
  fetchData: jest.fn(() => Promise.resolve({ success: true }))
}))

it('should call API', async () => {
  const { fetchData } = require('@/lib/api')
  await fetchData()
  expect(fetchData).toHaveBeenCalled()
})
```

## 🎯 Best Practices

1. **Test behavior, not implementation** - Test what the user sees and interacts with
2. **Use descriptive test names** - Make it clear what is being tested
3. **Arrange-Act-Assert pattern** - Set up, execute, verify
4. **Keep tests independent** - Each test should run in isolation
5. **Mock external dependencies** - Don't make real API calls in tests
6. **Aim for high coverage** - Try to cover edge cases and error scenarios

## 📚 Additional Resources

- [Jest Documentation](https://jestjs.io/)
- [Testing Library](https://testing-library.com/)
- [Next.js Testing Documentation](https://nextjs.org/docs/testing)

## 🆘 Need Help?

If you encounter issues:
1. Check the console output for specific error messages
2. Verify all dependencies are installed: `npm list jest`
3. Make sure configuration files are in the correct location
4. Check that your TypeScript configuration includes Jest types

Happy Testing! 🧪✨
