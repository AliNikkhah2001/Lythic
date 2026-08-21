# Hook Usage Guidelines

## Available Hooks
- **pre-tool-use**: Validate/modify tool input before execution
- **post-tool-use**: Process tool output, trigger follow-ups
- **pre-agent**: Configure subagent before spawn
- **post-agent**: Handle subagent result, update state
- **session-start**: Initialize context, load config
- **session-end**: Save state, cleanup, generate summary

## Standard Hooks (Always Enabled)

### pre-tool-use: Security Validation
```bash
# Block dangerous commands
# rm -rf, chmod 777, sudo, curl | bash, etc.
```

### pre-tool-use: Token Budget
```bash
# Warn if context > 80%
# Suggest /strategic-compact
```

### post-tool-use: Auto-Format
```bash
# Run ruff/biome on edited files
# Only for code files (.py, .ts, .js, .rs)
```

### post-tool-use: Test Detection
```bash
# If test file created/modified → suggest running tests
# If source file modified → suggest related test file
```

### session-end: Summary
```bash
# Generate session summary: files changed, tools used, cost
# Save to .opencode/sessions/<timestamp>.md
```

## Custom Hooks (Project-Specific)

### pre-commit Quality Gate
```bash
# Triggered by /finish-work command
# Runs: lint → typecheck → unit tests → security scan
# Blocks if any fail
```

### Cross-Layer Impact Check
```bash
# Triggered by /check-cross-layer command
# Analyzes: API changes → DB schema → Frontend types → Tests
# Reports missing updates
```

### Documentation Sync
```bash
# Triggered when API routes, types, or config change
# Updates: OpenAPI spec, README, CHANGELOG
# Creates PR if auto-update enabled
```

## Hook Configuration
```json
// opencode.json
{
  "hooks": {
    "pre-tool-use": [".opencode/hooks/security-check.sh"],
    "post-tool-use": [".opencode/hooks/auto-format.sh"],
    "session-end": [".opencode/hooks/session-summary.sh"]
  }
}
```

## Hook Best Practices
- **Fast**: Hooks must complete in <2 seconds
- **Idempotent**: Safe to run multiple times
- **Fail-open**: Don't block workflow on hook failure (log warning)
- **Configurable**: Enable/disable via environment variables
- **Tested**: Unit test hooks like any other code
- **Version controlled**: Hook scripts in `.opencode/hooks/`