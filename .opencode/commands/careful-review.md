---
description: Fresh-eyes review before marking work done
---
# Careful Review Command

Forces a thorough review pass with a fresh perspective.

## Usage
```
/careful-review [files...]
```

## Implementation
```bash
# Run as subagent with review agent
# This command delegates to the review agent

FILES="${1:-$(git diff --name-only)}"

echo "🔍 Initiating careful review..."
echo "Files to review:"
echo "$FILES"
echo ""

# Delegate to review agent (read-only)
# The review agent will:
# 1. Read all changed files
# 2. Check against coding standards, patterns, security
# 3. Verify tests exist and pass
# 4. Check cross-layer impacts
# 5. Report findings

echo "📋 Review checklist:"
echo "  □ Correctness & edge cases"
echo "  □ Design patterns (SOLID, GoF)"
echo "  □ Readability & maintainability"
echo "  □ Security (OWASP, secrets, validation)"
echo "  □ Performance (N+1, complexity, caching)"
echo "  □ Test coverage (critical paths, edge cases)"
echo "  □ Cross-layer consistency"
echo "  □ Documentation updated"
echo ""
echo "Run: @review with focus on above areas"
```