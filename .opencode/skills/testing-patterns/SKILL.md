# Testing Patterns Skill

## Test Pyramid
```
        ▲ E2E (10%) - Critical journeys only
       ▼
    ┌─────┐ Integration (20%) - Service boundaries, DB, APIs
   ▼     ▼
┌───────────┐ Unit (70%) - Fast, isolated, behavior-focused
```

## Unit Testing

### Principles (FIRST)
- **Fast**: < 100ms each, < 2s total
- **Independent**: No shared state, any order
- **Repeatable**: Deterministic, no flakiness
- **Self-validating**: Boolean pass/fail
- **Timely**: TDD - write before code

### Patterns
```python
# Arrange-Act-Assert
def test_should_calculate_discount_for_loyal_customer():
    # Arrange
    customer = Customer(loyalty_tier=Gold)
    order = Order(total=100, customer=customer)
    
    # Act
    discount = discount_service.calculate(order)
    
    # Assert
    assert discount == 15  # 15% for Gold

# Parameterized
@pytest.mark.parametrize("tier,expected", [
    (Bronze, 0),
    (Silver, 5),
    (Gold, 15),
    (Platinum, 20),
])
def test_discount_by_tier(tier, expected):
    assert discount_service.calculate(Order(customer=Customer(tier))) == expected

# Property-based (Hypothesis)
@given(st.lists(st.integers(0, 100), min_size=1))
def test_discount_never_exceeds_total(prices):
    order = Order(items=[Item(price=p) for p in prices])
    assert discount_service.calculate(order) <= sum(prices)
```

## Integration Testing

### Database (Testcontainers)
```python
import pytest
from testcontainers.postgres import PostgresContainer

@pytest.fixture(scope="session")
def postgres():
    with PostgresContainer("postgres:16") as pg:
        yield pg.get_connection_url()

@pytest.fixture
def db_session(postgres):
    engine = create_engine(postgres)
    Base.metadata.create_all(engine)
    session = Session(engine)
    yield session
    session.rollback()
    session.close()

def test_user_repository_save(db_session):
    repo = UserRepository(db_session)
    user = User(email="test@example.com")
    saved = repo.save(user)
    assert saved.id is not None
    assert repo.find(saved.id) == user
```

### API Contracts (Pact)
```python
# Consumer test
def test_user_api_contract():
    pact = Pact(consumer="frontend", provider="user-api")
    (pact
        .given("user exists")
        .upon_receiving("request for user")
        .with_request("GET", "/users/123")
        .will_respond_with(200, body=Like({"id": 123, "email": "test@example.com"})))
    
    with pact:
        response = requests.get(f"{pact.uri}/users/123")
        assert response.json()["id"] == 123

# Provider verification (CI)
# pact-verifier --provider-base-url=http://localhost:8000 --pact-url=...
```

## E2E Testing (Playwright)
```python
# tests/e2e/test_checkout.py
import pytest
from playwright.async_api import Page

@pytest.mark.e2e
async def test_checkout_flow(page: Page):
    await page.goto("/login")
    await page.fill("#email", "user@example.com")
    await page.fill("#password", "secret")
    await page.click("button:has-text('Login')")
    
    await page.goto("/product/123")
    await page.click("button:has-text('Add to Cart')")
    await page.click("a:has-text('Cart')")
    await page.click("button:has-text('Checkout')")
    
    await expect(page.locator(".order-confirmation")).to_be_visible()
```

## Test Organization
```
tests/
├── unit/
│   ├── domain/           # Pure logic, no deps
│   ├── services/         # With mocked deps
│   └── utils/
├── integration/
│   ├── repositories/     # Real DB
│   ├── api/              # Real HTTP
│   └── messaging/        # Real queue
├── e2e/
│   ├── critical/         # Smoke tests
│   └── regression/       # Full flows
├── fixtures/
│   ├── factories.py      # test data builders
│   └── data/             # Static test files
└── conftest.py           # Shared fixtures
```

## Coverage Targets
| Layer | Target | Critical Paths |
|-------|--------|----------------|
| Unit | 80% | 95% |
| Integration | 70% | 90% |
| E2E | 100% critical | 100% |

## CI Pipeline
```yaml
# .github/workflows/test.yml
jobs:
  unit:
    runs-on: ubuntu-latest
    steps:
      - run: pytest tests/unit --cov=src --cov-fail-under=80 -x -q
   
  integration:
    runs-on: ubuntu-latest
    services:
      postgres: { image: postgres:16 }
    steps:
      - run: pytest tests/integration --cov=src --cov-fail-under=70
   
  e2e:
    runs-on: ubuntu-latest
    steps:
      - run: playwright install --with-deps
      - run: pytest tests/e2e --maxfail=3
```

## Mutation Testing
```bash
# Python: mutmut
pip install mutmut
mutmut run --paths-to-mutate=src/

# TypeScript: stryker
npx stryker run
```

## Skill Invocation

Auto-invoked when:
- Writing new code (TDD: test first)
- `@test-engineer` agent activated
- `/find-missing-tests` command run
- Coverage drops below threshold

**Output**: Test scaffolding, coverage reports, mutation scores