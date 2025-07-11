# React Testing Guide: MSW, React Router, and Async Element Testing

## Overview
This guide covers essential testing patterns for React applications, including mocking HTTP requests with MSW, testing React Router components, and handling async elements in UI tests.

## 🧪 Testing Patterns in This Project

### 1. **React Router Testing**
When testing components that use React Router (`Link`, `useNavigate`, etc.), you need to provide routing context.

**Problem:** `TypeError: Cannot destructure property 'basename' of 'React__namespace.useContext(...)'`

**Solution:** Wrap components in `MemoryRouter`

```javascript
// RepositoriesListItem.test.js
import { MemoryRouter } from "react-router-dom";

function renderComponent() {
  render(
    <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <RepositoriesListItem repository={repository} />
    </MemoryRouter>
  );
}
```

**Key Points:**
- `MemoryRouter` provides routing context for testing
- `future` flags prevent React Router v7 warnings
- No actual browser navigation occurs

### 2. **Async Element Testing**
Use `findBy` queries for elements that appear after asynchronous operations.

```javascript
// Testing async elements (like icons loaded after useEffect)
test("shows file icon with an appropriate icon", async () => {
  renderComponent();
  const icon = await screen.findByRole("img", {
    name: /javaScript/i,
  });
  expect(icon).toHaveClass("js-icon");
});
```

**Key Differences:**
- `getBy` - Element already exists in DOM
- `findBy` - Element appears after async operations (returns Promise)

### 3. **Element Selection Best Practices**
Follow React Testing Library's priority order:

```javascript
// ✅ BEST - Test by role (accessibility-focused)
screen.getByRole("link", { name: /GitHub Repository/i })

// ✅ GOOD - Test by accessible name
screen.getByLabelText("Email")

// ✅ GOOD - Test by user-visible text
screen.getByText(/A sample repository/i)

// ❌ AVOID - Test by implementation details
screen.getByClassName("btn-primary")
screen.getByTestId("submit-button")
```

### 4. **Strict Attribute Testing**
Test multiple attributes for comprehensive validation:

```javascript
test("shows a link to the github home page", async () => {
  const linkRepo = screen.getByRole("link", {
    name: /GitHub Repository/i,
  });

  // Multiple assertions for strict checking
  expect(linkRepo).toHaveAttribute("href", repository.html_url);
  expect(linkRepo).toHaveAttribute("target", "_blank");
  expect(linkRepo).toHaveAttribute("aria-label", "GitHub Repository");
  expect(linkRepo).toBeInTheDocument();
});
```

### 5. **Dynamic Content Testing**
Test dynamic content using regular expressions:

```javascript
// RepositoriesSummary.test.js
test("displays information about the repository", () => {
  const repository = {
    stargazers_count: 5,
    open_issues: 1,
    forks: 30,
    language: "JavaScript",
  };
  
  render(<RepositoriesSummary repository={repository} />);

  // Loop through repository data and test each value
  for (let key in repository) {
    const value = repository[key];
    const element = screen.getByText(new RegExp(value, "i"));
    expect(element).toBeInTheDocument();
  }
});
```

### 6. **Understanding `act` and When to Use It**

`act` is a testing utility that ensures React updates are properly flushed before assertions. However, **it's rarely needed** when using React Testing Library.

**When `act` warnings appear:**
```
Warning: An update to Component was not wrapped in act(...)
```

**Why you usually DON'T need `act`:**
```javascript
// ❌ DON'T - React Testing Library handles this automatically
act(() => {
  fireEvent.click(button);
});

// ✅ DO - Already wrapped in act internally
fireEvent.click(button);
userEvent.click(button);
render(<Component />);
```

**When you MIGHT need `act` (last resort):**
```javascript
// Only for direct React state updates outside of Testing Library
act(() => {
  component.setState({ count: 1 });
});

// Or for custom async operations
await act(async () => {
  await customAsyncFunction();
});
```

**Best practice:** If you need `act`, reconsider your testing approach. Focus on user interactions rather than internal state changes.

### 7. **Icon Mocking to Avoid `act` Warnings**

Complex icon components can cause async rendering issues and `act` warnings. Mock them for cleaner tests.

**Problem:** Icons with complex rendering logic trigger `act` warnings

