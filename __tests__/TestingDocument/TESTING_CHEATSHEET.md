# Jest Testing Cheat Sheet for Golf Mini-Game

## 🎯 Quick Commands

```bash
npm test                    # Run all tests
npm test -- --watch         # Watch mode
npm test -- --coverage      # Coverage report
npm test -- api            # Run only API tests
npm test -- --verbose       # Detailed output
```

## 📝 Common Test Patterns

### Basic Test Structure
```typescript
describe('Feature Name', () => {
  beforeEach(() => {
    // Setup before each test
  })

  afterEach(() => {
    // Cleanup after each test
  })

  it('should do something', () => {
    // Arrange
    const input = 'test'
    
    // Act
    const result = myFunction(input)
    
    // Assert
    expect(result).toBe('expected')
  })
})
```

### Async Tests
```typescript
it('should handle async operations', async () => {
  const result = await asyncFunction()
  expect(result).toBeDefined()
})

// Or with .resolves
it('should resolve promise', async () => {
  await expect(asyncFunction()).resolves.toBe('value')
})
```

### Testing API Routes
```typescript
it('should return 200 status', async () => {
  const response = await apiHandler(mockRequest)
  expect(response.status).toBe(200)
  
  const data = await response.json()
  expect(data.success).toBe(true)
})
```

### Mocking Functions
```typescript
// Mock a module
jest.mock('@/lib/myModule', () => ({
  myFunction: jest.fn(() => 'mocked value')
}))

// Mock implementation
const mockFn = jest.fn()
mockFn.mockReturnValue('value')
mockFn.mockImplementation(() => 'value')
mockFn.mockResolvedValue('async value')
```

### Testing with localStorage
```typescript
beforeEach(() => {
  localStorage.clear()
})

it('should store data', () => {
  localStorage.setItem('key', 'value')
  expect(localStorage.getItem('key')).toBe('value')
})
```

## 🔍 Common Matchers

```typescript
// Equality
expect(value).toBe(expected)              // Strict equality (===)
expect(value).toEqual(expected)           // Deep equality
expect(value).not.toBe(expected)          // Negation

// Truthiness
expect(value).toBeTruthy()
expect(value).toBeFalsy()
expect(value).toBeDefined()
expect(value).toBeNull()
expect(value).toBeUndefined()

// Numbers
expect(value).toBeGreaterThan(3)
expect(value).toBeLessThan(10)
expect(value).toBeCloseTo(0.3, 5)         // Floating point

// Strings
expect(string).toMatch(/pattern/)
expect(string).toContain('substring')

// Arrays
expect(array).toHaveLength(3)
expect(array).toContain(item)
expect(array).toEqual(expect.arrayContaining([1, 2]))

// Objects
expect(object).toHaveProperty('key')
expect(object).toHaveProperty('key', 'value')
expect(object).toMatchObject({ key: 'value' })

// Exceptions
expect(() => fn()).toThrow()
expect(() => fn()).toThrow('error message')
expect(() => fn()).toThrow(Error)
```

## 🧪 Testing Patterns for This Project

### Testing Physics Simulator
```typescript
it('should be deterministic', () => {
  const input = { angle: 0.5, anglePhi: 0, power: 0.8, seed: 123 }
  const result1 = simulator.simulate(input)
  const result2 = simulator.simulate(input)
  expect(result1.finalPosition).toEqual(result2.finalPosition)
})
```

### Testing API Endpoints
```typescript
it('should create session', async () => {
  const request = createMockRequest('POST', {
    couponIds: ['c1', 'c2', 'c3', 'c4', 'c5']
  })
  const response = await createSession(request)
  const data = await response.json()
  expect(data.success).toBe(true)
})
```

### Testing Game Logic
```typescript
it('should award coupon on win', async () => {
  const result = simulator.simulate(winningInput)
  expect(result.outcome).toBe('win')
  expect(result.awardedCoupon).toBeDefined()
})
```

## 🐛 Debugging Tests

```typescript
// Console log in tests
it('should debug value', () => {
  const value = myFunction()
  console.log('Debug:', value)
  expect(value).toBe('expected')
})

// Use test.only to run single test
it.only('should run only this test', () => {
  // ...
})

// Skip tests
it.skip('should skip this test', () => {
  // ...
})

// Test with timeout
it('should complete within time', async () => {
  // Test code
}, 10000) // 10 second timeout
```

## 📊 Coverage Thresholds

Add to `jest.config.js`:
```javascript
coverageThreshold: {
  global: {
    statements: 80,
    branches: 75,
    functions: 80,
    lines: 80
  }
}
```

## 🎨 Best Practices

1. **Test names should be descriptive**
   ```typescript
   // ✅ Good
   it('should return 404 when session not found', () => {})
   
   // ❌ Bad
   it('test 1', () => {})
   ```

2. **One assertion per test (when possible)**
   ```typescript
   // ✅ Good
   it('should have correct status', () => {
     expect(response.status).toBe(200)
   })
   
   it('should have correct data', () => {
     expect(response.data).toBeDefined()
   })
   ```

3. **Use beforeEach for common setup**
   ```typescript
   describe('API Tests', () => {
     let sessionId: string
     
     beforeEach(async () => {
       const session = await createTestSession()
       sessionId = session.id
     })
     
     it('should use session', () => {
       expect(sessionId).toBeDefined()
     })
   })
   ```

4. **Clean up after tests**
   ```typescript
   afterEach(() => {
     jest.clearAllMocks()
     localStorage.clear()
   })
   ```

## 🚀 Pro Tips

- Use `test.each()` for testing multiple inputs
- Mock expensive operations (API calls, file I/O)
- Test edge cases and error conditions
- Keep tests fast (< 5s total)
- Use snapshots sparingly
- Test user behavior, not implementation

## 📖 Quick Links

- [Jest Docs](https://jestjs.io/docs/getting-started)
- [Jest Matchers](https://jestjs.io/docs/expect)
- [Testing Library](https://testing-library.com/docs/react-testing-library/intro/)
