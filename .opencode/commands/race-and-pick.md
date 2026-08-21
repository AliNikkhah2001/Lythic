---
description: Parallel implementations - run multiple approaches, pick best
---
# Race and Pick Command

Runs multiple implementation approaches in parallel subagents, then selects the best.

## Usage
```
/race-and-pick "task description" "approach1" "approach2" "approach3"
```

## Implementation
```bash
TASK="$1"
APPROACH1="$2"
APPROACH2="$3"
APPROACH3="$4"

echo "🏁 Racing implementations for: $TASK"
echo ""

# Spawn 3 subagents with different approaches
echo "Spawning @implementer with approach: $APPROACH1"
echo "Spawning @implementer with approach: $APPROACH2"
echo "Spawning @implementer with approach: $APPROACH3"
echo ""

echo "Each subagent will:"
echo "  1. Implement the feature using their approach"
echo "  2. Write tests (RED→GREEN)"
echo "  3. Run lint/typecheck/tests"
echo "  4. Output: implementation + test results + metrics"
echo ""

echo "Evaluation criteria:"
echo "  - Code quality (lint, patterns, readability)"
echo "  - Test coverage & quality"
echo "  - Performance (if measurable)"
echo "  - Simplicity (lines, complexity, dependencies)"
echo "  - Adherence to requirements"
echo ""

echo "After completion: compare outputs, pick winner or merge best parts"
echo "Command to review: @review each implementation"
```