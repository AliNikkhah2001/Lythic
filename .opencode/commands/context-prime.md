---
description: Load repo context before real work starts
---
# Context Prime Command

Bootstraps the agent with essential project context.

## Implementation
```bash
echo "📋 Project Context Primer"
echo ""

# 1. AGENTS.md (rules)
echo "━━━ AGENTS.md ━━━"
cat AGENTS.md
echo ""

# 2. Project structure
echo "━━━ Structure ━━━"
find . -maxdepth 2 -type f -name "*.json" -o -name "*.yaml" -o -name "*.toml" -o -name "*.md" | grep -v node_modules | grep -v .git | sort
echo ""

# 3. Package scripts
echo "━━━ Scripts (package.json) ━━━"
cat package.json | jq '.scripts' 2>/dev/null || cat pyproject.toml | grep -A 20 "\[tool.poetry.scripts\]" 2>/dev/null || echo "No scripts found"
echo ""

# 4. Key config files
echo "━━━ Key Configs ━━━"
for f in tsconfig.json biome.json ruff.toml mypy.ini pytest.ini; do
  if [ -f "$f" ]; then
    echo "--- $f ---"
    cat "$f"
    echo ""
  fi
done

# 5. Recent changes
echo "━━━ Recent Commits ━━━"
git log --oneline -10
echo ""

# 6. Active MCP servers
echo "━━━ MCP Servers (from opencode.json) ━━━"
cat opencode.json | jq '.mcp.servers | keys' 2>/dev/null || echo "No MCP config found"

echo ""
echo "✅ Context loaded. Ready to work."
```