<script lang="ts">
  import { onMount } from "svelte";
  import { fly } from "svelte/transition";
  import { loadLinks } from "../store/links.svelte";
  import { loadSettings } from "../store/settings.svelte";
  import Header from "./Header.svelte";
  import SearchBar from "./SearchBar.svelte";
  import FilterRow from "./FilterRow.svelte";
  import LinkList from "./LinkList.svelte";
  import ToastContainer from "./ToastContainer.svelte";
  import SettingsView from "./SettingsView.svelte";

  let view = $state<"list" | "settings">("list");

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
      <div class="view" transition:fly={{ x: -380, duration: 200 }}>
        <Header onSettings={() => (view = "settings")} />
        <SearchBar />
        <FilterRow />
        <LinkList />
      </div>
    {:else}
      <div class="view" transition:fly={{ x: 380, duration: 200 }}>
        <SettingsView onBack={() => (view = "list")} />
      </div>
    {/if}
  </div>
  <ToastContainer />
</div>

<style>
  .popup {
    width: 380px;
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
