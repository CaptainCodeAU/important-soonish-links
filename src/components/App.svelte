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
  });
</script>

<div class="popup">
  {#if view === "list"}
    <div transition:fly={{ x: -380, duration: 200 }}>
      <Header onSettings={() => (view = "settings")} />
      <SearchBar />
      <FilterRow />
      <LinkList />
    </div>
  {:else}
    <div transition:fly={{ x: 380, duration: 200 }}>
      <SettingsView onBack={() => (view = "list")} />
    </div>
  {/if}
  <ToastContainer />
</div>

<style>
  .popup {
    width: 380px;
    max-height: 580px;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    background: var(--color-surface-base);
    position: relative;
  }
</style>
