# Testing Rules

## Principles
- **TDD mandatory**: Write failing test first (RED), make it pass (GREEN), refactor (REFACTOR)
- **Test pyramid**: 70% unit, 20% integration, 10% e2e
- **Coverage target**: 80% minimum; 95% for critical paths (auth, payments, data processing)
- **Deterministic**: No flaky tests; fix or quarantine immediately

## Unit Tests
- Test behavior, not implementation
- One assertion per test (or related assertions)
- Descriptive names: `shouldReturnUserWhenValidIdProvided`
- AAA pattern: Arrange, Act, Assert
- Mock external dependencies (databases, APIs, time, random)
- Property-based testing with Hypothesis for complex logic

## Integration Tests
- Test real database (Testcontainers), real message queues
- Isolate test data: unique prefixes, cleanup in `afterEach`
- Test contracts between services (Pact for consumer-driven contracts)
- Run in CI with dedicated test environment

## E2E Tests
- Critical user journeys only (login, checkout, core workflows)
- Playwright/Cypress with page object model
- Run against staging; tag with `@critical`, `@smoke`, `@regression`
- Parallel execution; max 10 min total runtime

## Test Organization
```
tests/
├── unit/           # Fast, isolated, mocked
├── integration/    # Real deps, service boundaries
├── e2e/            # Critical paths only
├── fixtures/       # Shared test data
└── utils/          # Test helpers, custom matchers
```

## CI Requirements
- Unit tests on every commit (must pass in <2 min)
- Integration tests on PR (must pass in <10 min)
- E2E tests on merge to main (must pass in <15 min)
- Coverage report uploaded; PR fails if coverage drops