**Solution 1: Mock the entire icon component**
```javascript
// At the top of your test file
jest.mock("../tree/FileIcon", () => {
  return ({ name, className }) => (
    <img 
      role="img" 
      aria-label={name} 
      className={className}
      data-testid="file-icon"
    />
  );
});
```

**Solution 2: Mock with simple text (for basic tests)**
```javascript
jest.mock("../tree/FileIcon", () => {
  return () => "file-icon component";
});
```

**Solution 3: Mock external icon libraries**
```javascript
// Mock Primer Octicons
jest.mock("@primer/octicons-react", () => ({
  MarkGithubIcon: ({ className }) => (
    <svg role="img" aria-label="GitHub Repository" className={className}>
      <title>GitHub Repository</title>
    </svg>
  ),
}));
```

**Benefits of mocking icons:**
- Eliminates `act` warnings from complex icon rendering
- Faster test execution
- More predictable test behavior
- Focus on functionality, not icon implementation

### 8. **Jest Lifecycle Hooks (Setup and Teardown)**

Jest provides lifecycle hooks to set up and clean up test environments. These are essential for managing test state and avoiding test interference.

**Hook Order and Usage:**
```javascript
describe("Test Suite", () => {
  beforeAll(() => {
    // Runs ONCE before all tests in this describe block
    console.log("Setting up test suite");
  });

  beforeEach(() => {
    // Runs BEFORE each individual test
    console.log("Setting up individual test");
  });

  afterEach(() => {
    // Runs AFTER each individual test
    console.log("Cleaning up individual test");
  });

  afterAll(() => {
    // Runs ONCE after all tests in this describe block
    console.log("Cleaning up test suite");
  });

  test("first test", () => {
    // Test logic here
  });

  test("second test", () => {
    // Test logic here
  });
});
```

**Common Use Cases:**

**`beforeAll()` - One-time setup:**
```javascript
beforeAll(() => {
  // Start test server
  server.listen();
  
  // Connect to test database
  database.connect();
  
  // Set up global test data
  globalTestData = createTestData();
});
```

**`beforeEach()` - Per-test setup:**
```javascript
beforeEach(() => {
  // Clear DOM between tests
  document.body.innerHTML = '';
  
  // Reset mocks
  jest.clearAllMocks();
  
  // Reset test state
  testState = getInitialState();
});
```

**`afterEach()` - Per-test cleanup:**
```javascript
afterEach(() => {
  // Clean up timers
  jest.clearAllTimers();
  
  // Reset handlers (MSW)
  server.resetHandlers();
  
  // Clean up event listeners
  cleanup();
});
```

**`afterAll()` - One-time cleanup:**
```javascript
afterAll(() => {
  // Stop test server
  server.close();
  
  // Disconnect from database
  database.disconnect();
  
  // Clean up global resources
  globalCleanup();
});
```

**Real-world example with MSW:**
```javascript
// MSW server setup
import { setupServer } from 'msw/node';
import { rest } from 'msw';

const server = setupServer(
  rest.get('/api/repositories', (req, res, ctx) => {
    return res(ctx.json({ repositories: [] }));
  })
);

describe("Repository tests", () => {
  beforeAll(() => {
    // Start MSW server once for all tests
    server.listen({ onUnhandledRequest: 'error' });
  });

  beforeEach(() => {
    // Clear any mocks before each test
    jest.clearAllMocks();
  });

  afterEach(() => {
    // Reset MSW handlers after each test
    server.resetHandlers();
  });

  afterAll(() => {
    // Stop MSW server after all tests
    server.close();
  });

  test("fetches repositories", async () => {
    // Test logic here
  });
});
```

**Best Practices:**
- Use `beforeAll/afterAll` for expensive setup/teardown (servers, databases)
- Use `beforeEach/afterEach` for test isolation (mocks, DOM cleanup)
- Always clean up what you set up to avoid test interference
- Be careful with async operations in hooks - use `async/await` when needed

**Hook execution order:**
```
beforeAll()
  beforeEach()
    test("first test")
  afterEach()
  beforeEach()
    test("second test")
  afterEach()
afterAll()
```

### 9. **Jest Test Organization and Filtering**

Jest provides powerful tools for organizing and selectively running tests using `describe`, `test`, and their filtering variants.

