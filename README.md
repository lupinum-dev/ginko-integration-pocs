# Ginko standalone integration POCs

Two small packed-package consumers. The main deliverable is [FRICTION.md](FRICTION.md), including observed library failures and comparisons with the real CMS, Editor and Write integrations. No Nuxt app or service runs here.

## Run

Use Node 24 and pnpm 11.28.2. From the repository root:

```sh
pnpm install --frozen-lockfile
pnpm --filter cms-roundtrip build
pnpm --filter cms-roundtrip test
pnpm --filter cms-roundtrip roundtrip
pnpm --filter editor-render build
pnpm --filter editor-render test
pnpm exec playwright install chromium
pnpm --filter editor-render browser
```

You can also run `pnpm build` and `pnpm test` at the root, or `pnpm build` / `pnpm test` inside either POC. **The editor test command intentionally exits 1:** its bundle regression test records F10. CMS tests retain two explicitly explained skips for F03 and F04; the probe command executes those library calls and saves their actual results before Vitest runs.

For a local preview:

```sh
pnpm --filter editor-render dev
# http://127.0.0.1:5173
```

The browser test starts and stops its own production preview at `http://127.0.0.1:4173`. No deployment, CMS backend, account, or credential is needed.

## What each POC proves

`cms-roundtrip/` contains 10 Markdown pages, two JSON species records with references, one real PNG with a SHA-256 asset identity, and `content.config.ts`. It builds a resolved contract, seeds the artifact, assesses and exports with the public filesystem portability API, reads and validates every document, changes a title/component prop/reference, adds a page and deletes a page, writes a portable directory, writes edited files back into a copied filesystem site, then exports and reads that site again. It checks semantic-model equality and byte identity for all 10 untouched source files **and** portable documents. Contract/content hashes use Ginko's canonical helpers.

`nuxt.config.ts` is an input file required by that filesystem API, not a Nuxt application. The inverse filesystem mapping deliberately supports these flat fixtures only; it is not a general migration tool. All generated trees live under ignored `evidence/`.

`editor-render/` edits headings, lists and component props and inserts components through the public editing AST. Vitest checks projected bodies, frontmatter, comments and portable MDC equality for all 10 Markdown documents, plus codec preservation of the two body-free data documents. Node generates the stored AST before Vite bundles the Vue 3 app. The browser imports the public body renderer and validates the stored JSON through a public assertion. The data-source surface is exercised for its cache constructor and result envelope only; this is not a complete backend adapter or conformance certification.

Both projects import only the seven public Ginko subpaths in the brief. No deep imports, copied Ginko helpers, patches, or sibling-source resolution are used.

## Recorded result

- CMS build: strict TypeScript passes. Tests: **1 passed, 2 skipped with reasons**. 12 documents, 1 asset, 10 untouched files and portable documents byte-identical.
- Editor build: strict TypeScript and Vite pass. Tests: **12 passed, 1 failed**, solely the known bundle failure F10.
- Playwright: **1 passed**, desktop and 390px mobile; heading, props, named slot, list and loaded image checked; no browser errors or horizontal overflow.
- Client JS: **152,025 gzip bytes** (148.46 KiB), computed from the emitted JS using Node `gzipSync` defaults. Parser, Zod and YAML are present: **35 matching rendered modules**. FRICTION.md lists the largest modules. Vite prints 153.46 kB; this differs from the direct artifact measurement and is recorded without treating the methods as equivalent.

The tarball is committed under `vendor/` and pinned in the lockfile. SHA-256: `f4f02db3d90bd312519bdef3e94e43b247f928b8f75503c090b0dc7cc27a84c0`. `autoInstallPeers: false` prevents installing Nuxt to satisfy the package's mandatory peer. `pnpm peers check` therefore reports that missing peer; the standalone builds and runtime were verified despite it.

## Evidence

Logs and screenshots are intentionally not committed. Running the commands recreates the structured evidence:

- `evidence/known-failures.json`: title omission, default locale failure, unhelpful invalid-title error.
- `evidence/cms-roundtrip/result.json`: counts and canonical hashes; sibling directories contain before/edited/reimported portable trees and the returned filesystem site.
- `evidence/editor-input/`: independently exported input for the editor's data-document checks.
- `evidence/bundle.json`: emitted JS gzip sizes and every rendered module, sorted by bytes. Module bytes are bundler-reported pre-final-minification contributions, not per-module gzip estimates.
- `evidence/browser.json`, `evidence/renderer-desktop.png`, `evidence/renderer-mobile.png`: real browser output.

To save command logs, create `evidence/` first and redirect each command there. It is git-ignored; verify with `git check-ignore evidence/check.log`.
