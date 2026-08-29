# Project Lattice references

**Reviewed:** 24 August 2026

This catalog favors official documentation, source repositories, specifications, and project-owned technical material. Repository features, activity, dependencies, and licenses can change. Verify the exact commit and license before adopting code.

## 1. Obsidian reference behavior

### Obsidian product and documentation

- **Product site:** <https://obsidian.md/>  
  Reference for the current product position, local knowledge workflows, graph, Canvas, and extensibility.

- **Graph view documentation:** <https://obsidian.md/help/plugins/graph>  
  Documents global graph, local graph, nodes, edges, filters, force controls, depth, and time-lapse behavior.

- **License overview:** <https://obsidian.md/license>  
  Official usage-license summary. This is not an open-source application repository.

- **Developer documentation:** <https://docs.obsidian.md/>  
  Plugin API, app concepts, and extension-development reference.

- **JSON Canvas:** <https://jsoncanvas.org/>  
  Open file format for infinite-canvas data. Useful for interoperable canvas support.

## 2. Primary candidate repositories

### Atomic

- **Repository:** <https://github.com/kenforthewin/atomic>
- **License shown by repository:** MIT
- **Relevant technologies:** Rust, Tauri v2, React, TypeScript, CodeMirror 6, SQLite, `sqlite-vec`, Sigma.js, Graphology, MCP.
- **Relevant features:** Markdown atoms, semantic search, graph canvas, cited synthesis, reports, multiple model providers, browser clipper, MCP, desktop and self-hosted server modes.
- **Research role:** recommended permissive starting point.

### SilverBullet

- **Repository:** <https://github.com/silverbulletmd/silverbullet>
- **Documentation:** <https://silverbullet.md/>
- **License shown by repository:** MIT
- **Relevant technologies:** Rust server, TypeScript/Preact, CodeMirror 6, Space Lua.
- **Relevant features:** Markdown pages, backlinks, objects, queries, tasks, templates, commands, widgets, scripting.
- **Research role:** best reference for programmability and end-user extension design.

### Nodum

- **Repository:** <https://github.com/nodummd/nodum>
- **Project site:** <https://nodum.md/>
- **License shown by repository:** MIT
- **Relevant technologies described by the project:** Next.js, FastAPI, PostgreSQL/vector search, Yjs-style collaboration, GPU-rendered graph.
- **Relevant features:** web vaults, linked Markdown, backlinks, import/export, collaboration, Canvas, publishing, web clipper, self-hosting.
- **Research role:** web-first alternative starting point.

### Foam

- **Repository:** <https://github.com/foambubble/foam>
- **Documentation:** <https://foambubble.github.io/foam/>
- **License shown by repository:** MIT
- **Relevant technologies:** VS Code extension ecosystem, Markdown, graph visualization.
- **Relevant features:** wikilinks, backlinks, aliases, sections, templates, tags, orphans, placeholders, daily notes, rename updates.
- **Research role:** fastest narrow Markdown-graph MVP and compatibility reference.

## 3. Sophisticated projects to study

### Logseq

- **Repository:** <https://github.com/logseq/logseq>
- **Project site:** <https://logseq.com/>
- **License shown by repository:** AGPL-3.0
- **Relevant technologies:** Clojure, ClojureScript, DataScript, Datalog, Electron/web/mobile tooling.
- **Relevant features:** block graph, queries, tasks, PDF annotations, plugins, themes, database graphs, collaboration work.
- **Research role:** graph-query and block-identity reference.
- **License note:** decide whether AGPL is acceptable before incorporating code.

### TriliumNext

- **Repository:** <https://github.com/TriliumNext/Trilium>
- **Documentation:** <https://docs.triliumnotes.org/>
- **License shown by repository:** AGPL-3.0
- **Relevant technologies:** TypeScript/JavaScript application, desktop/server delivery, SQLite-centered model, CKEditor, CodeMirror, Excalidraw, mapping libraries.
- **Relevant features:** deep hierarchy, cloning, attributes, scripting, REST API, versioning, sync, encryption, relation maps, link maps, mind maps, geo maps, web clipper, publishing.
- **Research role:** mature application, scale, maintenance, scripting, and visualization reference.
- **License note:** decide whether AGPL is acceptable before incorporating code.

### AFFiNE

