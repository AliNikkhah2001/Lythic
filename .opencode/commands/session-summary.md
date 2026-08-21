---
description: Session handoff - capture actions, cost, inefficiencies, next improvements
---
# Session Summary Command

Generates a structured session summary for handoff or logging.

## Implementation
```bash
echo "📝 Session Summary: $(date '+%Y-%m-%d %H:%M')"
echo ""

# Git stats
echo "━━━ Git Changes ━━━"
git diff --stat
echo ""

# Files modified
echo "━━━ Modified Files ━━━"
git diff --name-only | sed 's/^/  /'
echo ""

# Commands run (from history if available)
echo "━━━ Key Actions ━━━"
echo "  (Add manual notes here)"
echo ""

# MCP servers used
echo "━━━ MCP Servers Used ━━━"
cat opencode.json | jq -r '.mcp.servers | to_entries[] | select(.value.enabled != false) | "  - \(.key)"' 2>/dev/null
echo ""

# Cost estimate (rough)
echo "━━━ Estimated Cost ━━━"
echo "  Tokens: ~$(wc -w AGENTS.md 2>/dev/null | awk '{print $1*4}' || echo 'unknown')"
echo "  Approx: \$0.XX (check /usage for actual)"
echo ""

# Inefficiencies noticed
echo "━━━ Inefficiencies / Improvements ━━━"
echo "  - [ ] Add: repetitive task → create command/skill"
echo "  - [ ] Fix: slow tool → optimize or disable"
echo "  - [ ] Improve: unclear spec → better AGENTS.md"
echo ""

# Next session priorities
echo "━━━ Next Session Priorities ━━━"
echo "  1. "
echo "  2. "
echo "  3. "

# Save to file
cat << 'EOF' > .opencode/sessions/session-$(date '+%Y%m%d-%H%M%S').md
# Session Summary: $(date)

## Changes
$(git diff --stat)

## Files
$(git diff --name-only | sed 's/^/  /')

## Notes
- 

## Next Steps
1. 
2. 
3. 
EOF

echo "✅ Summary saved to .opencode/sessions/"
```