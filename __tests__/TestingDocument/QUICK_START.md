# Quick Start: Testing Your Golf Game 🎯

## ⚡ Fast Setup (5 minutes)

### Step 1: Install Dependencies ✅ (Already Done!)
You already installed these:
```bash
npm install --save-dev jest jest-environment-jsdom @testing-library/react @testing-library/user-event @types/jest --legacy-peer-deps
```

### Step 2: Fix jest.config.js ⚠️
In your `jest.config.js` file, change line 21:
```javascript
// Change this:
moduleNameMapping: {

// To this:
moduleNameMapper: {
```

### Step 3: Add/Update package.json Scripts ✅
Make sure you have these in your `package.json`:
```json
{
  "scripts": {
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage"
  }
}
```

### Step 4: Copy New Test Files 📁
Copy all the new test files I created from `/mnt/user-data/outputs/` to your project:

```
📦 your-project/
└── __tests__/
    ├── api/
    │   ├── mock-api.test.ts (replace existing)
    │   ├── security.test.ts (NEW)
    │   └── sessionManager.test.ts (NEW)
    ├── physics/
    │   ├── simulator.test.ts (replace existing)
    │   ├── rng.test.ts (NEW)
    │   └── utils.test.ts (NEW)
    ├── store/
    │   └── gameStore.test.ts (NEW)
    ├── integration/
    │   └── game-flow.test.ts (NEW)
    └── wallet/
        └── walletManager.test.ts (replace existing)
```

### Step 5: Run Tests! 🚀
```bash
npm test
```

---

## 📊 What You Just Got

### **7 New Test Files**
1. `rng.test.ts` - 80+ tests for random number generation
2. `utils.test.ts` - 70+ tests for physics utilities
3. `security.test.ts` - 40+ tests for security validation
4. `sessionManager.test.ts` - 60+ tests for session management
5. `gameStore.test.ts` - 50+ tests for state management
6. `game-flow.test.ts` - 40+ integration tests
7. Updates to existing test files

### **Total: 340+ test cases** covering:
- ✅ Physics engine (RNG, trajectories, calculations)
- ✅ Security (rate limiting, replay protection)
- ✅ Sessions (creation, updates, expiration)
- ✅ State management (Zustand store)
- ✅ API endpoints (complete workflows)
- ✅ Edge cases (invalid inputs, boundaries)
- ✅ Error handling (all failure scenarios)

---

## 🎯 Quick Test Commands

```bash
# Run all tests
npm test

# Watch mode (auto-rerun)
npm run test:watch

# Coverage report
npm run test:coverage

# Run only physics tests
npm test -- __tests__/physics

# Run only API tests
npm test -- __tests__/api

# Run single file
npm test -- __tests__/physics/rng.test.ts

# Verbose output
npm test -- --verbose
```

---

## 🐛 If Tests Fail

### Common Issues:

**1. "Cannot find module '@/...'"**
- Check that `moduleNameMapper` is spelled correctly in `jest.config.js`

**2. "describe is not defined"**
- Run: `npm install --save-dev @types/jest --legacy-peer-deps`

**3. Some tests fail**
- This is normal! Tests are finding bugs in your code
- Read the error message carefully
- Fix the code, not the test

**4. "localStorage is not defined"**
- Make sure `jest.setup.js` is properly configured

---

## 📈 Understanding Test Output

### ✅ Passing Test:
```
PASS __tests__/physics/rng.test.ts
  ✓ should generate random numbers (5ms)
```

### ❌ Failing Test:
```
FAIL __tests__/api/security.test.ts
  ✕ should validate timestamp (15ms)
  
  Expected: true
  Received: false
```

### 📊 Coverage Report:
```
----------|---------|----------|---------|---------|
File      | % Stmts | % Branch | % Funcs | % Lines |
----------|---------|----------|---------|---------|
All files |   85.71 |    75.00 |   90.00 |   85.71 |
----------|---------|----------|---------|---------|
```

**Goal:** Aim for >80% coverage

---

## 🎨 What Each Test File Does

### **Physics Tests**
```bash
npm test -- __tests__/physics
```
Tests your physics engine:
- Random number generation (deterministic)
- Trajectory calculations (2D and 3D)
- Wind effects
- Ball physics

### **API Tests**
```bash
npm test -- __tests__/api
```
Tests your backend:
- Security validation
- Session management
- Rate limiting
- Input validation

### **Store Tests**
```bash
npm test -- __tests__/store
```
Tests your state management:
- Game state transitions
- Coupon selection
- Trajectory tracking
- UI state

### **Integration Tests**
```bash
npm test -- __tests__/integration
```
Tests complete workflows:
- Full game lifecycle
- Multiple users
- Error scenarios
- Data validation

---

## 💡 Reading Test Results

### Example Test:
```typescript
it("should generate numbers between 0 and 1", () => {
  const rng = new SeededRNG(12345)
  const value = rng.next()
  
  expect(value).toBeGreaterThanOrEqual(0)
  expect(value).toBeLessThan(1)
})
```

**What it does:**
1. Creates RNG with seed 12345
2. Generates a random number
3. Checks it's between 0 and 1

**If it fails:**
- Your RNG is producing values outside expected range
- Could be a bug in the algorithm

---

## 🔍 Test-Driven Development (TDD)

Want to add a new feature? **Write tests first!**

### Example: Adding a new physics feature

**1. Write the test first (it will fail):**
```typescript
it("should calculate ball spin decay", () => {
  const result = simulator.simulate({
    angle: Math.PI/4,
    power: 0.8,
    seed: 123
  })
  
  expect(result.finalSpin).toBeLessThan(result.initialSpin)
})
```

**2. Run the test (it fails):**
```bash
npm test -- spin
```

**3. Write the code to make it pass:**
```typescript
// Add spin decay logic to simulator
```

**4. Run the test again (it passes):**
```bash
npm test -- spin
✓ should calculate ball spin decay
```

---

## 🎯 Pro Tips

1. **Run tests before committing**
   ```bash
   git commit -m "Add feature" && npm test && git push
   ```

2. **Use watch mode while coding**
   ```bash
   npm run test:watch
   ```
   Tests auto-rerun when you save files!

3. **Check coverage regularly**
   ```bash
   npm run test:coverage
   ```
   Aim for >80% coverage

4. **Run specific tests during debugging**
   ```bash
   npm test -- my-feature
   ```

5. **Use `.only` for focused testing**
   ```typescript
   it.only("should test this specific thing", () => {
     // Only this test runs
   })
   ```

---

## 📚 Learn More

- [Jest Documentation](https://jestjs.io/)
- [Testing Library](https://testing-library.com/)
- [Testing Best Practices](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)

---

## ✅ Checklist

- [ ] Install dependencies
- [ ] Fix `jest.config.js` typo
- [ ] Add test scripts to `package.json`
- [ ] Copy all new test files
- [ ] Run `npm test`
- [ ] Check coverage with `npm run test:coverage`
- [ ] Fix any failing tests
- [ ] Celebrate! 🎉

---

## 🚀 You're Done!

You now have **340+ tests** protecting your code. Every time you make changes:
1. Run tests
2. See what broke
3. Fix it
4. Commit with confidence!

**Questions? Need help? Just ask!** 💬

