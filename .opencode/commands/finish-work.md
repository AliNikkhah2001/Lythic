---
description: Pre-commit quality gate - lint, typecheck, test, security
---
# Finish Work Command

Runs the complete quality gate before considering work done.

## Implementation
```bash
echo "🔍 Running quality gates..."

# 1. Lint
echo "▶ Linting..."
npm run lint 2>&1 | tail -20
if [ $? -ne 0 ]; then echo "❌ Lint failed"; exit 1; fi

# 2. Typecheck
echo "▶ Type checking..."
npx tsc --noEmit 2>&1 | tail -20
if [ $? -ne 0 ]; then echo "❌ Typecheck failed"; exit 1; fi

# 3. Format check
echo "▶ Format check..."
npm run format:check 2>&1 | tail -10
if [ $? -ne 0 ]; then echo "❌ Format check failed"; exit 1; fi

# 4. Unit tests
echo "▶ Unit tests..."
npm test 2>&1 | tail -30
if [ $? -ne 0 ]; then echo "❌ Tests failed"; exit 1; fi

# 5. Security scan (if available)
if command -v npm audit &> /dev/null; then
  echo "▶ Security audit..."
  npm audit --audit-level=high 2>&1 | tail -10
fi

# 6. Cross-layer check
echo "▶ Checking cross-layer impacts..."
git diff --name-only | head -20

echo "✅ All quality gates passed!"
echo ""
echo "📝 Remember to:"
echo "  - Update documentation if API changed"
echo "  - Add tests for new functionality"
echo "  - Consider security implications"
echo "  - Run /check-cross-layer for complex changes"
```