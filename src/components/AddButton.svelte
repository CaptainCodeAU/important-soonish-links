<script lang="ts">
  import { addLink, linksState } from "../store/links.svelte";
  import { pushToast } from "../store/toasts.svelte";
  import { COPY } from "../lib/copy";
  import { generateId, validateUrl, hostnameFromUrl, now } from "../lib/utils";
  import type { SavedLink } from "../types";

  let showForm = $state(false);
  let formTitle = $state("");
  let formUrl = $state("");
  let urlError = $state("");

  async function saveCurrentTab() {
    let tabs: chrome.tabs.Tab[];
    try {
      tabs = await chrome.tabs.query({ active: true, currentWindow: true });
    } catch {
      pushToast(COPY.TAB_QUERY_FAILED);
      return;
    }
    const tab = tabs[0];
    if (!tab?.url) { pushToast(COPY.TAB_QUERY_FAILED); return; }
    if (!validateUrl(tab.url)) { pushToast(COPY.SAVE_INVALID_URL); return; }

    if (linksState.items.some(l => l.url === tab.url)) {
      pushToast(COPY.ALREADY_SAVED);
      return;
    }

    const link: SavedLink = {
      id: generateId(),
      title: tab.title ?? hostnameFromUrl(tab.url),
      url: tab.url,
      favicon: tab.favIconUrl,
      color: "default",
      order: 0,
      createdAt: now(),
      updatedAt: now(),
    };

    await addLink(link);
    pushToast(COPY.SAVED);
  }

  async function openForm() {
    showForm = true;
    try {
      const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
      const tab = tabs[0];
      formTitle = tab?.title ?? "";
      formUrl = tab?.url ?? "";
    } catch {
      /* leave blank */
    }
  }

  function validateForm(): boolean {
    if (!validateUrl(formUrl)) { urlError = COPY.ADD_URL_ERROR; return false; }
    urlError = "";
    return true;
  }

  async function submitForm() {
    if (!validateForm()) return;
    if (linksState.items.some(l => l.url === formUrl)) {
      pushToast(COPY.ALREADY_SAVED);
      showForm = false;
      formTitle = ""; formUrl = ""; urlError = "";
      return;
    }
    const link: SavedLink = {
      id: generateId(),
      title: formTitle || hostnameFromUrl(formUrl),
      url: formUrl,
      color: "default",
      order: 0,
      createdAt: now(),
      updatedAt: now(),
    };
    await addLink(link);
    pushToast(COPY.SAVED);
    showForm = false;
    formTitle = ""; formUrl = ""; urlError = "";
  }
</script>

<div class="add-wrap">
  <button class="add-btn" onclick={saveCurrentTab} aria-label="Save current tab">+</button>
  <button class="caret-btn" onclick={openForm} aria-label="Manual entry" aria-expanded={showForm}>▾</button>
</div>

{#if showForm}
  <div class="form-overlay">
    <div class="form">
      <input bind:value={formTitle} placeholder={COPY.ADD_TITLE_PLACEHOLDER} class="form-input" />
      <div class="field">
        <input
          bind:value={formUrl}
          placeholder={COPY.ADD_URL_PLACEHOLDER}
          class="form-input"
          class:error={!!urlError}
          onblur={validateForm}
        />
        {#if urlError}<span class="field-error">{urlError}</span>{/if}
      </div>
      <div class="form-actions">
        <button class="btn-secondary" onclick={() => (showForm = false)}>{COPY.ADD_CANCEL}</button>
        <button class="btn-primary" onclick={submitForm}>{COPY.ADD_SAVE}</button>
      </div>
    </div>
  </div>
{/if}

<style>
  .add-wrap { display: flex; align-items: center; gap: 2px; }
  .add-btn {
    width: 28px; height: 28px; font-size: 18px; line-height: 1;
    display: flex; align-items: center; justify-content: center;
    border-radius: var(--radius-sm); color: var(--color-accent);
    font-weight: 600;
    background: transparent; border: none; cursor: pointer;
  }
  .add-btn:hover, .caret-btn:hover { background: var(--color-surface-overlay); }
  .add-btn:focus-visible, .caret-btn:focus-visible { outline: 2px solid var(--color-border-focus); outline-offset: 2px; }
  .caret-btn {
    width: 16px; height: 28px; font-size: 10px;
    display: flex; align-items: center; justify-content: center;
    border-radius: var(--radius-sm); color: var(--color-text-muted);
    background: transparent; border: none; cursor: pointer;
  }
  .form-overlay {
    position: absolute; top: 44px; left: 0; right: 0; z-index: 100;
    background: var(--color-surface-base);
    border-bottom: 1px solid var(--color-border);
    padding: 8px 12px;
    box-shadow: var(--shadow-dropdown);
  }
  .form { display: flex; flex-direction: column; gap: 6px; }
  .form-input {
    width: 100%; padding: 6px 8px; font-size: 13px;
    border: 1px solid var(--color-border); border-radius: var(--radius-sm);
    background: var(--color-surface-raised); color: var(--color-text-primary);
    font-family: var(--font-ui);
  }
  .form-input:focus { outline: 2px solid var(--color-border-focus); outline-offset: 0; }
  .form-input.error { border-color: var(--color-destructive); }
  .field { display: flex; flex-direction: column; gap: 2px; }
  .field-error { font-size: 11px; color: var(--color-destructive); }
  .form-actions { display: flex; gap: 8px; justify-content: flex-end; }
  .btn-primary {
    padding: 5px 12px; font-size: 12px; border-radius: var(--radius-sm);
    background: var(--color-accent); color: var(--color-text-inverse); font-weight: 500;
    border: none; cursor: pointer;
  }
  .btn-secondary {
    padding: 5px 12px; font-size: 12px; border-radius: var(--radius-sm);
    background: var(--color-surface-raised); color: var(--color-text-secondary);
    border: 1px solid var(--color-border); cursor: pointer;
  }
  .btn-primary:focus-visible, .btn-secondary:focus-visible { outline: 2px solid var(--color-border-focus); outline-offset: 2px; }
</style>
