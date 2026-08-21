---
description: Capture non-obvious lessons into AGENTS.md
---
# Learn Command

Captures a lesson learned into the project's AGENTS.md for future reference.

## Usage
```
/learn "context" "insight" "action"
```

## Examples
```
/learn "PyTorch CUDA setup" "pip install torch --index-url https://download.pytorch.org/whl/cu124 is required for GPU" "Add to ML engineer agent instructions"
/learn "MCP server tokens" "GitHub MCP adds significant context; disable when not needed" "Update performance rules with MCP token guidance"
```

## Implementation
```bash
cat << 'EOF' >> AGENTS.md
## Lesson Learned: $(date '+%Y-%m-%d')
- Context: $1
- Insight: $2
- Action: $3
EOF
```