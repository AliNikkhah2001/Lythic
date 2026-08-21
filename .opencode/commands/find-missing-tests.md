---
description: Identify untested code paths and generate test scaffolding
---
# Find Missing Tests Command

Analyzes codebase for untested areas and suggests test scaffolding.

## Implementation
```bash
echo "🔍 Finding missing tests..."
echo ""

# 1. Coverage report (if available)
if [ -f "coverage/lcov.info" ] || [ -d "htmlcov" ]; then
  echo "📊 Coverage report found"
  # Parse and show uncovered lines
  if command -v npx &> /dev/null; then
    npx nyc report --reporter=text --report-dir=coverage 2>/dev/null | grep -A 5 "All files" || true
  fi
  if command -v python &> /dev/null && [ -f "htmlcov/index.html" ]; then
    python -c "
import xml.etree.ElementTree as ET
try:
    tree = ET.parse('coverage.xml')
    for cls in tree.findall('.//class'):
        filename = cls.get('filename')
        lines = cls.findall('.//line')
        uncovered = [l.get('number') for l in lines if l.get('hits') == '0']
        if uncovered:
            print(f'{filename}: lines {uncovered[:10]}...')
except:
    pass
"
  fi
else
  echo "⚠️  No coverage data. Run: npm test -- --coverage or pytest --cov"
fi

echo ""

# 2. Source files without test files
echo "📁 Source files without corresponding tests:"
find src -name "*.ts" -o -name "*.py" | while read f; do
  test_file=$(echo "$f" | sed 's|src/|tests/|; s|\.ts$|.test.ts|; s|\.py$|_test.py|')
  if [ ! -f "$test_file" ]; then
    echo "  Missing: $test_file (for $f)"
  fi
done | head -20

echo ""

# 3. Functions/classes without tests (heuristic)
echo "🔍 Potential untested functions (exported, no test reference):"
grep -r "export function\|export class\|export const.*=" src/ --include="*.ts" | head -20 | while read line; do
  func=$(echo "$line" | sed 's/.*export \(function\|class\|const\) \([a-zA-Z0-9_]*\).*/\2/')
  file=$(echo "$line" | cut -d: -f1)
  if ! grep -r "$func" tests/ --include="*.test.ts" -q 2>/dev/null; then
    echo "  $file: $func (no test found)"
  fi
done

echo ""
echo "💡 Generate test scaffolding:"
echo "  @test-engineer should create tests for above"
```