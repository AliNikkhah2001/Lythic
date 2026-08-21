# Clean Code Skill

Expert-level clean code principles and automated validation for production code quality.

## Principles (Robert C. Martin)

### 1. Meaningful Names
- **Intention-revealing**: `elapsedTimeInDays` not `d`
- **Avoid disinformation**: `accountList` only if actually a List
- **Pronounceable**: `generationTimestamp` not `genymdhms`
- **Searchable**: `MAX_CLASSES_PER_STUDENT` not `7`
- **Class names**: Nouns (`Customer`, `Account`) not verbs
- **Method names**: Verbs (`postPayment`, `deletePage`)
- **One word per concept**: `fetch`, `retrieve`, `get` — pick one

### 2. Functions
- **Small**: < 20 lines, < 4 parameters
- **One thing**: Do it well, do it only
- **Descriptive names**: `canPayWithCreditCard` not `check`
- **No side effects**: Pure functions where possible
- **Command Query Separation**: Methods either mutate OR return, not both
- **Prefer exceptions over error codes**: Try/catch over return codes

### 3. Comments
- **Don't comment bad code — rewrite it**
- **Explain WHY, not WHAT**
- **Legal/copyright only at top**
- **TODO comments**: Include ticket reference (`TODO(#123):`)
- **No commented-out code**: Delete it (git history exists)

### 4. Formatting
- **Vertical density**: Related lines together
- **Vertical ordering**: Caller above callee (newspaper metaphor)
- **Horizontal**: 100 chars max, meaningful alignment
- **Team standards**: Automated (Biome/Ruff/Prettier)

### 5. Objects & Data Structures
- **Hide data**: Private fields, public methods
- **Data/Object anti-symmetry**: Objects expose behavior, data exposes structure
- **Law of Demeter**: `a.b().c()` → `a.getC()` or `a.doSomething()`
- **DTOs**: Public fields OK for transfer objects

### 6. Error Handling
- **Exceptions over codes**: Cleaner call stacks
- **Context with exceptions**: `throw new PaymentFailedException(orderId, reason, cause)`
- **Define exception hierarchy**: Domain-specific exceptions
- **Don't return null**: Use Optional/Result types, Null Object pattern
- **Don't pass null**: Fail fast at boundary

### 7. Boundaries
- **Interfaces at boundaries**: Explore and learn third-party code in tests
- **Adapters**: Wrap external APIs, control dependency direction
- **Learning tests**: Test third-party behavior you depend on

### 8. Unit Tests (FIRST)
- **Fast**: < 100ms each
- **Independent**: No shared state, run in any order
- **Repeatable**: Same result every run
- **Self-validating**: Boolean pass/fail, no manual inspection
- **Timely**: Written before production code (TDD)

### 9. Classes
- **Small**: < 200 lines, single responsibility
- **Cohesion**: Methods use instance variables
- **Organized**: Public static → Private static → Public instance → Private instance
- **Dependency Inversion**: Depend on abstractions, inject concretions

### 10. Systems
- **Separate construction from use**: Factories, DI containers
- **Cross-cutting concerns**: AOP, decorators, middleware
- **Standards**: Enable, don't constrain (JSR-330, etc.)

### 11. Emergence (Kent Beck's Rules)
1. Runs all tests
2. No duplication (DRY)
3. Expresses intent
4. Minimizes classes/methods

### 12. Concurrency
- **Single Responsibility**: Thread-safety separate from business logic
- **Limit scope**: `synchronized` on smallest scope
- **Immutable preferred**: Thread-safe by design
- **Copy-on-write**: For shared data
- **Libraries over custom**: `java.util.concurrent`, `asyncio`, `tokio`

### 13. Smells & Heuristics
- **Rigidity**: Hard to change → Decouple
- **Fragility**: Breaks unexpectedly → Test more
- **Immobility**: Hard to reuse → Extract modules
- **Viscosity**: Easy to do wrong → Make right way easy
- **Needless complexity**: YAGNI → Delete unused
- **Needless repetition**: DRY → Extract
- **Opacity**: Hard to understand → Rename, restructure

## Automated Validation

### Run After Every Change
```bash
# Python
ruff check . --select=ALL
ruff format . --check
mypy . --strict

# TypeScript
npx @biomejs/biome check --write
npx tsc --noEmit

# General
npm run lint
npm run typecheck
npm test
```

### Pre-Commit Gates
- All linting passes
- All type checking passes
- All tests pass (80%+ coverage)
- Security audit clean
- No `any` types (TypeScript)
- No `print`/`console.log` in production code

## Code Review Checklist

When reviewing, verify:
- [ ] Names reveal intent
- [ ] Functions < 20 lines, 1 thing
- [ ] No duplication (Rule of 3)
- [ ] Tests for all new behavior
- [ ] Error handling with context
- [ ] No commented code
- [ ] Dependencies inverted
- [ ] Boundaries protected
- [ ] Concurrency safe

## Skill Invocation

Agents should invoke this skill when:
- Writing new production code
- Refactoring existing code
- Reviewing pull requests
- Establishing project standards

**Command**: `@clean-code` or agent auto-invokes via AGENTS.md rules