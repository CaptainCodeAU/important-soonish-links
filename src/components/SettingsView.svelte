<script lang="ts">
  import { settingsState, updateSettings } from "../store/settings.svelte";
  import { linksState } from "../store/links.svelte";
  import { pushToast } from "../store/toasts.svelte";
  import { COPY, fmt } from "../lib/copy";
  import { clearAll, writeLinks } from "../storage";
  import ConfirmDialog from "./ConfirmDialog.svelte";
  import type { SavedLink, SortOrder } from "../types";

  let { onBack }: { onBack: () => void } = $props();
  let showResetDialog = $state(false);

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
    downloadBlob(JSON.stringify(linksState.items, null, 2), "important-soonish-links.json", "application/json");
  }

  function exportMarkdown() {
    const lines: string[] = [];
    const byTag = new Map<string, SavedLink[]>();
    for (const l of linksState.items) {
      const key = l.tag ?? "other";
      if (!byTag.has(key)) byTag.set(key, []);
      byTag.get(key)!.push(l);
    }
    for (const [tag, links] of byTag) {
      lines.push(`\n## ${tag}`);
      for (const l of links) lines.push(`- [${l.title}](${l.url})`);
    }
    downloadBlob(lines.join("\n"), "important-soonish-links.md", "text/markdown");
  }

  function exportHtml() {
    const items = linksState.items.map(l =>
      `    <DT><A HREF="${l.url}">${l.title}</A>`
    ).join("\n");
    const html = `<!DOCTYPE NETSCAPE-Bookmark-file-1>\n<META HTTP-EQUIV="Content-Type" CONTENT="text/html; charset=UTF-8">\n<TITLE>Bookmarks</TITLE>\n<H1>Bookmarks</H1>\n<DL><p>\n${items}\n</DL><p>`;
    downloadBlob(html, "important-soonish-links.html", "text/html");
  }

  // ── Import ────────────────────────────────────────────────
  async function handleImport(e: Event, mode: "merge" | "replace") {
    const file = (e.target as HTMLInputElement).files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      const parsed = JSON.parse(text) as SavedLink[];
      if (!Array.isArray(parsed)) throw new Error("Not an array");

      const valid = parsed.filter(l => l.id && l.url && l.title);
      if (valid.length === 0) throw new Error("No valid links");

      let items: SavedLink[];
      if (mode === "replace") {
        items = valid;
        pushToast(COPY.IMPORT_REPLACE_SUCCESS);
      } else {
        const existing = new Set(linksState.items.map(l => l.url));
        const newOnes = valid.filter(l => !existing.has(l.url));
        items = [...linksState.items, ...newOnes];
        const skipped = valid.length - newOnes.length;
        if (skipped > 0) {
          pushToast(fmt(COPY.IMPORT_PARTIAL, { n: newOnes.length, m: skipped }));
        } else {
          pushToast(COPY.IMPORT_SUCCESS);
        }
      }
      linksState.items = items;
      await writeLinks(items);
    } catch {
      pushToast(COPY.IMPORT_ERROR);
    }
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
            onchange={(e) => updateSettings({ syncEnabled: (e.target as HTMLInputElement).checked })}
          />
          <span class="slider"></span>
        </label>
      </div>
    </section>

    <!-- Badge count -->
    <section class="section">
      <div class="row">
        <h2 class="section-label">{COPY.SETTINGS_BADGE}</h2>
        <label class="switch">
          <input
            type="checkbox"
            checked={settingsState.showBadgeCount}
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
