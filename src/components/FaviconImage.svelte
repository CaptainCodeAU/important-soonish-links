<script lang="ts">
  import { NOTION_PALETTE } from "../lib/colors";
  import { isSafeFaviconUrl } from "../lib/utils";
  import type { ColorId } from "../types";

  let { src, hostname, color }: { src?: string; hostname: string; color: ColorId } = $props();
  let failed = $state(false);
  // Defense-in-depth: only ever bind a safe favicon URL to <img>, even though the
  // sanitize boundary already drops unsafe ones. Unsafe/empty -> letter-avatar fallback.
  const safeSrc = $derived(src && isSafeFaviconUrl(src) ? src : undefined);
</script>

{#if safeSrc && !failed}
  <img
    src={safeSrc}
    alt=""
    class="favicon"
    onerror={() => (failed = true)}
    loading="lazy"
  />
{:else}
  <span
    class="favicon favicon-fallback"
    style:background={NOTION_PALETTE[color].solid}
    aria-hidden="true"
  >
    {hostname.charAt(0).toUpperCase()}
  </span>
{/if}

<style>
  .favicon {
    width: 16px; height: 16px;
    border-radius: var(--radius-sm);
    flex-shrink: 0;
    object-fit: contain;
  }
  .favicon-fallback {
    display: flex; align-items: center; justify-content: center;
    width: 16px; height: 16px;
    border-radius: var(--radius-sm);
    font-size: 9px; font-weight: 700;
    color: #fff;
    flex-shrink: 0;
  }
</style>
