# Integration friction — beta.10 / a3e8ef1

Observed against the committed tarball on Node 24.21.0, pnpm 11.28.2, TypeScript 5.9.3, Vue 3.5.43 and Vite 8.3.2. The goal is to record what a standalone consumer must know, not to infer general release readiness from these fixtures.

14 items: **cast 2** (5 locations, 9 `as` operators), **undocumented export 0**, **deep import 0**, **copied helper 0**, **unclear error 2**, **glue 2**, and **type/documentation gaps 8**. Counts use each item's primary category. F12 is our own evidence-tool boundary, not a Ginko defect. No workaround is hidden. F03 and F04 have named skipped regressions and executed probes; F10 has a genuinely failing test.

Consulted docs are Ginko Content's `docs/content/docs/6.migration/5.filesystem-to-cms.md`, `4.guides/13.data-source-adapters.md`, `5.reference/11.package-exports.md`, and the packed declarations. Below, declaration/source paths are relative to the installed Content package. Missing guidance means absent from those consulted documents/types; it does not claim that no other document exists.

Comparisons use **ginko-cms at `codex/cms-overnight-integration`**, read with `git show` (its working checkout was on main), and the existing Editor and Write checkouts. No reference repository was edited. CMS file refs below are relative to that branch's `packages/cms/src/`; Editor refs are relative to `src/`.

## The ten worst items, in review order

### F10 — Renderer retains parser, Zod and YAML (type/documentation gap; library failure)

**POC:** `editor-render/src/main.ts:2`, `editor-render/vite.config.ts:10`, `editor-render/bundle.test.ts:4`.

**Expected:** a renderer for an already stored AST has no parser/Zod/YAML client code, as required by the brief. **Actual:** the production JS contains 35 matching rendered modules and is 152,025 gzip bytes. The failing bundle test is retained. No alias, deep import, package patch, or side-effect override hides the result.

**Missing:** an effective renderer-only package dependency boundary, plus bundle evidence for `body-renderer` in `5.reference/11.package-exports.md`. The packed `dist/runtime/app/components/internal/MarkdownRenderer.js:5` imports the broad `cms-contract/index.js`, which also reexports schema/wire and parsing modules. Retained initialization through this barrel is the likely cause; the observed module list is stronger evidence than a general usability conclusion.

**Real products:** Editor uses that same broad entry point for actual parsing (`lib/markdown.ts:1`), where parser code is expected. Write parses recipes at its authoring boundary (`web/test-ginko/real-editor.test.ts:11`). Neither comparison establishes that a standalone render-only bundle is clean.

### F03 — Required data `title` disappears (type/documentation gap; library failure)

**POC:** `cms-roundtrip/scripts/probe-known-failures.ts:10`, `cms-roundtrip/roundtrip.test.ts:11`, `cms-roundtrip/content.config.ts:17`.

**Expected:** a required schema `title` survives in a data collection's resolved fields and portable document. **Actual:** the probe returns `fields: []`. The initial filesystem assessment also exported species records with empty fields. The main fixtures explicitly use `name` to let the rest of the experiment run. The original required-title expectation remains in a skipped regression with a fix/removal condition in its name.

**Missing:** preservation of data schema fields in `dist/cms-contract/build.js` (`fieldsFromSchema` filters title/description/body/bodyMdc regardless of collection kind), or an explicit documented restriction and rejection rather than omission. `BuildResolvedContentContractInput` and `defineCollection` accept the schema.

**Real products:** CMS reads the already generated contract (`module/content-contract.ts:37`) and maps its fields; this path cannot recover a field omitted upstream. No fix for this omission was found in the inspected integration.

### F04 — Unlocalized default configuration cannot export (unclear error; library failure)

**POC:** `cms-roundtrip/nuxt.config.ts:4`, `cms-roundtrip/scripts/probe-known-failures.ts:17`, `cms-roundtrip/roundtrip.test.ts:18`.

**Expected:** `content.i18n: false` works for an entirely unlocalized site. **Actual:** assessment returns `CONTRACT_INVALID`, “The default locale must be declared in locales.” Its resolution says to regenerate the contract, even after this POC just generated a valid `en` contract. Explicit `{ defaultLocale: 'en', locales: ['en'] }` is required here. The unchanged default-config expectation has a named skipped regression; the probe reproduces it every test run.

**Missing:** agreement between locale resolution and contract construction, and a diagnostic that identifies the configuration option rather than suggesting repeated regeneration. The filesystem-export declaration supplies only `rootDir`, so this is not discoverable there.

