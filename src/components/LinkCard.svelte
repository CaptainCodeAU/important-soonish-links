<script lang="ts">
  import { updateLink, deleteLink, restoreLink, linksState } from "../store/links.svelte";
  import { pushToast } from "../store/toasts.svelte";
  import { COPY } from "../lib/copy";
  import { hostnameFromUrl } from "../lib/utils";
  import ColorPicker from "./ColorPicker.svelte";
  import TagDropdown from "./TagDropdown.svelte";
  import FaviconImage from "./FaviconImage.svelte";
  import type { SavedLink } from "../types";

  let { link }: { link: SavedLink } = $props();

  function openLink(e: MouseEvent) {
    const bg = e.metaKey || e.ctrlKey;
    chrome.tabs.create({ url: link.url, active: !bg });
  }

  function handleDelete() {
    const idx = linksState.items.findIndex(l => l.id === link.id);
    const snapshot: SavedLink = { ...link };
    deleteLink(link.id);
    pushToast(COPY.DELETED, {
      duration: 8000,
      action: {
        label: COPY.UNDO,
        onClick: () => restoreLink(snapshot, idx),
      },
    });
  }

  function handleKeydown(e: KeyboardEvent) {
    if (e.key === "Enter") {
      e.preventDefault();
      openLink(new MouseEvent("click"));
    }
    if (e.key === "Delete" || e.key === "Backspace") {
      e.preventDefault();
      handleDelete();
    }
  }
</script>

<!-- svelte-ignore a11y_no_noninteractive_tabindex -->
<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
<div
  class="card"
  class:read={link.isRead}
  style:--color-card-bg={`var(--color-${link.color}-bg)`}
  style:--color-card-accent={`var(--color-${link.color}-solid)`}
  tabindex="0"
  role="listitem"
  onkeydown={handleKeydown}
>
  <ColorPicker
    value={link.color}
    onChange={(c) => updateLink(link.id, { color: c })}
  />
  <TagDropdown
    values={link.tags}
    onToggle={(t) => updateLink(link.id, {
      tags: link.tags.includes(t) ? link.tags.filter(x => x !== t) : [...link.tags, t],
    })}
  />
  <FaviconImage src={link.favicon} hostname={hostnameFromUrl(link.url)} color={link.color} />
  <div class="content">
    <button class="title" onclick={openLink} tabindex="-1">
      {link.title}
    </button>
    <span class="hostname">{hostnameFromUrl(link.url)}</span>
  </div>
  <button
    class="read-toggle"
    onclick={() => updateLink(link.id, { isRead: !link.isRead })}
    aria-label={link.isRead ? "Mark as unread" : "Mark as read"}
    title={link.isRead ? "Mark as unread" : "Mark as read"}
  >✓</button>
  <button class="delete-btn" onclick={handleDelete} aria-label="Delete link" tabindex="-1">×</button>
</div>

<style>
  .card {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 10px 14px 10px 16px;
    border-radius: var(--radius-md);
    min-height: 60px;
    /* Hybrid: color-tinted wash background + a brighter 3px solid left bar in the same
       color. The bar is an inset box-shadow so it follows the rounded corners. */
    background: var(--color-card-bg, var(--color-surface-raised));
    border: 1px solid var(--color-border);
    box-shadow: inset 3px 0 0 0 var(--color-card-accent, var(--color-default-solid));
    transition:
      border-color var(--duration-fast) var(--ease-out),
      box-shadow var(--duration-fast) var(--ease-out);
    cursor: default;
    position: relative;
  }
  /* Hover deepens the wash via an inset glaze (NOT filter/transform — those would
     become the containing block for the cards' position:fixed dropdowns and break
     ColorPicker/TagDropdown positioning). */
  .card:hover {
    border-color: var(--color-border-strong);
    box-shadow:
      inset 3px 0 0 0 var(--color-card-accent, var(--color-default-solid)),
      inset 0 0 0 200px rgba(255, 255, 255, 0.05),
      var(--shadow-card-hover);
  }
  .card:focus-visible { outline: 2px solid var(--color-border-focus); outline-offset: 2px; }
  .card.read { opacity: 0.55; }
  /* Reveal the row controls on hover OR focus-within. focus-within fires the moment
     the card (tabindex=0) or anything inside it gains focus, so keyboard users see the
     controls before reaching them — not only once a button itself is focused. C5. */
  .card:hover .delete-btn,
  .card:focus-within .delete-btn { opacity: 1; }
  .content { flex: 1; min-width: 0; }
  .title {
    display: block; width: 100%;
    font-size: 13px; font-weight: 500;
    color: var(--color-text-primary);
    white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
    text-align: left;
    background: transparent;
    border: none;
    padding: 0;
    cursor: pointer;
  }
  .title:hover { text-decoration: underline; }
  .title:focus-visible { outline: 2px solid var(--color-border-focus); outline-offset: 1px; }
  .hostname {
    display: block; font-size: 11px;
    color: var(--color-text-muted);
    font-family: var(--font-mono);
    white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
  }
  .read-toggle {
    font-size: 11px; color: var(--color-text-muted); opacity: 0;
    width: 20px; height: 20px; display: flex; align-items: center; justify-content: center;
    border-radius: var(--radius-sm); flex-shrink: 0;
    background: transparent; border: none; cursor: pointer;
  }
  .card:hover .read-toggle,
  .card:focus-within .read-toggle { opacity: 0.6; }
  .read-toggle:hover { opacity: 1 !important; color: var(--color-accent); background: var(--color-surface-overlay); }
  .read-toggle:focus-visible { opacity: 1; outline: 2px solid var(--color-border-focus); outline-offset: 2px; }
  .delete-btn {
    font-size: 16px; color: var(--color-text-muted); opacity: 0;
    width: 20px; height: 20px; display: flex; align-items: center; justify-content: center;
    border-radius: var(--radius-sm); flex-shrink: 0;
    background: transparent; border: none; cursor: pointer;
  }
  .delete-btn:hover { color: var(--color-destructive); background: var(--color-surface-overlay); }
  .delete-btn:focus-visible { opacity: 1; outline: 2px solid var(--color-border-focus); outline-offset: 2px; }

  /* Touch devices can't hover, so the controls would never appear. Keep them faintly
     visible there (mouse users keep the clean hover-reveal above). C5. */
  @media (hover: none) {
    .card .read-toggle { opacity: 0.55; }
    .card .delete-btn { opacity: 0.55; }
  }
</style>
