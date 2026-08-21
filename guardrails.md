# Guardrails — Safety and Quality Gates

## Mandatory Checks (Never Skip)

### 1. Quality Gate — `/finish-work`
- ✅ `npm run lint` passes
- ✅ `npx tsc --noEmit` passes
- ✅ `npm test` passes with 80%+ coverage
- ✅ Security audit clean (no high-severity vulnerabilities)
- ✅ Format check: `npm run format:check`

### 2. Model Safety
- 🚫 Never commit `.env` files — added to `.gitignore`
- 🚫 API keys only in environment variables (`{env:VAR_NAME}`)
- 🚫 No `eval()`, `exec()`, `Function()` with user input
- 🚫 Path traversal protection: validate file paths with `path.resolve()`
- 🚫 Model safety: scan `.pt`/`.pth` files before deployment with model-safety-mcp

### 3. Permission Model
- **Read**: Always allowed — any file in project
- **Grep**: Always allowed — any search
- **Glob**: Always allowed — any pattern
- **Edit**: Scoped — only files in task scope
- **Bash**: Scoped — only approved commands
- **Write**: Scoped — only new files in task scope
- **Question**: Denied — pipeline is non-interactive

### 4. Anti-Patterns to Avoid

| Anti-Pattern | Problem | Solution |
|-------------|---------|----------|
| **Giant prompts** | Context overflow, poor quality | Break into small tasks |
| **No stop rules** | Agent drift, wasted tokens | Pause after 2-3 failed correction loops |
| **Single model for everything** | Inconsistent quality | Route by task complexity (Opus for planning, Sonnet for coding) |
| **No quality gate** | Unreviewed code | Always run `/finish-work` |
| **Skipping tests** | Regressions | TDD: tests first, always |

### 5. MCP Server Safety
- **GitHub MCP**: Disable when not needed (high token usage)
- **Semantic Scholar API key**: Rotate quarterly; store in `.env`
- **Sonarqube**: Configure instance URL in `opencode.json`; set token
- **Free tier preference**: Use `deepseek-coder-v2` locally; disable unused servers

### 5. Output Format Conventions

#### Agent Output
```
## Review Summary
- Files reviewed: N
- Issues found: X critical, Y major, Z minor

## Critical Issues
1. [file:line] Description → Impact → Fix

## Major Issues
...

## Minor Issues / Suggestions
...

## Positive Observations
- Good patterns used
- Well-tested areas
```

### Commit Messages (Conventional Commits)
```
<type>(<scope>): <description>

[optional body]

[optional footer(s)]
```
Types: `feat`, `fix`, `refactor`, `docs`, `test`, `chore`, `perf`, `security`, `ci`
Scopes: `auth`, `api`, `db`, `ui`, `ml`, `infra`, `config`

### PR Template
- **Title**: Same as commit convention; link issue (`fixes #123`)
- **Description**: What, Why, How; screenshots for UI changes
- **Reviewers**: Minimum 2 approvals (1 domain expert, 1 cross-functional)
- **Checks**: All CI green (lint, typecheck, unit, integration, security)
- **Size**: <400 lines changed; split large PRs

## Emergency Protocols

### Hotfix Workflow
```
@implementer (scoped) → @test-engineer (targeted) → @review (fast) → /finish-work
```

### Research Task
```
@analyzer (broad) → @architect (synthesis) → @implementer
```

### If Agent Drift Detected
1. Pause the pipeline
2. Run `/session-summary` to capture state
3. Reset context with `/context-prime`
4. Resume with a different model tier if available