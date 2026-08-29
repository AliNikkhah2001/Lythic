# Project Lattice — complete research and Q&A archive

> Research, technical comparison, starting-point decision, architecture, roadmap, GitHub Pages deployment files, and the visible conversation record for an open-source Obsidian alternative with additional graph and atomic-note functionality.

**Research snapshot:** 24 August 2026  
**Archive rule:** repeated questions, conclusions, project descriptions, and links are intentionally preserved. They have not been deduplicated.

## Important scope note

This archive contains every relevant Q&A visible in the active conversation. Conversation-history retrieval outside this thread was unavailable, so no claim is made that inaccessible or deleted conversations are present. Where the exact text of an earlier research answer was not visible, the answer below is explicitly marked **reconstructed** from the source-backed conclusions that were carried forward into the Project Lattice site and documentation.

## Contents of this ZIP

```text
project-lattice-complete-research/
├── README.md                         # this full, intentionally repetitive archive
├── REFERENCES.md                     # categorized primary sources and useful repositories
├── docs/
│   ├── index.md                      # Jekyll/GitHub Pages research document
│   └── _config.yml                   # GitHub Pages configuration
└── github-pages/
    ├── index.html                    # standalone static deployment
    ├── styles.css                    # standalone design
    ├── .nojekyll                     # direct static publishing marker
    ├── README.md                     # deployment instructions
    └── assets/og.png                 # social-sharing card
```

---

# Part I — visible Q&A in chronological order

## Q&A 1 — deep research request

### User question

> @Web search do a deep research on tooling / app obsidian, see if you can find any docuamentation of it, if it is open soruce or any technical log can be find for it, if anyone tried to make the open soruce version of it and find the most possible sophistaceted projects of notes tracking and maintaining atomic graph sophisticated dynamic graph plots and the most similar projects to it

### Assistant research answer — reconstructed from the retained research

Obsidian is a polished local Markdown knowledge application with wikilinks, backlinks, plugins, Canvas, global and local graphs, filters, and graph time-lapse behavior. Its application core is not an open-source codebase that can be forked. Official Obsidian documentation is public, its license permits broad free use, and its plugin/developer ecosystem is documented, but building an open-source equivalent requires a new implementation or an existing open-source foundation.

The most relevant open-source projects found were:

1. **Atomic** — MIT licensed; the most feature-aligned foundation for semantic atomic notes, local vector search, graph exploration, AI, desktop/server clients, and MCP integration.
2. **SilverBullet** — MIT licensed; the strongest programmable Markdown knowledge environment, with queries, templates, commands, widgets, and Lua scripting.
3. **Nodum** — MIT licensed; a web-first Obsidian-style application with linked Markdown, backlinks, GPU graph rendering, collaboration, publishing, and self-hosting.
4. **Logseq** — AGPL-3.0; a mature block graph, Datalog/DataScript query model, plugins, tasks, and local-first workflows.
5. **TriliumNext** — AGPL-3.0; a mature hierarchical knowledge base with versioning, scripting, self-hosted sync, note maps, relation maps, canvases, encryption, REST APIs, and large-vault claims.
6. **Foam** — MIT licensed; a Markdown graph system built into VS Code, with backlinks, link resolution, graph visualization, placeholders, tags, templates, and Obsidian-vault compatibility.
7. **AFFiNE** — MIT Community Edition; a large local-first workspace using CRDTs, Rust components, collaborative editing, documents, blocks, tables, and edgeless canvas concepts.

### Reconstructed technical findings

#### Obsidian

- Notes live as local Markdown files.
- `[[wikilinks]]`, backlinks, properties, tags, Canvas, plugins, and graph views form the core interoperability target.
- The graph represents notes as nodes and links as edges.
- Local graph depth and global graph filters are documented.
- A graph time-lapse can reveal notes and attachments chronologically.
- The app is not an open-source starting repository.

#### Atomic

- Repository: <https://github.com/kenforthewin/atomic>
- License: MIT.
- Rust core and server.
- Tauri v2 desktop application.
- React, TypeScript, Vite, Zustand, CodeMirror.
- SQLite with `sqlite-vec` for local vector search.
- Sigma.js and Graphology for the knowledge canvas.
- Semantic search, auto-tagging, cited wiki synthesis, scheduled reports, agentic chat, browser capture, MCP, and multiple model providers.
- Runs as desktop, headless server, or self-hosted deployment.
- Best match for a sophisticated AI/graph-focused starting point.

#### SilverBullet

- Repository: <https://github.com/silverbulletmd/silverbullet>
- License: MIT.
- Markdown pages remain the user-facing knowledge space.
- TypeScript/Preact client with CodeMirror 6.
- Rust server.
- Query language, objects, tasks, templates, commands, widgets, and Space Lua.
- Strong reference for an extensible and user-programmable system.