**Basic Test Organization:**
```javascript
describe("AuthButtons Component", () => {
  describe("when user is signed out", () => {
    test("should show sign in button", () => {
      // Test logic here
    });
    
    test("should show sign up button", () => {
      // Test logic here
    });
  });
  
  describe("when user is signed in", () => {
    test("should show sign out button", () => {
      // Test logic here
    });
  });
});
```

**Test Filtering with `.only` and `.skip`:**

**`describe.only()` - Run only this describe block:**
```javascript
describe.only("AuthButtons Component", () => {
  // Only tests in this describe block will run
  test("should show sign in button", () => {
    // This will run
  });
});

describe("Other Component", () => {
  test("some other test", () => {
    // This will be skipped
  });
});
```

**`test.only()` - Run only this specific test:**
```javascript
describe("AuthButtons Component", () => {
  test.only("should show sign in button", () => {
    // Only this test will run
  });
  
  test("should show sign up button", () => {
    // This will be skipped
  });
});
```

**`describe.skip()` - Skip entire describe block:**
```javascript
describe.skip("AuthButtons Component", () => {
  // All tests in this block will be skipped
  test("should show sign in button", () => {
    // This will be skipped
  });
});
```

**`test.skip()` - Skip specific test:**
```javascript
describe("AuthButtons Component", () => {
  test("should show sign in button", () => {
    // This will run
  });
  
  test.skip("should show sign up button", () => {
    // This will be skipped
  });
});
```

### 10. **Jest Caching Issues with `.only` and `.skip`**

Jest caches test results and `.only`/`.skip` usage can cause unexpected behavior that persists even after you remove these flags.

**Common Caching Problems:**

**Problem 1: `.only` persists after removal**
```javascript
// You start debugging with .only
test.only("debug this test", () => {
  // Focus on this test
});

// Later you remove .only but Jest still runs only this test
test("debug this test", () => {
  // Other tests might still be skipped due to cache
});
```

**Problem 2: Test results don't update**
```javascript
// You change test logic but results stay the same
test("user authentication", () => {
  // Updated logic here
  expect(true).toBe(false); // This should fail but might pass due to cache
});
```

**Solutions for Caching Issues:**

**1. Clear Jest cache manually:**
```bash
# Clear Jest cache
npm test -- --clearCache

# Run tests with no cache
npm test -- --no-cache

# Run tests without watch mode and no cache
npm test -- --no-cache --watchAll=false
```

**2. Add cache-clearing scripts to package.json:**
```json
{
  "scripts": {
    "test": "react-scripts test",
    "test:no-cache": "react-scripts test --no-cache",
    "test:clear-cache": "react-scripts test --clearCache",
    "test:debug": "react-scripts test --no-cache --watchAll=false"
  }
}
```

**3. Environment-specific cache handling:**
```javascript
// In your test setup file
if (process.env.NODE_ENV === 'test') {
  // Clear cache for test environment
  jest.clearAllMocks();
}
```

**Prevention Strategies:**

**1. Git hooks to prevent committing `.only`/`.skip`:**
```bash
# .git/hooks/pre-commit
#!/bin/bash
if grep -r "\.only\|\.skip" src/; then
  echo "❌ Error: Found .only or .skip in test files"
  echo "Please remove .only and .skip before committing"
  exit 1
fi
```

**2. ESLint rule to catch `.only`/`.skip`:**
```json
{
  "rules": {
    "jest/no-focused-tests": "error",
    "jest/no-disabled-tests": "warn"
  }
}
```

**3. CI/CD checks:**
```yaml
# In your GitHub Actions or CI config
- name: Check for focused tests
  run: |
    if grep -r "\.only\|\.skip" src/; then
      echo "❌ Found .only or .skip in tests"
      exit 1
    fi
```

**Best Practices:**
- Always run `npm test -- --no-cache` when debugging persistent issues
- Remove `.only` and `.skip` immediately after debugging
- Use git hooks or ESLint to prevent accidental commits
- Clear cache regularly during development: `npm test -- --clearCache`
- Use separate terminal sessions for debugging vs. regular testing

**Warning Signs of Cache Issues:**
- Tests pass/fail inconsistently
- Removing `.only` doesn't run other tests
- Test changes don't reflect in results
- Different behavior between developers

**Quick Fix for Cache Issues:**
```bash
# The nuclear option - clear everything and restart
npm test -- --clearCache
rm -rf node_modules/.cache
npm test -- --no-cache
```

## 🔧 MSW (Mock Service Worker)

