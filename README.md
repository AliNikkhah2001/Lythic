# Lythic — Obsidian Note-Taking System

> **AI-augmented Obsidian vault with graph intelligence and autonomous multi-agent workflows.**
> Built from [`Tools_AI-MCP` starter-pack](https://github.com/AliNikkhah2001/Tools_AI-MCP) (`opencode.json` + 7 agents + 8 commands + 5 skills + Superpowers) — upstream is **Lythic** (`Lithic_note-taking-system`).

---

## 🚀 Clone & Setup (starter-pack → Lythic upstream)

```bash
# 1. Clone starter-pack (fixed 2025-08-21: 7 agents, 8 commands, 8 rules, 5 skills)
git clone https://github.com/AliNikkhah2001/Tools_AI-MCP.git lythic-temp
cp -r lythic-temp/starter-pack Lythic
# or: cp -r Tools_AI-MCP/starter-pack Lithic_note-taking-system  (what this repo did)

# 2. Switch upstream to Lythic
cd Lithic_note-taking-system
git init # if new
git remote add origin https://github.com/AliNikkhah2001/Lithic_note-taking-system.git
# or if cloned from Tools_AI-MCP:
git remote set-url origin https://github.com/AliNikkhah2001/Lithic_note-taking-system.git
git remote -v # verify: origin → Lithic_note-taking-system

# 3. Verify OpenCode
opencode --version # 1.18.20
cat opencode.json # provider metis + 15 MCP + 2 plugins
cat .opencode/agents/*.md | head   # 7 agents
opencode
/context-prime
```

**This repo already done:** `starter-pack` copied from `Tools_AI-MCP/starter-pack` (`6c11e43` fix) and upstream set to `https://github.com/AliNikkhah2001/Lithic_note-taking-system.git` — just `opencode` and build.

---

## 📦 Project Structure

```
Lithic_note-taking-system/   # repo root = Lythic (Obsidian plugin + vault)
├── manifest.json             # Obsidian plugin manifest (id: lythic, v0.1.0)
├── versions.json             # version → minAppVersion map
├── package.json              # npm: build/dev/lint/test/typecheck
├── tsconfig.json             # strict TypeScript
├── esbuild.config.mjs        # Obsidian bundling (external: obsidian/electron)
├── styles.css                # plugin styles
├── src/
│   ├── main.ts               # Plugin entry (ribbon, commands: open-graph, index-vault)
│   └── settings.ts           # LythicSettings interface
├── vault/                    # Obsidian vault (your notes)
│   └── Welcome to Lythic.md
├── .opencode/                # OpenCode pipeline (from starter-pack)
│   ├── agents/ (7)           # architect, review, security-auditor, test-engineer, backend/frontend/ml
│   ├── commands/ (8)         # context-prime, finish-work, careful-review, check-cross-layer, …
│   ├── rules/ (8)            # agents, coding-style, git-workflow, hooks, patterns, …
│   ├── skills/ (5)           # clean-code, python-patterns, code-refactoring, security-review, testing-patterns
│   └── plugins/compaction.ts # token compaction (ANSI strip, diff truncate 35 lines)
├── opencode.json             # provider metis (api.metisai.ir) + 15 MCP + plugins
├── AGENTS.md                 # agent guidelines + Obsidian plugin lifecycle
├── guardrails.md             # quality gates + anti-patterns
└── .gitignore                # env + node_modules + main.js + vault/.obsidian/workspace
```

---

## 🧠 Obsidian Plugin — Lythic

**Manifest:** `manifest.json:2` `id: lythic`, `name: Lythic`, `minAppVersion 1.5.0`

**Commands (`src/main.ts:15`):**
- `lythic-open-graph` — Enhanced graph modal
- `lythic-index-vault` — Index vault for semantic search (roadmap: embeddings)

**Build:**
```bash
npm install
npm run dev     # watch (esbuild)
npm run build   # production → main.js
npm run typecheck
npm run lint
```

Install in Obsidian: copy `main.js`, `manifest.json`, `styles.css` to `Vault/.obsidian/plugins/lythic/`

---

## 🤖 OpenCode Pipeline (from starter-pack)

**Agents (7):** `@architect` (read-only), `@review`, `@security-auditor`, `@test-engineer` (test files only), `@backend-specialist`, `@frontend-specialist`, `@ml-engineer`

**Commands:**
```
/context-prime    # load repo context
/finish-work      # lint → typecheck → test → security (never skip)
/careful-review  # fresh-eyes review
/check-cross-layer
/find-missing-tests
/race-and-pick
/learn
/session-summary
```

**Standard pipeline:**
```
@architect → @test-engineer → @implementer → @review → @security-auditor
```

**Example:**
```bash
opencode
/context-prime
@architect "Design Lythic vault intelligence: embeddings + link inference"
@test-engineer "Create tests for vault indexing"
@frontend-specialist "Implement graph enhancement UI"
@backend-specialist "Implement embedding pipeline"
 /careful-review
 /finish-work
```

**Skills (5 + 12 Superpowers):** `clean-code` (12 rules), `python-patterns`, `code-refactoring` (11 patterns), `security-review` (OWASP), `testing-patterns` (pyramid 70/20/10) + Superpowers `brainstorming`, `tdd`, etc. via `superpowers@6.3.0`

**MCP (15):** `github`, `agent-lsp`, `context7`, `playwright`, `semantic-scholar`, `arxiv`, `kubernetes`, `ruff`, `clean-code`, `colab-exec`, `kaggle-exec`, `runpod`, `sonarqube`, `gitlab-ci`, `mcpfinder`

---

## 🔑 Config

**`opencode.json:3` provider:**
```json
"metis": { "npm": "@ai-sdk/openai-compatible", "baseURL": "https://api.metisai.ir/openai/v1", "apiKey": "tpsg-..." }
```

**Plugins:** `./.opencode/plugins/compaction.ts` ( `maxDiffLinesPerFile:35` ) + `superpowers@git+https://github.com/obra/superpowers.git`

**User config** `~/.config/opencode/opencode.json` mirrors same provider/plugins. Verified `opencode --version` → `1.18.20`

---

## 📁 Guardrails

- `npm run typecheck` + `npm run lint` + `npm test` (80%+) before commit
- Never commit `.env`/`main.js` (built artifact) — in `.gitignore`
- Secrets via `env:` only

---

## 🚢 Push to Lythic upstream

```bash
git add -A
git commit -m "feat(lythic): init Obsidian plugin from starter-pack (7 agents, vault, manifest)"
git push -u origin main
```

> Note: directory is `Lithic_note-taking-system` (with `i`) but app name is **Lythic** (with `y`) — intentional alias; rename repo/directory to `Lythic` if you want exact match: `git remote set-url origin https://github.com/AliNikkhah2001/Lythic.git` after creating new repo.

---

Built with starter-pack `Tools_AI-MCP@6c11e43` + OpenCode `1.18.20` + Superpowers `6.3.0`
