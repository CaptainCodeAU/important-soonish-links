<script lang="ts">
  import { onMount, tick } from "svelte";
  import { fly } from "svelte/transition";
  import { loadLinks } from "../store/links.svelte";
  import { loadSettings } from "../store/settings.svelte";
  import Header from "./Header.svelte";
  import SearchBar from "./SearchBar.svelte";
  import FilterBar from "./FilterBar.svelte";
  import LinkList from "./LinkList.svelte";
  import ToastContainer from "./ToastContainer.svelte";
  import SettingsView from "./SettingsView.svelte";

  let view = $state<"list" | "settings">("list");

  // Slide distance for the view transition; must match --popup-width (tokens.css)
  // so a view fully clears the popup on slide-out.
  const POPUP_WIDTH = 760;

  let gearEl = $state<HTMLButtonElement>();

  // Returning from settings, restore focus to the gear that opened it. C4 / 2.4.3.
  async function handleBack() {
    view = "list";
    await tick();
    gearEl?.focus();
  }

  onMount(async () => {
    await Promise.all([loadLinks(), loadSettings()]);
    chrome.runtime.onMessage.addListener((msg) => {
      if (msg?.type === "link-saved") loadLinks();
    });
    // Stay fresh when storage changes from elsewhere (context-menu save, another
    // device's sync). Reload only the affected slice; reloads are read-only, so
    // reacting to our own writes is harmless and idempotent — no write loop.
    chrome.storage.onChanged.addListener((changes) => {
      const keys = Object.keys(changes);
      if (keys.some(k => k === "isl_links" || k.startsWith("isl_links_"))) loadLinks();
      if (keys.includes("isl_settings")) loadSettings();
    });
  });
</script>

<div class="popup">
  <div class="views">
    {#if view === "list"}
      <div class="view" transition:fly={{ x: -POPUP_WIDTH, duration: 200 }}>
        <Header onSettings={() => (view = "settings")} bind:gearEl />
        <SearchBar />
        <FilterBar />
        <LinkList />
      </div>
    {:else}
      <div class="view" transition:fly={{ x: POPUP_WIDTH, duration: 200 }}>
        <SettingsView onBack={handleBack} />
      </div>
    {/if}
  </div>
  <ToastContainer />
</div>

<style>
  .popup {
    width: var(--popup-width);
    height: 580px;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    background: var(--color-surface-base);
    position: relative;
  }
  .views {
    position: relative;
    flex: 1;
    min-height: 0;
    overflow: hidden;
  }
  .view {
    position: absolute;
    inset: 0;
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }
</style>