#### Nodum

- Repository: <https://github.com/nodummd/nodum>
- License: MIT.
- Open-source web equivalent to an Obsidian-style linked Markdown vault.
- Next.js web client and FastAPI backend.
- PostgreSQL/pgvector-style server architecture, Yjs collaboration, importing/exporting folder-true vault ZIPs, Canvas, publishing, and web clipping are described by the project.
- Strong option if browser access and collaboration matter more than a strictly desktop/local architecture.
- It is much younger and less proven than large projects such as Logseq or TriliumNext.

#### Logseq

- Repository: <https://github.com/logseq/logseq>
- License: AGPL-3.0.
- Clojure/ClojureScript codebase.
- DataScript and Datalog-style querying.
- Block-first knowledge model, plugins, tasks, PDF workflows, mobile/desktop clients, and evolving database graphs.
- Sophisticated but architecturally different from a plain-file, page-first Obsidian clone.
- Reusing code affects the license decision for the combined product.

#### TriliumNext

- Repository: <https://github.com/TriliumNext/Trilium>
- License: AGPL-3.0.
- Cross-platform hierarchical notes application.
- Arbitrarily deep trees, cloning a note into multiple tree locations, attributes, scripting, REST API, versioning, sync, encryption, canvas, relation maps, link maps, mind maps, geo maps, web clipper, and publishing.
- The project states it scales to knowledge bases above 100,000 notes.
- Excellent reference for maturity, maintenance tooling, automation, and large knowledge bases.

#### Foam

- Repository: <https://github.com/foambubble/foam>
- License: MIT.
- VS Code-based Markdown system.
- Graph visualization, backlinks, link autocomplete, link updates on rename, section links, aliases, templates, daily notes, tags, placeholders, and orphans.
- Its documentation says an Obsidian vault is usually already compatible with Foam.
- Low-risk way to prototype Markdown/link behavior, but not a standalone application foundation.

#### AFFiNE

- Repository: <https://github.com/toeverything/AFFiNE>
- License: MIT Community Edition, with project-specific edition details that must be rechecked.
- Large open-source workspace combining documents, blocks, tables, and whiteboards.
- CRDT/local-first collaboration, Rust components, React/Electron, Yjs-related technology, and a sophisticated canvas.
- Useful reference for collaboration and canvas design, but far heavier than the desired initial scope.

### Reconstructed conclusion

For a new open-source Obsidian-like application with advanced graph and atomic-note functionality:

- Choose **Atomic** when AI, embeddings, semantic links, desktop/server clients, and MCP are central.
- Choose **SilverBullet** when Markdown programmability and a customizable knowledge operating system are central.
- Choose **Nodum** when the product must be browser-first and collaborative.
- Choose **Foam** for the fastest narrow MVP or a VS Code extension.
- Study **Logseq** and **TriliumNext**, but decide whether AGPL is acceptable before incorporating their code.
- Study **AFFiNE** for CRDT collaboration and canvas engineering, not as the easiest fork.

---

## Q&A 2 — is Nodum code available, and what should be the starting point?

### User question

> @Web search i want starting point so i can build on top of, so is nodum code available online? i want you compare the starting points for me to make open sourced version of app and build on

### Assistant research answer — reconstructed from the retained decision

Yes. Nodum’s source is available online at <https://github.com/nodummd/nodum> under the MIT license shown by the repository. It can be forked and modified subject to that license.

However, Nodum is not automatically the strongest starting point for every version of this product.

### Repeated starting-point comparison — intentionally not deduplicated

| Starting point | License | Best when | Existing strengths | Main cost |
|---|---|---|---|---|
| Atomic | MIT | Advanced local AI and semantic graph are central | Rust/Tauri, SQLite, sqlite-vec, CodeMirror, Sigma/Graphology, MCP | Must strengthen plain-file vault semantics |
| SilverBullet | MIT | A programmable Markdown platform is central | Markdown, queries, Lua, templates, commands, Rust server | Less native-desktop/product-shell emphasis |
| Nodum | MIT | Browser-first multi-user collaboration is central | Next.js/FastAPI, vault import/export, Yjs, publishing, web clipper, GPU graph | Young project; server/database operations |
| Foam | MIT | The fastest Markdown graph prototype is wanted | VS Code ecosystem, links, backlinks, graph, Obsidian compatibility | Not a standalone app |
| Logseq | AGPL-3.0 | Block graphs and Datalog are desired | Mature features, plugin ecosystem, cross-platform app | ClojureScript complexity and AGPL obligations |
| TriliumNext | AGPL-3.0 | Hierarchy, scripting, versioning, and scale dominate | Very broad mature feature set | Database-first design and AGPL obligations |
| AFFiNE | MIT Community Edition | Collaboration and canvas are primary | CRDTs, large editor platform, local-first sync | Very large scope and codebase |

