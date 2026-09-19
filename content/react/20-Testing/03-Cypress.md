# Cypress

An end-to-end (E2E) testing framework that runs tests in a real browser, interacting with the fully running application (including the actual backend, or a mocked network layer) — as opposed to Jest/RTL, which test components in a simulated DOM (jsdom) in isolation.

```js
// cypress/e2e/login.cy.js
describe("Login flow", () => {
  it("logs in successfully with valid credentials", () => {
    cy.visit("/login");

    cy.get('[data-testid="email-input"]').type("test@example.com");
    cy.get('[data-testid="password-input"]').type("password123");
    cy.get('[data-testid="submit-button"]').click();

    cy.url().should("include", "/dashboard");
    cy.contains("Welcome back").should("be.visible");
  });

  it("shows an error with invalid credentials", () => {
    cy.visit("/login");
    cy.get('[data-testid="email-input"]').type("wrong@example.com");
    cy.get('[data-testid="password-input"]').type("wrongpass");
    cy.get('[data-testid="submit-button"]').click();

    cy.contains("Invalid credentials").should("be.visible");
  });
});
```

**Intercepting network requests (mocking API responses in E2E tests):**

```js
cy.intercept("GET", "/api/users", { fixture: "users.json" }).as("getUsers");
cy.visit("/users");
cy.wait("@getUsers");
cy.get("li").should("have.length", 3);
```

**Cypress vs Jest/RTL:**

|          | Jest + RTL                              | Cypress                                                   |
| -------- | --------------------------------------- | --------------------------------------------------------- |
| Runs in  | simulated DOM (jsdom), no real browser  | real browser                                              |
| Speed    | fast                                    | slower (full browser + app)                               |
| Tests    | unit / component behavior               | full user flows across pages, real navigation             |
| Best for | logic-heavy components, hooks, reducers | login flows, checkout flows, critical multi-page journeys |

**Interview note:** a healthy test suite typically follows the "testing pyramid" — many fast unit/component tests (Jest + RTL) for individual pieces of logic and UI, and a smaller number of slower E2E tests (Cypress) covering the most critical end-to-end user journeys (login, checkout, core workflows).