**Real products:** CMS reads Nuxt's prepared artifact (`module/content-contract.ts:37`); it does not independently rebuild the filesystem exporter's locale options. This standalone rebuild exposed a separate mismatch.

### F02 — Public contract reader has no writer (type/documentation gap)

**POC:** `cms-roundtrip/contract.ts:12`.

**Expected:** a framework-free consumer can create the contract artifact through the same public Node boundary that reads it. **Actual:** the POC uses `mkdir`, `writeFile`, canonical bytes and the documented artifact pathname, then verifies it through `readResolvedContentContract`.

**Missing:** a public artifact writer or a standalone creation recipe. `dist/cms-contract-node/artifact.d.ts` declares `writeResolvedContentContractArtifact`, but `dist/cms-contract-node/index.d.ts` does not export it. We did not import it privately or copy its implementation. The data-source guide tells consumers to run `nuxt prepare`.

**Real products:** CMS's `module/content-contract.ts:37` reads the artifact Nuxt prepares. That is suitable for its Nuxt module, but supplies no standalone setup operation.

### F06 — Portable-to-filesystem return path is adapter-owned (glue)

**POC:** `cms-roundtrip/filesystem.ts:7`, `cms-roundtrip/filesystem.ts:21`, `cms-roundtrip/roundtrip.ts:59`.

**Expected:** a small inverse of filesystem export, with stable authored source mapping and references. **Actual:** roughly 25 executable lines convert portable reference objects to filesystem identity strings, merge fields, choose fixture filenames, parse/serialize frontmatter, and write files. Untouched documents are copied and never serialized; tests verify both source and portable byte identity. The mapping is intentionally flat and fixture-specific.

**Missing:** a public inverse filesystem codec/export operation and source-path provenance, or a documented minimal inverse example. `portableDocumentPath` describes portable directory paths, not original filesystem paths. Image-field inverses, translations and trees are not claimed by this helper.

**Real products:** CMS `portability/commands.ts:78` writes portable directories; `portability/directory.ts:12` reads them. Its backend import plan is a different destination and does not provide this filesystem inverse. This helper was written here, not copied from CMS.

### F05 — Canonical hash types require assertions (cast)

**POC:** `cms-roundtrip/contract.ts:15`, `cms-roundtrip/roundtrip.ts:81`, `cms-roundtrip/roundtrip.ts:82`, `cms-roundtrip/roundtrip.ts:83`.

**Expected:** the library's own resolved contract and normalized portable model types can be passed to its canonical hash/byte helpers. **Actual:** four sites require `as unknown as JsonValue`. They do not skip runtime canonical JSON checks; the helpers still reject invalid values.

**Missing:** assignability between exported model interfaces and `JsonValue`, or supported typed overloads in `dist/cms-contract/hash.d.ts`. We kept the assertions local instead of inventing a wrapper/helper or doing an extra JSON serialization.

**Real products:** CMS has the same assertion at `cli/deploy.ts:57`, `module.ts:214` and `portability/commands.ts:123`. The friction is shared, not POC-specific.

### F08 — Invalid document errors omit the field (unclear error)

**POC:** `cms-roundtrip/scripts/probe-known-failures.ts:23`.

**Expected:** changing a required text title to a number produces a usable field error. **Actual:** `validatePortableDocument` throws `{ code: 'DOCUMENT_INVALID', message: 'Portable document is invalid.', details: {} }`. The probe stores that actual result, rather than rewriting the error into a more informative result.

**Missing:** field path, expected type, or structured validation issues from `dist/portability/documents.d.ts` / `dist/portability/errors.d.ts`. The filesystem guide promises file/field diagnostics when available; this primitive provides nothing useful for a CMS editor to display.

**Real products:** CMS `portability/plan.ts` validates incoming portable documents before planning. The public codec's generic error constrains both integrations; no field-detail restoration is asserted here.

### F09 — New AST node semantics need parser metadata (type/documentation gap)

**POC:** `editor-render/edit.ts:21`, `editor-render/edit.ts:25`.

**Expected:** constructing a typed component tuple and renaming a heading is enough for exact projected-body preservation. **Actual:** the first run failed all 10 edited-body comparisons: the inserted paragraph wrapper was flattened, component `$` metadata appeared on reparse, and the heading acquired a generated id. The final code uses public `slugifyHeading` and parses a tiny insertion template to get the canonical component shape. All 10 edited-body comparisons then pass.