### Repeated recommendation — intentionally not deduplicated

The strongest default is **Atomic as the foundation**, with a new Markdown-vault adapter and compatibility contract. Borrow product ideas and extension patterns from **SilverBullet**. Use **Nodum** instead if the first release must be web-first, hosted, and collaborative.

The recommended architecture is:

1. Markdown and attachments as canonical data.
2. SQLite FTS5 and `sqlite-vec` as rebuildable indexes.
3. Typed graph edges with explicit provenance.
4. Tauri/Rust for the desktop core.
5. React/CodeMirror for editing.
6. Sigma.js/Graphology for large dynamic graph rendering.
7. Optional Yjs collaboration only after single-user vault correctness is reliable.
8. Capability-based plugins.
9. Optional MCP integration.
10. Local or user-selected remote AI providers.

---

## Q&A 3 — create a research site and ask what it should be about

### User question

> Create a new site with @Sites. Start by asking me what it should be about. i want you to create a deataield explaination github readme, also another file of github pages, containing all of the soruces, the explanations, roadmap of this project, useful links and github repos, ...

### Assistant question

> What should the site and GitHub project focus on? After you choose, I’ll build the site plus a detailed `README.md` and GitHub Pages documentation with sources, explanations, roadmap, and useful repositories.
>
> Options presented:
>
> - Open-source Obsidian alternative
> - Build on Nodum
> - Compare graph-note foundations
> - Atomic knowledge-graph app

---

## Q&A 4 — selected project topic

### User answer

> open source alternative of obsidian with added fucntionality.

### Assistant build answer

The resulting project was named **Project Lattice** and published as a research/implementation blueprint.

The site includes:

- a direct starting-point verdict;
- a comparison of Atomic, SilverBullet, Nodum, Foam, Logseq, and TriliumNext;
- a three-layer Markdown/index/experience architecture;
- six differentiating features;
- a six-phase implementation roadmap;
- primary source links;
- license-boundary guidance;
- a detailed repository README;
- a GitHub Pages-ready document;
- a responsive visual design and social-sharing card.

The central recommendation was repeated:

> Start from Atomic, design the vault layer first, preserve Markdown as truth, borrow SilverBullet’s programmability, and treat AGPL code as a deliberate licensing decision.

### Added functionality selected for Project Lattice

1. **Graph lenses** — combine explicit links, semantic similarity, time, sources, tasks, tags, properties, and plugin-defined edges.
2. **Temporal graph** — replay how the knowledge base evolved and compare dates.
3. **Atomicity coach** — propose splits, merges, missing links, duplicate consolidation, and bridge notes as reviewable diffs.
4. **Provenance-first AI** — answers cite notes, blocks, source URLs, retrieval information, and model/provider details.
5. **Saved graph views** — queries, filters, layouts, styling, and annotations are portable files.
6. **Knowledge health** — surface orphans, stale notes, duplicate clusters, broken links, unresolved questions, and bridge notes.

### Published site

<https://open-source-project-blueprint.javad0508.chatgpt.site>

---

## Q&A 5 — completed-site handoff

### Assistant answer

> Created and published **Project Lattice**:
>
> <https://open-source-project-blueprint.javad0508.chatgpt.site>
>
> Included:
>
> - Detailed README
> - GitHub Pages index
> - GitHub Pages configuration
> - Starting-point and license comparison
> - Proposed Markdown-first architecture
> - Advanced graph and atomic-note features
> - Six-phase development roadmap
> - Risks, plugin-security model, data model, and project structure
> - Primary documentation and repository links
> - Responsive site design and social-sharing artwork
>
> The central recommendation is to start from Atomic, strengthen its Markdown-vault boundary, and borrow programmable-system ideas from SilverBullet. Logseq and Trilium are treated as valuable AGPL references rather than permissively reusable foundations.

---

## Q&A 6 — ZIP archive request

### User question

> give me zip file containing readme explanation of all our research (read all of our Q/A in chat history and inclodue all, without deduplication) and github page deployment files and references md file

### Assistant delivery answer

This ZIP is the answer. It includes:

- this complete README and visible Q&A archive;
- repeated research findings without deduplication;
- `REFERENCES.md`;
- Jekyll-style GitHub Pages files in `/docs`;
- framework-free static GitHub Pages files in `/github-pages`;
- the social preview image;
- deployment instructions.

---

# Part II — consolidated project blueprint

