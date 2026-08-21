# Agent Usage Guidelines

## When to Delegate to Subagents

### Use Subagents For:
- **Research/Analysis**: Reading many files, searching codebase, literature review
- **Code Review**: Fresh-eyes pass with read-only permissions
- **Parallel Exploration**: Multiple approaches simultaneously (`/race-and-pick`)
- **Specialized Domains**: Security audit, architecture review, performance analysis
- **Verification**: Running tests, linting, type-checking after changes

### Don't Use Subagents For:
- **Simple edits**: Single file changes, obvious fixes
- **Interactive workflows**: Requiring user clarification mid-task
- **Stateful operations**: Building on previous tool results in same context
- **Trivial tasks**: Where overhead > value

## Subagent Permission Model

| Agent Type | Read | Write | Bash | Use Case |
|------------|------|-------|------|----------|
| **Reviewer** | ✅ | ❌ | ❌ | Code review, security audit |
| **Analyzer** | ✅ | ❌ | ✅ (read-only) | Research, metrics, logs |
| **Test Writer** | ✅ | ✅ (test files only) | ✅ (test commands) | TDD test creation |
| **Implementer** | ✅ | ✅ (scoped) | ✅ (scoped) | Feature implementation |
| **Architect** | ✅ | ❌ | ❌ | Design, ADRs, diagrams |

## Multi-Agent Workflows

### Standard Pipeline
```
@architect → @test-engineer → @implementer → @review → @security-auditor
```

### Emergency Hotfix
```
@implementer (scoped) → @test-engineer (targeted) → @review (fast)
```

### Research Task
```
@analyzer (broad) → @architect (synthesis) → @implementer
```

## Agent Communication
- **Explicit handoff**: "Pass to @review with focus on security"
- **Context summary**: Previous agent includes key findings in handoff
- **Structured output**: Use consistent formats (JSON, Markdown tables)
- **Error propagation**: Failed subagent returns error context to parent

## Agent Configuration
- **Model per role**: Opus for architect/review; Sonnet for implementer; Haiku for formatter
- **Temperature per role**: 0.1-0.3 for code; 0.0 for deterministic tasks
- **Max tokens**: 8000 default; 32000 for architect/analyzer
- **System prompts**: Role-specific, version-controlled in `.opencode/agents/`