**Missing:** an insertion/editing recipe describing required parser-origin metadata, component child normalization, and heading ids. `MdcElementProps` is `Record<string, unknown>`; its `$` comment is not a typed construction contract. The serializer's declaration promises preservation of the projected body, but does not define the valid hand-built subset.

**Real products:** Editor adapts the canonical parse tree (`lib/markdown.ts:31`), handles generated heading ids (`lib/markdown.ts:49`), and builds Comark tuples (`lib/markdown.ts:131`). It has substantial conversion logic for its editor model. Write delegates to the Editor and authoring kit (`web/src/integration/kit.ts:4`). We did not copy those converters.

### F07 — Model semantic equality still compares body source (type/documentation gap)

**POC:** `cms-roundtrip/roundtrip.ts:42`, `cms-roundtrip/roundtrip.ts:57`.

**Expected:** the “semantic equality” helper ignores harmless body trailing newlines. **Actual:** the first comparison after saving returned false because portable serialization removes trailing newlines, while `normalizePortableModel` only sorts documents/assets and keeps body source. The POC now explicitly applies the public `normalizePortableMdcSource` before defining the expected edited model. No AST content is erased to force equality.

**Missing:** a clear distinction between semantic-model equality and `portableMdcSemanticallyEqual` in the supplied portability guide/declarations. `dist/portability/semantic-equality.d.ts` has signatures but no explanation of body semantics. Exact expected-model equality and separate projected-body/MDC semantic checks both remain.

**Real products:** CMS `portability/commands.ts:123` hashes canonical serialized models, so source bytes remain relevant there too. Editor's `lib/markdown.ts:66` serializes and normalizes an ending newline for its source contract, a different boundary.

### F01 — Filesystem export still requires a Nuxt-named file (type/documentation gap)

**POC:** `cms-roundtrip/nuxt.config.ts:1`, `cms-roundtrip/roundtrip.ts:17`.

**Expected:** the standalone Node portability surface can assess `content.config.ts` with explicit resolved options. **Actual:** `loadProjectConfig` requires both a content config and a Nuxt config. We supply a plain exported object in `nuxt.config.ts` and run no Nuxt process. Dependency installation also reports the mandatory missing Nuxt peer; `autoInstallPeers: false` avoids bringing Nuxt into these POCs.

**Missing:** a standalone config/options overload, or an explicit standalone recipe. The filesystem migration guide accurately mentions the two files, but the public API's framework-free usage story stops short of explaining this coupling. The peer requirement remains package-wide rather than tied to its Nuxt entry point.

**Real products:** CMS `module/content-contract.ts:37` lives inside an actual Nuxt integration. Editor directly imports the framework-free parse/serialize subpath (`lib/markdown.ts:1`), and Write composes public authoring exports without a Nuxt app (`web/src/integration/kit.ts:1`).

## Other encountered friction

### F11 — Finding an element needs a handwritten AST walker (glue)

**POC:** `editor-render/edit.ts:3`.

**Expected:** a documented basic “find and change component prop” operation. **Actual:** a 10-line recursive tuple walker collects elements and skips comments, followed by three searches. Tuple destructuring and discriminants do narrow correctly, so no cast was needed.

**Missing:** a small traversal/edit example in the consulted package-exports/data-source docs; no visitor helper is exported by `dist/cms-contract/index.d.ts`. This does not imply that a generic mutation framework is needed.

**Real products:** Editor's `lib/markdown.ts:77` and `lib/markdown.ts:119` each traverse a conversion tree. They cannot be used directly without Editor's separate model. Our walker is original fixture glue.

### F12 — Bundle-report JSON needs its own type assertion (cast; local tooling)

**POC:** `editor-render/audit.ts:5`.

**Expected:** preserve the build hook's type when reading its report. **Actual:** one `as` assertion bridges `JSON.parse` into the known tool-owned report shape. This is not a Content API problem and is isolated outside application code. The browser JSON instead uses `unknown` plus `assertPublicMarkdownAst`, with no cast.

**Missing:** no Ginko declaration; this gap is our evidence file's untyped JSON boundary. A separate runtime report schema would add machinery without helping this small experiment.

**Real products:** CMS similarly bridges untyped operational JSON at `portability/commands.ts:105`; Editor asserts filtered parser property values at `lib/markdown.ts:113`. These comparisons do not justify casts in arbitrary application data.

### F13 — Portable directory writer requires an existing parent (type/documentation gap)

**POC:** `cms-roundtrip/roundtrip.ts:15`.

