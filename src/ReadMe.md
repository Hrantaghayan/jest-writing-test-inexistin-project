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

## 🔧 MSW (Mock Service Worker) - Coming Soon
MSW allows you to mock HTTP requests at the network level, making your tests more realistic.

```javascript
// Example MSW setup (not yet implemented in this project)
import { rest } from 'msw';
import { setupServer } from 'msw/node';

const server = setupServer(
  rest.get('/api/repositories', (req, res, ctx) => {
    return res(
      ctx.json({
        repositories: [
          { id: 1, name: 'test-repo', language: 'JavaScript' }
        ]
      })
    );
  })
);

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());
```

## 🚫 Common Anti-Patterns to Avoid

1. **Using `act()` manually** - React Testing Library handles this automatically
   ```javascript
   // ❌ DON'T - Unnecessary complexity
   await act(async () => {
     await pause();
   });
   
   // ✅ DO - Let Testing Library handle it
   await screen.findByText("Expected text");
   ```

2. **Testing implementation details** - Focus on user behavior, not internal state
   ```javascript
   // ❌ DON'T - Testing internal state
   expect(component.state.isLoading).toBe(true);
   
   // ✅ DO - Testing user-visible behavior
   expect(screen.getByText("Loading...")).toBeInTheDocument();
   ```

3. **Using `getBy` for async elements** - Use `findBy` instead
   ```javascript
   // ❌ DON'T - Fails if element isn't immediately available
   const icon = screen.getByRole("img");
   
   // ✅ DO - Waits for element to appear
   const icon = await screen.findByRole("img");
   ```

4. **Testing CSS classes instead of functionality** - Test behavior, not styling
   ```javascript
   // ❌ DON'T - Testing implementation details
   expect(button).toHaveClass("btn-primary");
   
   // ✅ DO - Testing functionality
   expect(button).toHaveAttribute("type", "submit");
   ```

5. **Not mocking complex components** - Can cause `act` warnings and slow tests
   ```javascript
   // ❌ DON'T - Complex icons cause rendering issues
   // <FileIcon name="JavaScript" /> // Unmocked
   
   // ✅ DO - Mock complex components
   jest.mock("../tree/FileIcon", () => ({ name }) => 
     <img role="img" aria-label={name} />
   );
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

**Example from your tests:**
```javascript
// RepositoriesListItem.test.js
test("shows file icon with an appropriate icon", async () => {
  renderComponent();
  
  // With mocked icon, this test becomes more reliable
  const icon = await screen.findByRole("img", {
    name: /javaScript/i,
  });
  
  expect(icon).toBeInTheDocument();
  // Test icon properties without complex rendering logic
});
```

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

**Practical Examples:**

**Debugging specific tests:**
```javascript
describe("AuthButtons Component", () => {
  describe.only("when user is signed in", () => {
    // Focus on debugging signed-in user tests
    test("should show sign out button", () => {
      // Debug this specific scenario
    });
  });
  
  describe("when user is signed out", () => {
    // These tests will be skipped during debugging
    test("should show sign in button", () => {
      // Skipped
    });
  });
});
```

**Temporarily skip failing tests:**
```javascript
describe("AuthButtons Component", () => {
  test("should show sign in button", () => {
    // This test passes
  });
  
  test.skip("should handle network errors", () => {
    // Skip this test until network error handling is implemented
  });
});
```

**Benefits of Test Organization:**
- **Logical grouping** - Related tests stay together
- **Selective testing** - Debug specific scenarios without running all tests
- **Better test output** - Nested describe blocks create clear test hierarchies
- **Focused development** - Use `.only` to work on specific features

**Test Output Structure:**
```
AuthButtons Component
  when user is signed out
    ✓ should show sign in button
    ✓ should show sign up button
  when user is signed in
    ✓ should show sign out button
```

**Warning:** Remember to remove `.only` and `.skip` before committing code to avoid accidentally disabling tests in CI/CD pipelines!

## 📁 Test File Examples
- `RepositoriesListItem.test.js` - Router testing, async elements, attribute validation
- `RepositoriesSummary.test.js` - Dynamic content testing, regex patterns
- `HomeRoute.test.js` - Route-level testing (to be implemented)

## 🎯 Key Takeaways
1. Always provide routing context with `MemoryRouter`
2. Use `findBy` for async elements, `getBy` for immediate elements
3. Test by role and accessibility features, not implementation details
4. Write strict assertions to catch regressions
5. Focus on user behavior and experience