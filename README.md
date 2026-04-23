# Important Soonish Links

A Chrome extension for saving important links you absolutely intend to read. Past-you had plans. The works. Present-you is lost in a rabbit hole about something else entirely. Not today. Definitely not today. Right after this one other thing. And after those tabs are dealt with. Soonish. That much is certain.

## Features

- **One-click save** — click `+` to save the current tab, or right-click any link on a page
- **Color coding** — 10-color Notion-inspired palette; hover a card's dot to recolor
- **Tag system** — 6 built-in categories (Read later, Reference, Inspiration, Watch later, Work, Personal)
- **Search** — fuzzy, live, case-insensitive search across titles and URLs
- **Filter** — filter by color, tag, or both
- **Sort** — recently added, oldest first, alphabetical, by color, or by tag
- **Mark as read** — dim completed links without deleting them
- **Delete with undo** — confirmation dialog + 5-second undo toast
- **Export** — JSON, Markdown, or HTML (Netscape Bookmark format)
- **Import** — merge or replace from a JSON backup
- **Dark mode** — light, dark, or follow system
- **Sync** — optional cross-device sync via `chrome.storage.sync`
- **Keyboard shortcut** — `Cmd+Shift+L` (Mac) / `Ctrl+Shift+L` (Windows/Linux)
- **Badge count** — saved link count on the toolbar icon (toggleable)

## Tech Stack

| Layer | Technology |
|-------|------------|
| UI | Svelte 5 (runes) |
| Language | TypeScript |
| Build | Vite + @crxjs/vite-plugin + @sveltejs/vite-plugin-svelte |
| Styling | CSS custom properties + Svelte scoped styles |
| State | Svelte 5 rune-based stores (`$state`, `$derived`, `$effect`) |
| Testing | Vitest + @testing-library/svelte |
| Fonts | Instrument Serif, Inter, JetBrains Mono (bundled locally as .ttf, OFL 1.1) |

No Tailwind. No Zustand. No external services, analytics, or telemetry.

## Getting Started

### Prerequisites

- Node.js 18+
- [pnpm](https://pnpm.io/)

### Install

```sh
pnpm install
```

### Development

```sh
pnpm dev
```

Then load the extension in Chrome:

1. Open `chrome://extensions`
2. Enable **Developer mode**
3. Click **Load unpacked**
4. Select the `dist/` folder

Vite provides HMR — changes rebuild automatically.

### Build

```sh
pnpm build
```

Runs `svelte-check` for template type safety, then produces a production build in `dist/`.

### Package for Chrome Web Store

```sh
pnpm package
```

Produces `important-soonish-links.zip` ready for submission.

### Tests

```sh
pnpm test
```

### Type Check

```sh
pnpm typecheck
```

## Project Structure

```
src/
├── background/       Service worker (context menu, badge updates)
├── components/       15 Svelte components (App, Header, LinkCard, etc.)
├── content/          Reserved for future content scripts
├── lib/              Colors, tags, search, utilities, microcopy
├── popup/            Extension popup entry point
├── storage/          Storage abstraction, migrations, sync logic
├── store/            Rune-based reactive stores
├── styles/           CSS tokens, fonts, global styles
└── types/            TypeScript interfaces
```

## Permissions

| Permission | Why |
|------------|-----|
| `storage` | Save links and settings via `chrome.storage.local` / `chrome.storage.sync` |
| `activeTab` | Read current tab's title, URL, and favicon on save |
| `tabs` | `chrome.tabs.query` in popup context |
| `contextMenus` | Right-click "Save to Important Soonish Links" |

No host permissions. No `<all_urls>`. The extension never reads page content.

## Privacy

- No external services, backends, or APIs
- No analytics, telemetry, or tracking
- Data never leaves the extension except via user-initiated export or Chrome's built-in sync
- All fonts are bundled locally

## License

All bundled fonts (Instrument Serif, Inter, JetBrains Mono) are licensed under the [SIL Open Font License 1.1](https://scripts.sil.org/OFL).