**Expected:** the directory I/O example states which ancestor directories must exist. **Actual:** package inspection showed the writer immediately uses `mkdtemp` in the destination's parent. The POC creates that parent explicitly so it also runs in a fresh clone with no `evidence/` directory. The migration example happens to use a preexisting `.ginko/` parent.

**Missing:** this precondition in `dist/portability-node/write-directory.d.ts` and the programmatic export example. No private writer is imported or replaced.

**Real products:** CMS `portability/commands.ts:78` calls the same directory writer; the destination's parent is an operational responsibility there too.

### F14 — Filesystem relation string grammar needs an example (type/documentation gap)

**POC:** `cms-roundtrip/content/pages/welcome.md:3`, `cms-roundtrip/content/species/oak.json:3`, `cms-roundtrip/filesystem.ts:10`.

**Expected:** the relation field's string type tells a consumer how to author its identity. **Actual:** the initial guessed `$species:oak` value was rejected as an unresolved reference on all 10 pages. Explicit `/species/oak` succeeds and exports `{ collection: 'species', canonicalKey: '/species/oak' }`. The inverse writes that canonical identity back as a string. This was an authoring guess, not proof of a broken reference resolver.

**Missing:** a filesystem-reference field example that distinguishes field identities from the `$...` link syntax described for MDC. `fields.relation()` in `dist/types/fields.d.ts` exposes a string schema without explaining its grammar in the consulted guides.

**Real products:** CMS `portability/plan.ts:143` consumes the already normalized portable reference objects and checks their dependencies. It does not need to guess the authored filesystem string. Editor's Markdown adapter handles body syntax rather than this schema-field conversion.

## What was pleasant

- Installed the exact packed bytes without workspace links or source fallbacks; all three consumers resolve one physical Content package.
- Public config field builders carry relation metadata through to the resolved contract. Explicit filesystem identity references (`/species/oak`) become typed portable reference objects and survive the return trip.
- Filesystem assessment caught an initially malformed PNG checksum. Replaced our invalid fixture with a valid 1×1 PNG; exported asset SHA-256 verification and browser decoding both pass. This was a fixture error, not a library failure.
- `expectedInputHash`, atomic directory writing, manifest rebuilding and reading are usable with very little call-site code. Counts are 12 documents and one asset throughout the main round trip.
- Editing parsed documents preserves frontmatter, comments, component props and named slots on all 10 Markdown fixtures. Code-fenced component-looking text stays literal. Portable MDC equality gives a separate semantic check.
- Public AST assertion narrows `unknown` correctly, avoiding an application cast. The Vue renderer accepts explicit components and policy and renders in plain Vite with no Nuxt runtime setup.
- Data-source cache construction and its result envelope work without a service. Only this narrow surface was exercised; no adapter certification is claimed.

## Bundle evidence and limits

Direct emitted-file gzip is **152,025 bytes / 148.46 KiB**. Vite prints **153.46 kB**, which differs from Node's gzip result. Its compressor/report implementation may differ; the exact reason was not verified. Both numbers are retained, and the report uses the explicitly specified Node method. JS bytes were the same under that method before/after the final fixture/reference and CSS changes. CSS bytes are excluded.

Top rendered modules (bundler-reported contribution before final minification):

| Module | Bytes |
| --- | ---: |
| `markdown-exit/dist/index.js` | 94,980 |
| `@vue/runtime-core/dist/runtime-core.esm-bundler.js` | 94,050 |
| `js-yaml/dist/js-yaml.mjs` | 90,510 |
| `zod/v4/core/schemas.js` | 42,654 |
| `@vue/reactivity/dist/reactivity.esm-bundler.js` | 36,044 |
| `entities/dist/esm/generated/decode-data-html.js` | 32,376 |
| `htmlparser2/dist/Tokenizer.js` | 25,395 |
| `zod/v4/classic/schemas.js` | 25,307 |
| `@lupinum/ginko-content/dist/core/markdown/angle-components.js` | 24,706 |
| `comark/dist/internal/parse/token-processor.js` | 21,482 |

`evidence/bundle.json` contains every contributing module and the 35 matches, including `comark/dist/parse.js`, `parse-comark.js`, Zod and js-yaml. A module absent from this list is not counted just because Vite visited it: zero-length rendered modules are excluded.

The browser check uses production output, confirms desktop/mobile rendering and loaded managed image, and captures screenshots. No production service, Nuxt runtime provider, custom transformer, localized tree, rich image schema field, or full backend adapter was tested. These small fixtures do not establish operational or general API readiness.
