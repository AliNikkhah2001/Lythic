---
description: Verify changes don't break other layers (API ↔ DB ↔ Frontend ↔ Tests)
---
# Check Cross-Layer Command

Analyzes changes for cross-layer impact.

## Implementation
```bash
echo "🔍 Cross-Layer Impact Analysis"
echo ""

CHANGED_FILES=$(git diff --name-only)

# API changes
API_FILES=$(echo "$CHANGED_FILES" | grep -E "(routes|controllers|schemas|api)" | head -10)
if [ -n "$API_FILES" ]; then
  echo "📡 API Changes detected:"
  echo "$API_FILES"
  echo "  → Check: Frontend types, OpenAPI spec, integration tests"
  echo ""
fi

# Database changes
DB_FILES=$(echo "$CHANGED_FILES" | grep -E "(migrations|models|repositories|entities)" | head -10)
if [ -n "$DB_FILES" ]; then
  echo "🗄️  Database Changes detected:"
  echo "$DB_FILES"
  echo "  → Check: Repository implementations, migrations, seed data"
  echo ""
fi

# Frontend changes
FE_FILES=$(echo "$CHANGED_FILES" | grep -E "(components|pages|hooks|stores)" | head -10)
if [ -n "$FE_FILES" ]; then
  echo "🎨 Frontend Changes detected:"
  echo "$FE_FILES"
  echo "  → Check: API contracts, component tests, Storybook"
  echo ""
fi

# Test files
TEST_FILES=$(echo "$CHANGED_FILES" | grep -E "\.(test|spec)\." | head -10)
if [ -n "$TEST_FILES" ]; then
  echo "🧪 Test Changes detected:"
  echo "$TEST_FILES"
  echo "  → Verify: Coverage maintained, new tests for new code"
  echo ""
fi

# Configuration changes
CONFIG_FILES=$(echo "$CHANGED_FILES" | grep -E "(config|\.json|\.yaml|\.toml|\.env)" | head -10)
if [ -n "$CONFIG_FILES" ]; then
  echo "⚙️  Config Changes detected:"
  echo "$CONFIG_FILES"
  echo "  → Check: All environments, CI/CD, documentation"
  echo ""
fi

echo "💡 Run related tests: npm test -- --testPathPattern=<affected-area>"
```