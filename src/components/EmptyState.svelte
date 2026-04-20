<script lang="ts">
  import { COPY } from "../lib/copy";
  let { type }: { type: "empty" | "no-results" } = $props();
</script>

<div class="empty">
  <p>{type === "empty" ? COPY.EMPTY_LIST : COPY.EMPTY_SEARCH}</p>
</div>

<style>
  .empty {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 32px 24px;
    text-align: center;
  }
  .empty p {
    font-size: 13px;
    color: var(--color-text-muted);
    line-height: 1.5;
  }
</style>
