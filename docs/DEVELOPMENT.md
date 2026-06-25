# Development

## Build & test workflow

The extension is built by **plain Vite** into `dist/`, which you load unpacked in
Chrome. There is **no hot-reload** — the loop is **build → reload**.

| Task | Command |
|------|---------|
| One-off build | `pnpm build` (`svelte-check` + `vite build`) |
| Auto-rebuild on save | `pnpm exec vite build --watch` (skips `svelte-check`) |
| Tests | `pnpm test` (watch) / `pnpm exec vitest run` (once) |
| Type check | `pnpm typecheck` |

To test in Chrome:

1. `pnpm build`
2. `chrome://extensions` → Developer mode → **Load unpacked** → select `dist/`
3. After each rebuild, click the **reload ↻** icon on the extension card.

> `pnpm dev` is **not** used for this project — plain Vite's dev server cannot run
> as an extension. Use `vite build --watch` + reload instead.

The `key` field in `manifest.json` fixes the extension ID, so reloads never require
re-adding the extension.

## How the build works (no @crxjs)

This project deliberately does **not** use `@crxjs/vite-plugin` (see rationale below).
The MV3 build is hand-wired in `vite.config.ts`:

- `rollupOptions.input` declares two entries: the popup HTML (`src/popup/index.html`)
  and the background service worker (`src/background/index.ts`).
- `output.entryFileNames` emits the service worker at a **stable** path,
  `dist/background.js`; everything else is content-hashed under `dist/assets/`.
- A ~20-line inline plugin (`emitManifest`) emits `dist/manifest.json`, rewriting
  `background.service_worker` to `background.js`. The popup HTML keeps its source
  path (`src/popup/index.html`) and Chrome loads its hashed assets via absolute
  `/assets/...` URLs (resolved from the extension root).
- Static assets in `public/` (icons, fonts) are copied to `dist/` automatically.

The service worker is an ES module (`"type": "module"` in the manifest), so its
static `import` of the shared `assets/storage-*.js` chunk works at runtime.

## Dependency-pinning rationale (DO NOT bump blindly)

Local pnpm enforces two supply-chain gates:

1. **Trust-downgrade** (at `pnpm install`): blocks any version published with weaker
   provenance than an earlier one (a possible-takeover signal).
2. **Audit** (pre-push hook): blocks packages with known advisories.

Several versions are pinned/overridden to satisfy **both** gates at once. Changing
them without re-checking both gates will likely re-break the build or the push:

| Pin / override | Where | Why |
|----------------|-------|-----|
| `@crxjs/vite-plugin` **removed** | — | It pulled vulnerable `rollup@2.79.2` (audit HIGH). Its only fixes (`rollup@2.80.0`, `@crxjs ≥2.5.0`) fail the trust-downgrade gate — an unresolvable catch-22. Replaced with the plain-Vite build above. |
| `chokidar: ^5` | `pnpm-workspace.yaml` overrides | `4.0.3` is trust-blocked; v5 is trusted. |
| `@testing-library/svelte-core: 1.0.0` | `pnpm-workspace.yaml` overrides | `1.1.2` ships a legacy `export let` scaffold that fails under this project's global `runes: true`. |
| `@testing-library/svelte: 5.3.1` | `package.json` | Pinned to match the runes-compatible `svelte-core@1.0.0`; newer releases fail trust-downgrade. |
| `svelte: ^5.56.0`, `vite: ^8.0.16` | `package.json` | Moved **forward** to patched releases that fix disclosed XSS/ReDoS (svelte ≤5.55.6) and fs-deny/path-traversal (vite ≤8.0.15) advisories. |

Also note: `TagDropdown.svelte` uses `select(tag: TagId | undefined)` rather than the
optional-param form `select(tag?: TagId)` — the Svelte TS preprocess drops the type
annotation but keeps the `?`, emitting invalid JS the bundler rejects.

### Recovering a broken install

```sh
rm -rf node_modules pnpm-lock.yaml
pnpm install
```

Never use `npm`. Never bypass the trust-downgrade gate — pin to a trusted version
instead.
