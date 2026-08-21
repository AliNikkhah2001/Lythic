# Git Workflow Rules

## Branching Strategy
- **main**: Protected, deployable, only via PR merge
- **develop** (optional): Integration branch for release preparation
- **Feature branches**: `feat/scope-description` from main
- **Bug fixes**: `fix/scope-description` from main
- **Hotfixes**: `hotfix/description` from main, backport to develop
- **Release branches**: `release/vX.Y.0` for release stabilization

## Commit Convention (Conventional Commits)
```
<type>(<scope>): <description>

[optional body]

[optional footer(s)]
```

**Types**: `feat`, `fix`, `refactor`, `docs`, `test`, `chore`, `perf`, `security`, `ci`
**Scopes**: `auth`, `api`, `db`, `ui`, `ml`, `infra`, `config`

**Examples**:
```
feat(auth): add OAuth2 Google provider
fix(api): handle null response in user endpoint
refactor(db): extract repository base class
security(deps): update lodash to 4.17.21 (CVE-2021-23337)
```

## Pull Requests
- **Title**: Same as commit convention; link issue (`fixes #123`)
- **Description**: What, Why, How; screenshots for UI changes
- **Reviewers**: Minimum 2 approvals (1 domain expert, 1 cross-functional)
- **Checks**: All CI green (lint, typecheck, unit, integration, security)
- **Size**: <400 lines changed; split large PRs
- **Draft PRs**: For WIP; convert to ready when reviewable

## Merge Strategy
- **Squash and merge** for feature branches (clean history)
- **Rebase and merge** for hotfixes (preserve commits)
- **No merge commits** on main
- Delete branch after merge (auto-delete enabled)

## Versioning
- **Semantic Versioning**: MAJOR.MINOR.PATCH
- **Release tags**: `v1.2.3` on main after merge
- **Changelog**: Auto-generated from conventional commits
- **Pre-releases**: `v1.2.0-rc.1`, `v1.2.0-beta.2`

## Git Hygiene
- `git pull --rebase` before pushing
- Amend commits locally before push (`git commit --amend`)
- No force push to shared branches
- Sign commits with GPG (`git commit -S`)