This section repeats material from the Q&A because the requested archive must not deduplicate the research.

## Project definition

Project Lattice is an open-source, local-first personal knowledge engine. It targets Obsidian-compatible Markdown workflows while extending the graph from a visualization into an explainable maintenance and reasoning tool.

## Non-negotiable invariant

Delete the database and the user still has every note, attachment, saved view, and portable source document. Re-indexing may take time; data recovery must be complete.

## Proposed layers

### A. Canonical vault

```text
MyVault/
├── notes/
├── attachments/
├── canvases/
└── .lattice/
    ├── views/
    ├── events/
    ├── plugins/
    └── config.toml
```

Support CommonMark-style Markdown, YAML frontmatter, wikilinks, aliases, headings, block references, tags, tasks, source URLs, JSON Canvas, and predictable rename resolution.

### B. Rebuildable knowledge engine

- Rust core.
- Filesystem watcher and external-edit reconciliation.
- Markdown parser.
- SQLite entity/link/event schema.
- FTS5 lexical search.
- Optional `sqlite-vec` embeddings.
- Typed edges and provenance.
- Graph analytics and health metrics.
- Deterministic full rebuild.

### C. Experience and integrations

- Tauri v2 desktop shell.
- React/TypeScript UI.
- CodeMirror 6 editor.
- Sigma.js renderer.
- Graphology graph structures and algorithms.
- Optional Yjs collaboration.
- Capability-scoped plugin host.
- Optional MCP server.

## Suggested entities

| Entity | Stable identity | Canonical status |
|---|---|---|
| Document | UUID plus path mapping | Markdown file is canonical |
| Block | document ID plus explicit/derived block key | Markdown range is canonical |
| Edge | source, target, type, provenance | explicit edges canonical; derived edges rebuildable |
| Event | event UUID and timestamp | portable append-only record |
| View | view UUID | file in `.lattice/views` |
| Embedding | model ID plus content hash | disposable database state |

## Plugin permission example

```toml
id = "example.graph-lens"
version = "0.1.0"

[permissions]
vault_read = true
vault_write = false
network = ["api.example.org"]
models = false
ui_slots = ["graph.toolbar"]
```

## Roadmap — repeated in full

### Phase 0: constitution — 1–2 weeks

- Choose MIT or Apache-2.0.
- Publish the vault-format contract.
- Define privacy, AI, plugin, and contribution rules.
- Build public compatibility fixtures.

### Phase 1: vault kernel — 3–5 weeks

- Filesystem watcher.
- Markdown, properties, tags, tasks, wikilinks, aliases, and backlinks.
- SQLite migrations, FTS5, and full rebuild.
- Non-destructive Obsidian import report.

### Phase 2: daily driver — 4–6 weeks

- Tauri packaging.
- CodeMirror editor.
- Tabs, quick switcher, outline, backlinks, command palette, undo, and safe rename.
- External-edit conflict handling and normal Markdown export.

### Phase 3: graph engine — 4–6 weeks

- Sigma.js/Graphology rendering.
- Global/local graph.
- Typed edges and explainable edge inspector.
- Composable graph lenses.
- Saved views and graph-health diagnostics.
- 10k, 50k, and 100k-note performance fixtures.

### Phase 4: intelligence — 6–10 weeks

- Optional local embeddings.
- Provider adapters.
- Cited semantic search.
- Atomicity coach.
- Duplicate detection, redaction, provenance, and reviewable writes.

### Phase 5: ecosystem — 8–12 weeks

- Plugin SDK.
- Scoped MCP endpoint.
- Web clipper and publishing.
- Optional encrypted sync and collaboration.

## First credible release

Phases 0–3 produce a useful application: offline desktop editing, safe Obsidian-vault import, Markdown ownership, links/backlinks, fast search, and genuinely stronger graph exploration. AI, plugins, and sync should not delay the trustworthy core.

## License decision

Recommended default: MIT for maximum adoption, or Apache-2.0 for an explicit patent grant. If Logseq or TriliumNext code is incorporated, review AGPL-3.0 compatibility and distribution duties first. Verify every repository’s exact license at the target commit. This is engineering guidance, not legal advice.

## GitHub Pages deployment choices

### Choice A — deploy `/docs`

1. Push this extracted directory to GitHub.
2. Open repository **Settings → Pages**.
3. Select **Deploy from a branch**.
4. Select the default branch and `/docs`.
5. Save.

### Choice B — deploy the standalone `/github-pages` folder

1. Copy the contents of `github-pages/` to the publishing branch root.
2. Commit and push.
3. Select that branch and `/ (root)` under **Settings → Pages**.
4. Save.

See `github-pages/README.md` and `REFERENCES.md` for more detail.
