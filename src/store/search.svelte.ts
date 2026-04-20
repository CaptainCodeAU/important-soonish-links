export const searchState = $state({ query: "" });

let debounceTimer: ReturnType<typeof setTimeout> | undefined;

export function setQuery(value: string): void {
  clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => {
    searchState.query = value;
  }, 120);
}

export function clearSearch(): void {
  clearTimeout(debounceTimer);
  searchState.query = "";
}
