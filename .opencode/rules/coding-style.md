# Coding Style Rules

## TypeScript/JavaScript
- **Strict mode**: `"strict": true` in tsconfig.json
- **No `any`**: Use `unknown` or proper types; `// @ts-expect-error` only with justification comment
- **Named exports only**: `export function foo()` not `export default`
- **Async/await**: No `.then()` chains; use `try/catch` for error handling
- **Error messages**: lowercase, no trailing period (e.g., `failed to connect to database`)
- **Variable names**: descriptive nouns (`userRepository`, `maxRetries`); single letters only for loop counters
- **Max 200 lines/file**: Split into modules; max 4 parameters per function
- **Imports**: Group: external → internal → relative; sort alphabetically within groups
- **Formatting**: 2 spaces, 100 char line width, single quotes, trailing commas (Biome/Prettier)

## Python
- **Type hints**: Required on all public functions/classes
- **Dataclasses**: Use `@dataclass` for data containers over regular classes
- **Pathlib**: Use `Path` over `os.path`
- **Structured logging**: Use `structlog` with JSON output
- **Ruff**: Line length 100, target py311, `I` (isort) + `UP` (pyupgrade) + `C4` (flake8-comprehensions)
- **Mypy**: Strict mode, `disallow_untyped_defs = true`
- **Imports**: Absolute imports; `from __future__ import annotations`

## General
- **Git commits**: Conventional Commits (`feat:`, `fix:`, `refactor:`, `docs:`, `test:`, `chore:`)
- **Branch names**: `type/scope-description` (e.g., `feat/auth-add-oauth2`)
- **PR titles**: Same as commit convention; link issue (`fixes #123`)
- **Comments**: Only for *why*, not *what*; update when code changes
- **Dead code**: Remove immediately; no commented-out code blocks