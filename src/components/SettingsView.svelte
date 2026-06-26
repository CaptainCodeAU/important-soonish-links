<script lang="ts">
  import { settingsState, updateSettings } from "../store/settings.svelte";
  import { linksState } from "../store/links.svelte";
  import { pushToast } from "../store/toasts.svelte";
  import { COPY, fmt } from "../lib/copy";
  import { clearAll, writeLinks } from "../storage";
  import { sanitizeLinks } from "../lib/sanitize";
  import { serializeJson, serializeMarkdown, serializeHtml } from "../lib/export";
  import ConfirmDialog from "./ConfirmDialog.svelte";
  import type { SavedLink, SortOrder } from "../types";

  let { onBack }: { onBack: () => void } = $props();
  let showResetDialog = $state(false);
  let showReplaceDialog = $state(false);
  let pendingReplace = $state<{ items: SavedLink[]; invalidCount: number } | null>(null);

  // ── Export ────────────────────────────────────────────────
  function downloadBlob(content: string, filename: string, mime: string) {
    const blob = new Blob([content], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = filename; a.click();
    URL.revokeObjectURL(url);
    pushToast(COPY.EXPORT_DONE);
  }

  function exportJson() {
    downloadBlob(serializeJson(linksState.items), "important-soonish-links.json", "application/json");
  }

  function exportMarkdown() {
    downloadBlob(serializeMarkdown(linksState.items), "important-soonish-links.md", "text/markdown");
  }

  function exportHtml() {
    downloadBlob(serializeHtml(linksState.items), "important-soonish-links.html", "text/html");
  }

  // ── Import ────────────────────────────────────────────────
  // Write to storage FIRST, then swap in-memory state, so a failed write can't leave the
  // UI showing links that were never persisted. Shared by merge + replace. D1/N2.
  async function applyImport(items: SavedLink[], successToast: string): Promise<void> {
    try {
      await writeLinks(items);
      linksState.items = items;
      pushToast(successToast);
    } catch {
      pushToast(COPY.IMPORT_ERROR);
    }
  }

  async function handleImport(e: Event, mode: "merge" | "replace") {
    const input = e.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = ""; // reset so re-picking the same file fires onchange again
    if (!file) return;
    try {
      const text = await file.text();
      const parsed = JSON.parse(text);
      if (!Array.isArray(parsed)) throw new Error("Not an array");

      // sanitizeLinks coerces colors/tags and drops entries with invalid URLs.
      const valid = sanitizeLinks(parsed);
      if (valid.length === 0) throw new Error("No valid links");
      const invalidCount = parsed.length - valid.length;

      if (mode === "replace") {
        // Destructive — wipes existing links. Confirm before applying. D1.
        pendingReplace = { items: valid, invalidCount };
        showReplaceDialog = true;
        return;
      }

      const existing = new Set(linksState.items.map(l => l.url));
      const newOnes = valid.filter(l => !existing.has(l.url));
      const skipped = (valid.length - newOnes.length) + invalidCount;
      await applyImport(
        [...linksState.items, ...newOnes],
        skipped > 0 ? fmt(COPY.IMPORT_PARTIAL, { n: newOnes.length, m: skipped }) : COPY.IMPORT_SUCCESS,
      );
    } catch {
      pushToast(COPY.IMPORT_ERROR);
    }
  }

  async function confirmReplace(): Promise<void> {
    if (!pendingReplace) return;
    const { items, invalidCount } = pendingReplace;
    showReplaceDialog = false;
    pendingReplace = null;
    await applyImport(
      items,
      invalidCount > 0 ? fmt(COPY.IMPORT_PARTIAL, { n: items.length, m: invalidCount }) : COPY.IMPORT_REPLACE_SUCCESS,
    );
  }

  function cancelReplace(): void {
    showReplaceDialog = false;
    pendingReplace = null;
  }

  // ── Reset ─────────────────────────────────────────────────
  async function doReset() {
    await clearAll();
    linksState.items = [];
    showResetDialog = false;
    pushToast(COPY.RESET_DONE);
  }
</script>

<div class="settings">
  <header class="settings-header">
    <button class="back-btn" onclick={onBack} aria-label="Back to links">←</button>
    <span class="settings-title">Settings</span>
  </header>

  <div class="settings-body">
    <!-- Export -->
    <section class="section">
      <h2 class="section-label">{COPY.SETTINGS_EXPORT}</h2>
      <p class="section-desc">{COPY.SETTINGS_EXPORT_DESC}</p>
      <div class="btn-row">
        <button class="btn-outline" onclick={exportJson}>JSON</button>
        <button class="btn-outline" onclick={exportMarkdown}>Markdown</button>
        <button class="btn-outline" onclick={exportHtml}>HTML</button>
      </div>
    </section>

    <!-- Import -->
    <section class="section">
      <h2 class="section-label">{COPY.SETTINGS_IMPORT}</h2>
      <p class="section-desc">{COPY.SETTINGS_IMPORT_DESC}</p>
      <div class="btn-row">
        <label class="btn-outline">
          {COPY.IMPORT_MERGE}
          <input type="file" accept=".json" style="display:none" onchange={(e) => handleImport(e, "merge")} />
        </label>
        <label class="btn-outline btn-destructive-outline">
          {COPY.IMPORT_REPLACE}
          <input type="file" accept=".json" style="display:none" onchange={(e) => handleImport(e, "replace")} />
        </label>
      </div>
    </section>

    <!-- Appearance -->
    <section class="section">
      <h2 class="section-label">{COPY.SETTINGS_APPEARANCE}</h2>
      <div class="toggle-group">
        {#each (["light", "dark", "system"] as const) as t (t)}
          <button
            class="toggle-btn"
            class:active={settingsState.theme === t}
            onclick={() => updateSettings({ theme: t })}
          >{t.charAt(0).toUpperCase() + t.slice(1)}</button>
        {/each}
      </div>
    </section>

    <!-- Sort -->
    <section class="section">
      <h2 class="section-label">{COPY.SETTINGS_SORT}</h2>
      <select
        class="select"
        value={settingsState.sortOrder}
        aria-label={COPY.SETTINGS_SORT}
        onchange={(e) => updateSettings({ sortOrder: (e.target as HTMLSelectElement).value as SortOrder })}
      >
        <option value="recent">Recently added</option>
        <option value="oldest">Oldest first</option>
        <option value="alphabetical">Alphabetical</option>
        <option value="color">By color</option>
        <option value="tag">By tag</option>
      </select>
    </section>

    <!-- Sync -->
    <section class="section">
      <div class="row">
        <div>
          <h2 class="section-label">{COPY.SETTINGS_SYNC}</h2>
          <p class="section-desc">{COPY.SETTINGS_SYNC_DESC}</p>
        </div>
        <label class="switch">
          <input
            type="checkbox"
            checked={settingsState.syncEnabled}
            aria-label={COPY.SETTINGS_SYNC}
            onchange={(e) => updateSettings({ syncEnabled: (e.target as HTMLInputElement).checked })}
          />
          <span class="slider"></span>
        </label>
      </div>

      {#if settingsState.syncEnabled}
        <div class="sync-mode">
          <h3 class="sync-mode-label">{COPY.SETTINGS_SYNC_MODE}</h3>
          <div class="toggle-group">
            {#each (["links-only", "everything"] as const) as m (m)}
              <button
                class="toggle-btn"
                class:active={settingsState.syncMode === m}
                onclick={() => updateSettings({ syncMode: m })}
              >{m === "links-only" ? COPY.SYNC_MODE_LINKS : COPY.SYNC_MODE_EVERYTHING}</button>
            {/each}
          </div>
          <p class="section-desc">
            {settingsState.syncMode === "links-only" ? COPY.SYNC_MODE_LINKS_DESC : COPY.SYNC_MODE_EVERYTHING_DESC}
          </p>
        </div>
      {/if}
    </section>

    <!-- Badge count -->
    <section class="section">
      <div class="row">
        <h2 class="section-label">{COPY.SETTINGS_BADGE}</h2>
        <label class="switch">
          <input
            type="checkbox"
            checked={settingsState.showBadgeCount}
            aria-label={COPY.SETTINGS_BADGE}
            onchange={(e) => updateSettings({ showBadgeCount: (e.target as HTMLInputElement).checked })}
          />
          <span class="slider"></span>
        </label>
      </div>
    </section>

    <!-- Reset -->
    <section class="section">
      <h2 class="section-label">{COPY.SETTINGS_RESET}</h2>
      <button class="btn-danger" onclick={() => (showResetDialog = true)}>{COPY.SETTINGS_RESET_BTN}</button>
    </section>

    <!-- About -->
    <section class="section">
      <h2 class="section-label">{COPY.SETTINGS_ABOUT}</h2>
      <p class="section-desc">{COPY.ABOUT_TAGLINE}</p>
    </section>
  </div>
</div>

{#if showResetDialog}
  <ConfirmDialog
    title={COPY.RESET_CONFIRM_TITLE}
    body={COPY.RESET_CONFIRM_BODY}
    cancelLabel={COPY.RESET_CANCEL}
    confirmLabel={COPY.RESET_ACTION}
    onCancel={() => (showResetDialog = false)}
    onConfirm={doReset}
  />
{/if}

{#if showReplaceDialog && pendingReplace}
  <ConfirmDialog
    title={COPY.IMPORT_REPLACE_CONFIRM_TITLE}
    body={fmt(COPY.IMPORT_REPLACE_CONFIRM_BODY, { n: pendingReplace.items.length, m: linksState.items.length })}
    cancelLabel={COPY.RESET_CANCEL}
    confirmLabel={COPY.IMPORT_REPLACE}
    onCancel={cancelReplace}
    onConfirm={confirmReplace}
  />
{/if}

<style>
  .settings { display: flex; flex-direction: column; height: 580px; }
  .settings-header {
    display: flex; align-items: center; gap: 8px;
    padding: 8px 12px; border-bottom: 1px solid var(--color-border); flex-shrink: 0;
  }
  .back-btn {
    width: 28px; height: 28px; font-size: 16px; color: var(--color-text-secondary);
    border-radius: var(--radius-sm);
    background: transparent; border: none; cursor: pointer;
  }
  .back-btn:hover { background: var(--color-surface-overlay); }
  .back-btn:focus-visible { outline: 2px solid var(--color-border-focus); outline-offset: 2px; }
  .settings-title { font-size: 13px; font-weight: 500; color: var(--color-text-primary); }
  .settings-body { flex: 1; overflow-y: auto; padding: 8px 0; }
  .section { padding: 10px 16px; border-bottom: 1px solid var(--color-border); }
  .section:last-child { border-bottom: none; }
  .section-label { font-size: 13px; font-weight: 500; color: var(--color-text-primary); margin-bottom: 3px; }
  .section-desc { font-size: 11px; color: var(--color-text-muted); margin-bottom: 8px; line-height: 1.4; }
  .btn-row { display: flex; gap: 6px; flex-wrap: wrap; }
  .btn-outline {
    padding: 5px 10px; font-size: 12px; border-radius: var(--radius-sm);
    border: 1px solid var(--color-border); color: var(--color-text-secondary);
    background: var(--color-surface-raised); cursor: pointer;
    display: inline-flex; align-items: center;
  }
  .btn-outline:hover { border-color: var(--color-accent); color: var(--color-accent); }
  .btn-outline:focus-visible { outline: 2px solid var(--color-border-focus); outline-offset: 2px; }
  .btn-destructive-outline:hover { border-color: var(--color-destructive); color: var(--color-destructive); }
  .row { display: flex; align-items: flex-start; justify-content: space-between; gap: 12px; }
  .sync-mode { margin-top: 10px; }
  .sync-mode-label { font-size: 12px; font-weight: 500; color: var(--color-text-secondary); margin-bottom: 6px; }
  .toggle-group { display: flex; gap: 2px; }
  .toggle-btn {
    padding: 4px 10px; font-size: 12px; border-radius: var(--radius-sm);
    border: 1px solid var(--color-border); color: var(--color-text-secondary);
    background: var(--color-surface-raised); cursor: pointer;
  }
  .toggle-btn.active { background: var(--color-accent); color: #fff; border-color: var(--color-accent); }
  .toggle-btn:focus-visible { outline: 2px solid var(--color-border-focus); outline-offset: 2px; }
  .select {
    width: 100%; padding: 5px 8px; font-size: 12px;
    border: 1px solid var(--color-border); border-radius: var(--radius-sm);
    background: var(--color-surface-raised); color: var(--color-text-primary);
    font-family: var(--font-ui);
  }
  .select:focus-visible { outline: 2px solid var(--color-border-focus); outline-offset: 2px; }
  .switch { position: relative; display: inline-block; width: 36px; height: 20px; flex-shrink: 0; }
  .switch input { opacity: 0; width: 0; height: 0; }
  .slider {
    position: absolute; inset: 0; background: var(--color-border);
    border-radius: var(--radius-full); transition: background var(--duration-fast);
    cursor: pointer;
  }
  .slider::before {
    content: ""; position: absolute;
    width: 14px; height: 14px;
    left: 3px; top: 3px;
    background: #fff; border-radius: var(--radius-full);
    transition: transform var(--duration-fast);
  }
  .switch input:checked + .slider { background: var(--color-accent); }
  .switch input:checked + .slider::before { transform: translateX(16px); }
  .switch input:focus-visible + .slider { outline: 2px solid var(--color-border-focus); outline-offset: 2px; }
  .btn-danger {
    padding: 5px 12px; font-size: 12px; border-radius: var(--radius-sm);
    color: var(--color-destructive); border: 2px solid var(--color-destructive);
    background: transparent; font-weight: 500; cursor: pointer;
  }
  .btn-danger:hover { background: var(--color-destructive); color: #fff; }
  .btn-danger:focus-visible { outline: 2px solid var(--color-border-focus); outline-offset: 2px; }
</style>
