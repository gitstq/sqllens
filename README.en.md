<div align="center">

# 🔭 SQLens

**Zero-dependency · Offline · Browser-based SQL Formatter & Visualizer**

SQL Formatting · Syntax Highlighting · Structure Analysis · Multi-dialect · Templates

[![GitHub release](https://img.shields.io/github/v/release/gitstq/sqllens?style=flat-square&color=5eead4)](https://github.com/gitstq/sqllens/releases)
[![CI](https://img.shields.io/github/actions/workflow/status/gitstq/sqllens/ci.yml?branch=main&style=flat-square&label=CI)](https://github.com/gitstq/sqllens/actions)
[![License](https://img.shields.io/github/license/gitstq/sqllens?style=flat-square&color=0d9488)](https://github.com/gitstq/sqllens/blob/main/LICENSE)
[![Zero deps](https://img.shields.io/badge/dependencies-0-brightgreen?style=flat-square)](https://github.com/gitstq/sqllens)
[![Offline](https://img.shields.io/badge/works-offline-blueviolet?style=flat-square)](https://github.com/gitstq/sqllens)

**English** | [简体中文](README.md) | [繁體中文](README.zh-TW.md) | [English](README.en.md)

<img src="assets/logo.svg" width="120" alt="SQLens logo" />

</div>

---

## 🎉 Introduction

SQLens is a **zero-dependency, fully offline** browser-based SQL toolkit that solves the pain points of poor SQL readability, hard-to-analyze structure, and high debugging cost.

- Turns messy single-line SQL into **clean, indented, readable** multi-line statements
- **Real-time syntax highlighting** (keywords / strings / numbers / comments / functions / params)
- One-click **structure analysis**: extracts tables, JOINs, query clauses, functions and parameters
- Built-in **10 useful templates** (JOIN, aggregation, subquery, window functions, CTE, etc.)
- **Multi-dialect** support (Generic / MySQL / PostgreSQL / SQLite / SQL Server)
- Pure HTML/CSS/JS, **zero third-party dependencies**, opens instantly and is inherently safe (data never leaves your browser)

> Unlike online tools, SQLens needs no backend — your SQL always stays local. Perfect for intranet / offline environments and privacy-sensitive scenarios.

---

## ✨ Features

| Feature | Description |
| --- | --- |
| 🧹 **Smart formatting** | Auto indent, clause breaks, comma alignment, operator spacing |
| 🎨 **Syntax highlighting** | Custom lexer with real-time coloring, quoted identifiers & params |
| 🧬 **Structure analysis** | Auto-extracts tables, JOINs, WHERE / GROUP BY / ORDER BY, etc. |
| 🔤 **Case normalization** | Keywords to UPPER / lower / preserve |
| 🗂️ **Comma-first** | comma-first style for teams with specific conventions |
| 📦 **Minify mode** | Compress SQL to a single line for logs and transfer |
| 🌍 **Multi-dialect** | Generic / MySQL / PostgreSQL / SQLite / SQL Server |
| 📚 **Template library** | 10 common SQL examples for quick start |
| 🌗 **Theme switching** | Dark / light themes, preference remembered |
| 🔒 **Zero-dependency & zero-upload** | No backend, no CDN, no tracking — data stays in your browser |

---

## 🚀 Quick Start

### Option 1: Open directly (recommended)

After cloning or downloading, serve the folder with any static server and open `index.html`:

```bash
# Way A: Python built-in server (no dependencies)
python3 -m http.server 8080
# Visit http://localhost:8080

# Way B: Node
npx serve -l 8080 .
# Visit http://localhost:8080
```

> You can also drag `index.html` into a browser (`file://` protocol) — all assets are local relative paths.

### Option 2: Use the online version

Visit the latest GitHub Pages / Release version (once published).

---

## 📖 Detailed Usage

### 1. Basic formatting

Paste SQL into the left input (or pick an example from the template dropdown), click **✦ Format** (or press `Ctrl + Enter`), and the result appears on the right instantly.

### 2. Syntax highlighting

The output is highlighted in real time by default; toggle with the "Highlight" checkbox.

### 3. Structure analysis

The bottom panel auto-shows statement type, tables, joins, query clauses, functions and params.

### 4. Minify

Click **Minify** to compress SQL into a single line (comments and strings preserved).

### 5. Configuration

| Control | Purpose |
| --- | --- |
| SQL dialect | Affects keyword recognition & syntax rules |
| Highlight | Toggle syntax highlighting |
| Comma-first | comma-first layout |
| Case | UPPER / lower / preserve keywords |
| Theme ◐ | Dark / light toggle (remembered) |
| Copy | Copy output to clipboard |

---

## 💡 Design & Roadmap

### Design principles

1. **Zero-dependency first**: lexer / formatter / parser all hand-written; no third-party libs — small, fast, auditable.
2. **Layered architecture**: `Tokenizer → Formatter / Parser`, decoupled; the lexer unifies dialects while formatting and analysis share one token stream.
3. **Offline & private**: pure front-end, no backend API, no external CDN, no tracking — SQL never leaves the browser.
4. **Restrained UX**: dark-first, single accent color, focus on input/output, no distracting chrome.

### Roadmap

- [x] v1.0: Format / highlight / minify / structure analysis / templates / themes
- [ ] v1.1: Semantic validation (unclosed parens, unknown column hints)
- [ ] v1.2: Export formatted result to file, customizable shortcuts
- [ ] v1.3: Bun / Deno one-shot scripts, CLI version
- [ ] v1.4: Integration with common ORM / database clients

---

## 📦 Packaging & Deployment

This is a **pure static zero-dependency** app — no build step needed.

- **GitHub Pages**: push to GitHub, select the deploy branch in Settings → Pages.
- **Any static server**: Nginx / Caddy / Vercel / Netlify / intranet server; use the whole folder as site root.
- **Offline distribution**: download `sqllens-vX.X.X.zip` from Releases and open `index.html` directly.

### Compatibility

- Browsers: modern Chrome / Edge / Firefox / Safari
- Node (tests only): `>= 14`
- No npm install required (`npm install` can be skipped; only CI tests need it)

---

## 🤝 Contributing

Contributions of any kind are welcome: issues, PRs, docs, templates.

1. Fork and branch: `git checkout -b feature/xxx`
2. Modify code and update tests (`test/engine.test.js`)
3. Run `npm test` — make sure everything passes
4. Open a PR describing your change

### Conventions

- Keep the **zero-dependency** principle; no new runtime third-party libs
- Conventional Commits (`feat:` / `fix:` / `docs:` / `refactor:` …)
- New templates: update both `js/templates.js` and the dropdown in `index.html`

---

## 📄 License

Licensed under the **MIT License** — free to use, modify and distribute (including commercially). See [LICENSE](LICENSE).

---

<div align="center">

**Made with ❤️ by SQLens Contributors**

</div>