MSW allows you to mock HTTP requests at the network level, making your tests more realistic.

### **MSW Handler Parameters:**

In MSW, the handler function receives three parameters:

**1. `req` (Request Object)** - Contains information about the incoming HTTP request:
```javascript
rest.get("/api/repositories", (req, res, ctx) => {
  const query = req.url.searchParams.get("q");    // Extract query parameter from URL
  const method = req.method;                       // GET, POST, etc.
  const headers = req.headers;                     // Request headers
  const body = req.body;                          // Request body (for POST/PUT)
});
```

**2. `res` (Response Function)** - Used to create and send the HTTP response:
```javascript
rest.get("/api/repositories", (req, res, ctx) => {
  // Return mock response with JSON data
  return res(
    ctx.status(200),           // HTTP status code
    ctx.json({ data: "..." }), // Response body
    ctx.delay(1000)           // Simulate network delay
  );
});
```

**3. `ctx` (Context Object)** - Provides utilities to build the response:
```javascript
rest.get("/api/repositories", (req, res, ctx) => {
  return res(
    ctx.status(200),              // Success
    ctx.json({ key: "value" }),   // JSON response
    ctx.set("Content-Type", "application/json"),  // Headers
    ctx.delay(2000),              // Add delay
  );
});
```

### **MSW Setup Example:**
```javascript
import { setupServer } from 'msw/node';
import { rest } from 'msw';

const handlers = [
  rest.get("/api/repositories", (req, res, ctx) => {
    const language = req.url.searchParams.get("q")?.split("language:")[1]; // Extract query parameter from URL
    
    // Return mock response with JSON data
    return res(
      ctx.json({
        items: [
          { id: 1, full_name: `${language}_one` },
          { id: 2, full_name: `${language}_two` },
        ],
      })
    );
  }),
];

const server = setupServer(...handlers);

// Setup hooks
beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());
```

### **Multiple API Endpoints:**
```javascript
createServer([
  {
    path: "/api/user",
    method: "get",
    handler: () => ({ user: null })
  },
  {
    path: "/api/repositories", 
    method: "get",
    handler: () => ({ items: [...] })
  },
  {
    path: "/api/posts",
    method: "post", 
    handler: (req) => ({ success: true, data: req.body })
  }
]);
```

### 11. **MSW with `describe.only` and `test.only` - Integration Issues**

When using MSW with focused tests (`.only`), you may encounter specific issues due to how MSW servers are set up and torn down.

**Common Integration Problems:**

**Problem 1: MSW server conflicts with focused tests**
```javascript
// File 1: AuthButtons.test.js
describe.only("AuthButtons Component", () => {
  createServer([
    { path: "/api/user", handler: () => ({ user: null }) }
  ]);
  
  test("should show sign in", () => {
    // This test runs
  });
});

// File 2: HomeRoute.test.js  
describe("HomeRoute Component", () => {
  createServer([
    { path: "/api/repositories", handler: () => ({ items: [] }) }
  ]);
  
  test("should load repositories", () => {
    // This test is skipped but MSW server still tries to start
  });
});
```

**Problem 2: Server lifecycle with focused tests**
```javascript
describe("User Authentication", () => {
  createServer([
    { path: "/api/user", handler: () => ({ user: { id: 1 } }) }
  ]);

  test.only("should authenticate user", async () => {
    // Only this test runs, but server setup/teardown still happens for all tests
  });
  
  test("should handle logout", async () => {
    // Skipped, but server resources might still be allocated
  });
});
```

**Solutions and Best Practices:**

**1. Conditional server setup:**
```javascript
// Custom server setup that respects focused tests
function createConditionalServer(handlersConfig) {
  // Only set up server if this describe block will actually run
  if (expect.getState().currentTestName) {
    return createServer(handlersConfig);
  }
}
```

**2. Shared server for focused testing:**
```javascript
// server-setup.js - Shared test utilities
let globalServer;

export function setupTestServer(handlers) {
  if (!globalServer) {
    globalServer = createServer(handlers);
  }
  return globalServer;
}

// In your test files
describe.only("AuthButtons Component", () => {
  const server = setupTestServer([
    { path: "/api/user", handler: () => ({ user: null }) }
  ]);
  
  test("should show sign in", () => {
    // Test logic
  });
});
```

