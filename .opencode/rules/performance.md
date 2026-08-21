# Performance Rules

## Model Selection
- **Default**: `deepseek/deepseek-coder-v2` (balanced speed/quality)
- **Complex reasoning**: `deepseek/deepseek-math-v2` (architecture, security)
- **High-volume/low-latency**: `deepseek/deepseek-coder-v2` (formatting, simple edits)
- **Local/privacy**: Ollama with `llama3.1:70b` or `codellama:34b`

## Context Management
- **Prime context**: Run `/context-prime` before complex tasks
- **Compact strategically**: Use `/strategic-compact` skill when context > 70%
- **Reference over inline**: Use `@file` references instead of pasting large files
- **Subagents for isolation**: Delegate research/analysis to read-only subagents

## Token Optimization
- **MCP resources over tools**: Use resources for large data (agent fetches only needed parts)
- **Schema quality**: Verbose tool descriptions = fewer failed invocations
- **Batch operations**: Single tool call with array vs multiple calls
- **Disable verbose servers**: Turn off GitHub MCP when not needed (high token usage)

## Cost Control
- **Max tokens per request**: 8000 default; 32000 for complex tasks
- **Temperature**: 0.1-0.3 for code; 0.7 for creative; 0.0 for deterministic
- **Monitor usage**: Check `/usage` command; alert at $10/day
- **Cache responses**: Enable caching for repeated queries (documentation, schemas)

## Latency Targets
- **Simple edits**: <5 seconds
- **Feature implementation**: <60 seconds
- **Code review**: <30 seconds
- **Research/analysis**: <120 seconds
- **MCP tool calls**: <10 seconds each (timeout: 30s default)

## Resource Limits
- **Parallel subagents**: Max 3 concurrent
- **MCP servers enabled**: Max 8 (disable unused)
- **File operations**: Batch reads/writes; avoid loops with single file ops
- **Search operations**: Use `glob` + `grep` over `task` for simple searches