- **Repository:** <https://github.com/toeverything/AFFiNE>
- **Project site:** <https://affine.pro/>
- **License information:** inspect the repository’s current Community/Enterprise edition files and target commit.
- **Relevant technologies:** React, Electron, Rust components, CRDTs, Yjs-related infrastructure, collaborative block/canvas systems.
- **Research role:** large-scale local-first collaboration and canvas reference.

### Notesium

- **Repository:** <https://github.com/alonswartz/notesium>
- **Relevant features:** Markdown notes, bidirectional links, search, previews, embedded web editor, interactive graph.
- **Research role:** smaller linked-note and graph implementation reference.

### Note Graph

- **Repository:** <https://github.com/hikerpig/note-graph>
- **Relevant technologies:** TypeScript, D3.js, force-graph.
- **Research role:** focused graph-visualization library for document spaces.

### Lumina Note

- **Repository:** <https://github.com/blueberrycongee/Lumina-Note>
- **Relevant ideas:** plain Markdown, graph views, PDFs, and an agent that can work across a vault.
- **Research role:** emerging agent-native Markdown application reference.

## 4. Recommended implementation technologies

### Desktop and application shell

- **Tauri:** <https://tauri.app/>  
  Cross-platform application framework with a Rust core and web UI.

- **Tauri repository:** <https://github.com/tauri-apps/tauri>

### Editor and Markdown

- **CodeMirror 6:** <https://codemirror.net/>
- **CodeMirror repository:** <https://github.com/codemirror/dev>
- **CommonMark specification:** <https://spec.commonmark.org/>
- **CommonMark project:** <https://commonmark.org/>

### Local database and search

- **SQLite:** <https://www.sqlite.org/>
- **SQLite FTS5:** <https://www.sqlite.org/fts5.html>
- **sqlite-vec:** <https://github.com/asg017/sqlite-vec>

### Graph rendering and analysis

- **Sigma.js:** <https://www.sigmajs.org/>
- **Sigma.js repository:** <https://github.com/jacomyal/sigma.js>
- **Graphology documentation:** <https://graphology.github.io/>
- **Graphology repository:** <https://github.com/graphology/graphology>
- **D3:** <https://d3js.org/>

### Collaboration and local-first research

- **Yjs documentation:** <https://docs.yjs.dev/>
- **Yjs repository:** <https://github.com/yjs/yjs>
- **Automerge:** <https://automerge.org/>
- **Local-first software paper:** <https://www.inkandswitch.com/essay/local-first/>

### Integration and automation

- **Model Context Protocol:** <https://modelcontextprotocol.io/>
- **MCP specification repository:** <https://github.com/modelcontextprotocol/modelcontextprotocol>
- **WebAssembly:** <https://webassembly.org/>
- **WASI:** <https://wasi.dev/>

## 5. GitHub Pages deployment

- **GitHub Pages documentation:** <https://docs.github.com/en/pages>
- **Configure a publishing source:** <https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site>
- **GitHub Pages and Jekyll:** <https://docs.github.com/en/pages/setting-up-a-github-pages-site-with-jekyll>
- **GitHub Actions deployment:** <https://github.com/actions/deploy-pages>

## 6. License references

- **MIT license text:** <https://opensource.org/license/mit>
- **Apache License 2.0:** <https://www.apache.org/licenses/LICENSE-2.0>
- **GNU AGPL 3.0:** <https://www.gnu.org/licenses/agpl-3.0.html>
- **Choose a License:** <https://choosealicense.com/>

These links support engineering research, not legal advice. Preserve copyright notices, inspect transitive dependencies, and obtain qualified legal review when licensing affects a real product or organization.

## 7. Repeated decision references — intentionally not deduplicated

- Atomic: <https://github.com/kenforthewin/atomic>
- SilverBullet: <https://github.com/silverbulletmd/silverbullet>
- Nodum: <https://github.com/nodummd/nodum>
- Foam: <https://github.com/foambubble/foam>
- Logseq: <https://github.com/logseq/logseq>
- TriliumNext: <https://github.com/TriliumNext/Trilium>
- AFFiNE: <https://github.com/toeverything/AFFiNE>
- Obsidian graph: <https://obsidian.md/help/plugins/graph>
- Obsidian license: <https://obsidian.md/license>
- Atomic: <https://github.com/kenforthewin/atomic>
- SilverBullet: <https://github.com/silverbulletmd/silverbullet>
- Nodum: <https://github.com/nodummd/nodum>