**3. Per-test server configuration:**
```javascript
describe("AuthButtons Component", () => {
  let server;
  
  beforeAll(() => {
    server = createServer([
      { path: "/api/user", handler: () => ({ user: null }) }
    ]);
  });
  
  afterAll(() => {
    if (server) {
      server.close();
    }
  });
  
  test.only("should show sign in", () => {
    // Only this test runs, but server is properly managed
  });
});
```

**4. MSW handler overrides in focused tests:**
```javascript
describe("AuthButtons Component", () => {
  createServer([
    { path: "/api/user", handler: () => ({ user: null }) }
  ]);
  
  test.only("should handle signed in user", async () => {
    // Override handler for this specific test
    server.use(
      rest.get("/api/user", (req, res, ctx) => {
        return res(ctx.json({ user: { id: 1, email: "test@example.com" } }));
      })
    );
    
    // Test logic with signed in user
  });
});
```

**Debug MSW with focused tests:**
```javascript
describe.only("Debug MSW Issues", () => {
  createServer([
    { 
      path: "/api/user", 
      handler: (req) => {
        console.log("🔥 MSW Handler Called:", req.url.pathname);
        return { user: null };
      } 
    }
  ]);
  
  test("debug API calls", async () => {
    // Use console.log to verify MSW is working
    render(<AuthButtons />);
    await screen.findByText("Sign In");
    // Check console for "🔥 MSW Handler Called: /api/user"
  });
});
```

**Your Custom Server Function:**
Looking at your `server.js` file, you have a great reusable setup:

```javascript
// src/test/server.js
export function createServer(handlersConfig) {
  const handlers = handlersConfig.map((config) => {
    return rest[config?.method || "get"](config?.path, (req, res, ctx) => {
      return res(ctx.json(config?.handler(req, res, ctx)));
    });
  });

  const server = setupServer(...handlers);
  
  beforeAll(() => server.listen());
  afterEach(() => server.resetHandlers());
  afterAll(() => server.close());
}
```

**Best Practices for MSW + Focused Tests:**
- Always clean up servers properly even with `.only` tests
- Use `server.resetHandlers()` between tests to avoid state pollution
- Consider using a single server instance per test file
- Debug MSW issues by adding console.logs to handlers
- Remember that skipped tests still execute setup/teardown hooks

**Warning:** MSW servers continue running even when tests are skipped with `.only`, so proper cleanup is essential to avoid port conflicts and resource leaks!

## 📊 Query Method Comparison

| Method | When to Use | Returns | Throws Error |
|--------|-------------|---------|--------------|
| `getBy` | Element exists immediately | Element | Yes |
| `findBy` | Element appears after async | Promise<Element> | Yes |
| `queryBy` | Element may not exist | Element or null | No |
| `getAllBy` | Multiple elements exist | Array | Yes |
| `findAllBy` | Multiple elements after async | Promise<Array> | Yes |
| `queryAllBy` | Multiple elements may not exist | Array | No |

## 🎯 Jest Matchers

### **For null/undefined testing:**
```javascript
expect(element).toBeNull();           // Exactly null
expect(element).toBeUndefined();      // Exactly undefined
expect(element).toBeFalsy();          // Any falsy value
expect(element).not.toBeTruthy();     // Opposite of truthy
```

### **For DOM testing:**
```javascript
expect(element).toBeInTheDocument();
expect(element).not.toBeInTheDocument();
expect(element).toHaveTextContent("text");
expect(element).toHaveAttribute("href", "value");
expect(element).toHaveClass("className");
```

## 📁 Test File Examples
- `RepositoriesListItem.test.js` - Router testing, async elements, attribute validation
- `RepositoriesSummary.test.js` - Dynamic content testing, regex patterns
- `HomeRoute.test.js` - MSW integration, multiple API endpoints
- `AuthButtons.test.js` - User authentication states, conditional rendering

## 🎯 Key Takeaways
1. Always provide routing context with `MemoryRouter`
2. Use `findBy` for async elements, `getBy` for immediate elements
3. Test by role and accessibility features, not implementation details
4. Write strict assertions to catch regressions
5. Focus on user behavior and experience
6. Mock complex components to avoid `act` warnings
7. Use MSW for realistic HTTP request mocking
8. Organize tests with `describe` blocks and use `.only`/`.skip` for debugging
9. Clean up properly with lifecycle hooks to avoid test interference
