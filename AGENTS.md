# AGENTS.md — Agent Guidelines

## Commands

| Command | Description | Usage |
|---------|-------------|-------|
| `/context-prime` | Load repo context before real work starts | Start of every session |
| `/finish-work` | Full quality gate: lint → typecheck → test → security | Before every commit |
| `/careful-review` | Fresh-eyes review delegation | After implementation |
| `/check-cross-layer` | Verify API↔DB↔Frontend↔Tests consistency | Complex multi-layer changes |
| `/find-missing-tests` | Identify untested code paths and suggest scaffolding | Coverage gaps detected |
| `/race-and-pick` | Parallel implementations — run 3 approaches, pick best | Competing approaches, uncertainty |
| `/learn` | Capture non-obvious lessons into this file | After problem-solving |
| `/session-summary` | Generate handoff summary with git stats, cost, next steps | End of session |

## Code Style

- **Model**: `deepseek-coder-v2` (free via LM Studio at localhost:1234/v1)
- **TypeScript strict mode**: No `any`; use `unknown` with `// @ts-expect-error` justification
- **Named exports only**: No default exports
- **Async/await**: Over `.then()` chains; use `try/catch` for error handling
- **Error messages**: Lowercase, no trailing period
- **Variable names**: Descriptive nouns; single letters only for loop counters
- **Max 200 lines per file**: Split into modules; max 4 parameters per function
- **Python**: Type hints required on all public functions/classes; Ruff for linting/formatting; mypy strict
- **Imports**: External → internal → relative; sort alphabetically within groups
- **Dead code**: Remove immediately; no commented-out code blocks

## Architecture

- **Lythic Obsidian Plugin**: `src/main.ts:15` `LythicPlugin` extends `Plugin` — lifecycle `onload`/`onunload`, ribbon `brain` icon, commands `lythic-open-graph`/`lythic-index-vault`, settings tab. Vault is `vault/` (markdown notes), plugin bundle is `main.js` via `esbuild.config.mjs:10` (external: `obsidian`, `electron`, `@codemirror/*`).
- **Build**: `npm run dev` (watch) / `npm run build` (prod) → `main.js` + `manifest.json` + `styles.css` → copy to `Vault/.obsidian/plugins/lythic/`
- **Layered**: presentation (Obsidian UI) → application (plugin commands) → domain (vault intelligence/graph) → infrastructure (fs, embeddings)
- **Dependency inversion**: Domain defines interfaces; infrastructure implements
- **No circular dependencies** between modules
- **ML**: Separate data, training, serving pipelines (vault index)
- **Git**: Conventional commits; squash-merge on main; delete branch after merge

## Rules & Restrictions

- Never commit without passing lint + typecheck + tests
- No direct DB access in application layer
- All external calls behind interfaces
- Secrets via environment variables only
- PRs require: review approval + CI green + updated docs
- ML experiments tracked with MLflow/W&B
- Model artifacts scanned for safety before deployment

## Design Patterns (Reference)

- **Creational**: Factory, Builder, Abstract Factory
- **Structural**: Adapter, Decorator, Facade, Proxy
- **Behavioral**: Strategy, Observer, Command, Template Method
- **Architectural**: Repository, Unit of Work, CQRS, Event Sourcing

## Available MCP Servers

| Server | Purpose |
|--------|---------|
| `github` | Repository, PR, Actions, Issues management |
| `semantic-scholar` | Academic paper search, citations, authors |
| `arxiv` | ArXiv paper search, download, analysis |
| `kubernetes` | Cluster management, deployments, logs |
| `ruff` | Python linting, formatting, type checking |
| `clean-code` | Clean code principles, architecture planning |
| `colab-exec` | Execute Python on Google Colab GPUs (T4/L4) |
| `kaggle-exec` | Execute Python on Kaggle GPUs |
| `runpod` | Manage RunPod GPU instances for training |
| `sonarqube` | Code quality, security, duplication analysis |
| `gitlab-ci` | GitLab CI/CD pipelines, MRs, jobs |
| `mcpfinder` | Discover MCP servers programmatically |

## Skills

| Skill | Purpose | Auto-Invoked When |
|-------|---------|-------------------|
| `clean-code` | 63 Clean Code principles + validation | New code, refactoring, PR review |
| `code-refactoring` | SOLID refactoring patterns | Code smells detected |
| `python-patterns` | Modern Python (type hints, dataclasses, DI) | Python files, ML code |
| `security-review` | OWASP Top 10, ML security | Auth code, deps, pre-release |
| `testing-patterns` | Test pyramid, TDD, property-based | New features, coverage gaps |

## Agent Permission Model

| Agent Type | Read | Write | Bash | Use Case |
|------------|------|-------|------|----------|
| **Reviewer** | ✅ | ❌ | ❌ | Code review, security audit |
| **Analyzer** | ✅ | ❌ | ✅ (read-only) | Research, metrics, logs |
| **Test Writer** | ✅ | ✅ (test files only) | ✅ (test commands) | TDD test creation |
| **Implementer** | ✅ | ✅ (scoped) | ✅ (scoped) | Feature implementation |
| **Architect** | ✅ | ❌ | ❌ | Design, ADRs, diagrams |

## Standard Pipeline

```
@architect → @test-engineer → @implementer → @review → @security-auditor
```

## Error Recovery

Task fails → `@debugger` diagnoses root cause → FIX (hand to implementer) or SKIP (log and continue)

## Communication

- **Explicit handoff**: "Pass to @review with focus on security"
- **Context summary**: Previous agent includes key findings in handoff
- **Structured output**: Use consistent formats (JSON, Markdown tables)
- **Error propagation**: Failed subagent returns error context to parent