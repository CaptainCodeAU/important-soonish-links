# SPEC.md — Important Soonish Links (Chrome Extension)

Version: 0.2.0-draft
Date: 2026-04-20
Status: Pre-implementation — review Open Questions before proceeding.

**Changelog from 0.1.0-draft:** UI framework switched from React 18 to Svelte 5 (runes). Zustand removed (replaced by rune-based stores). Tailwind removed (replaced by scoped `<style>` blocks referencing CSS custom properties). List virtualization deferred from MVP to v2. All other sections — data model, storage, design tokens, accessibility, microcopy, user flows — unchanged.

---

## Table of Contents

1. [Overview & Product Voice](#1-overview--product-voice)
2. [Core Requirements](#2-core-requirements)
3. [Feature Scope](#3-feature-scope)
4. [Technical Requirements](#4-technical-requirements)
5. [File & Folder Structure](#5-file--folder-structure)
6. [Data Model](#6-data-model)
7. [Storage Strategy](#7-storage-strategy)
8. [Design System](#8-design-system)
9. [Accessibility](#9-accessibility)
10. [Error Handling](#10-error-handling)
11. [Performance](#11-performance)
12. [Testing](#12-testing)
13. [Build & Packaging](#13-build--packaging)
14. [User Flows](#14-user-flows)
15. [Microcopy Reference](#15-microcopy-reference)
16. [Open Questions](#16-open-questions)
17. [Constraints](#17-constraints)

---

## 1. Overview & Product Voice

### Product Identity

**Name:** Important Soonish Links
**Type:** Chrome Extension (Manifest V3)
**Tagline (verbatim):**

> A chrome extension for saving important links you absolutely intend to read. Past-you had plans. The works. Present-you is lost in a rabbit hole about something else entirely. Not today. Definitely not today. Right after this one other thing. And after those tabs are dealt with. Soonish. That much is certain.

### Voice & Tone

The product's voice is ADHD-aware, self-aware, warm, and quietly funny. The humor is affectionate — laughing *with* the user, never at them. The product is a calm refuge for links, not a productivity tool with stakes.

Guidelines for all user-facing copy:
- Dry, forgiving, lightly absurd.
- Never preachy, never "productivity guru."
- One good line beats five clever ones — err toward restraint.
- Playful voice lives in microcopy and empty states, not in navigation labels or error descriptions (those should be clear first).

All UI copy is catalogued in [§15 Microcopy Reference](#15-microcopy-reference).

---

## 2. Core Requirements

### 2.1 Extension Entry Point

- Browser action icon in the Chrome toolbar.
- Clicking opens a **popup panel** anchored to the toolbar icon (not a new tab, not a side panel).
- Popup dimensions: fixed **380px wide**, **max-height 580px**, internal scrolling for the link list.

### 2.2 Main Popup Layout

Layout flows top → bottom:

```
┌──────────────────────────────────────────────┐
│  [+▾]    Important Soonish Links    [⚙]      │  ← Header
├──────────────────────────────────────────────┤
│  🔍  Search...                            [×] │  ← Search bar
├──────────────────────────────────────────────┤
│  [color filters]  [tag filters]               │  ← Filter row (MVP)
├──────────────────────────────────────────────┤
│  ● 🏷  favicon  Title                    [×] │
│         hostname.com                          │  ← Link cards (scrollable)
│  ...                                          │
├──────────────────────────────────────────────┤
│  12 links · 3 read                            │  ← Footer count
└──────────────────────────────────────────────┘
```

**Header row:**
- Left: `+` button with a small caret (`▾`) to its immediate right.
- Center: wordmark "Important Soonish Links" in the display typeface (Instrument Serif), small (~13px), line-clamped to one line.
- Right: gear icon (settings).

**Search bar:**
- Live, fuzzy, case-insensitive. Debounce 120ms.
- Searches title AND URL.
- `×` clear button appears inside the input only when it has content.
- Placeholder: *"Find something past-you saved..."*

**Filter row:**
- Horizontal strip of color dot chips + tag chips, appearing between search and list.
- Each chip is toggleable; multiple chips in the same category are OR'd; across categories they are AND'd.
- See §3 for scope.

**Footer:**
- Subtle, muted text: `{n} links · {m} read`.
- Updates reactively.

### 2.3 Link Card Anatomy

```
┌──────────────────────────────────────────────────────────┐
│  ●  🏷  [favicon]  Page Title                        [×] │
│              hostname.com                                 │
└──────────────────────────────────────────────────────────┘
```

Left-to-right:
1. **Colored dot** (16px, fully rounded) — color tag indicator. Hover expands to color picker (§2.4).
2. **Tag chip / tag icon** — if a tag is set, renders as a small pill; if unset, renders as an outline `Tag` icon. Clicking opens tag dropdown (§2.6).
3. **Favicon** (16×16px, rounded 2px). Fallback: neutral globe icon, or first letter of hostname in the link's current color.
4. **Primary content** (fills remaining width):
   - **Title** — primary text, truncated at one line with ellipsis. Clicking opens the link in a new background tab (modifier key: Cmd/Ctrl opens in foreground).
   - **URL/hostname** — second line, smaller (~11px), muted color, truncated.
5. **Delete button** (`×`) — far right, visible on card hover (always visible on touch/narrow).

**Card states:**
- Default: subtle background tint matching the selected color (see §8).
- Hover: slightly elevated shadow, × button revealed.
- Read/archived: reduced opacity (0.6) with a thin left-border accent or strikethrough-style treatment. Still interactable.
- Pinned: thin top-border accent or pin icon overlay.
- Focus (keyboard): visible focus ring (2px, offset 2px, matches accent color).

**Card dimensions:** 8px vertical padding, 12px horizontal padding, 8px border-radius, min-height 56px.

### 2.4 Color Dot → Color Picker

**Behavior:**
- Hovering the colored dot animates it expanding into a horizontal strip of 10 small color swatches (20×20px, 4px gap, 6px border-radius, 150ms ease-out).
- The strip appears in-line below the dot position or as a floating mini-panel — do not overflow the popup.
- Clicking a swatch: updates the dot color, updates the card background tint, persists the choice, collapses the strip.
- Clicking outside the strip collapses it (no change).
- `prefers-reduced-motion`: skip animation; show/hide instantly.

**Implementation note:** Svelte's built-in `transition:` directive (e.g. `transition:slide` or a custom transition) handles both the expand/collapse animation and the reduced-motion fallback without additional libraries.

**Palette:** Notion's 10-color set (see §8 for complete hex values):
Default, Gray, Brown, Orange, Yellow, Green, Blue, Purple, Pink, Red.

**ARIA treatment:** The color picker is a `radiogroup` with each swatch as a `radio` input. Label each swatch with its color name. Announce selection to screen readers.

### 2.5 `+` Button — Quick Add

**Primary action (click `+`):**
1. Query `chrome.tabs.query({ active: true, currentWindow: true })`.
2. Extract `title`, `url`, `favIconUrl`.
3. Check for URL duplicate in store.
   - **Duplicate found:** toast *"Already saved. Past-you was on top of things."* No mutation.
   - **No duplicate:** save link with defaults (`color: "default"`, no tag, `isRead: false`), show toast *"Saved. For soonish."*
4. Invalid URL (non-http/https, chrome-internal): reject with toast *"That one's not saveable. Past-you tried."*

**Secondary action (click `▾` caret):**
- Opens a compact inline dropdown below the header row with a manual-entry form: two fields — **Title** (pre-filled from current tab, editable) and **URL** (pre-filled from current tab, editable). **Save** and **Cancel** buttons.
- The form validates the URL on blur and on submit.
- On submit: same duplicate/save logic as primary action.

### 2.6 Tag System

**Design principle:** Colors = personal/visual organization. Tags = semantic categorization. Both coexist on every card.

**Default tag set:**

| ID | Label | Rationale | Accent Color |
|---|---|---|---|
| `read-later` | Read later | Long reads, articles; the most common intent | Blue |
| `reference` | Reference | Docs, specs, technical resources | Gray |
| `inspiration` | Inspiration | Design, creative, moodboard content | Pink |
| `watch-later` | Watch later | Video content, distinct from reading | Purple |
| `work` | Work | Job-related — keeps professional links separate | Orange |
| `personal` | Personal | Personal interests, hobbies, everything else | Green |

Tag accent colors are drawn from the Notion palette (see §8). They are deliberately distinct from each other but share the space with the user's color-dot — at the card level they coexist without conflict because the tag renders as a small pill (fixed size, own background) and the card background is controlled by the dot color.

**Tag pill appearance:**
- Shape: fully rounded (pill).
- Padding: 4px vertical × 8px horizontal.
- Font: 11px, 500 weight.
- Background: light-mode tint of the tag's accent color (from the Notion palette), at 60% opacity.
- Text: solid accent color (from the Notion palette).
- No border.

**Interaction:**
- Unset tag: outline `Tag` icon (Lucide `Tag`, 14px). Click → dropdown.
- Set tag: pill renders. Click → dropdown reopens (for change or clear).
- Dropdown: list of 6 tags + a "No tag" clear option at the top. Each item shows the tag label and a small color dot. 200ms fade-in animation (Svelte `transition:fade`).

**MVP:** Tags are fixed (predefined set, no user editing). v2 recommendation: make tags user-editable (rename, recolor, add/remove) — justified because the fixed set covers ~90% of use cases for launch and user-editable tags add significant settings/state complexity that is better validated post-launch.

### 2.7 Delete Flow

**Pattern A (selected):**
1. Click `×` on a card.
2. A **confirmation modal** appears within the popup (not a separate window): *"Delete this link? Past-you won't mind."* Two buttons: **Cancel** (neutral) and **Delete** (red/destructive, outlined).
3. On **Delete**: remove card from list, show a **toast with Undo** button for 5 seconds.
4. On **Undo** (within 5 seconds): restore card exactly — same color, tag, order, notes, read state.
5. If toast timer expires without Undo: deletion is committed.

**Modal ARIA:** `role="alertdialog"`, `aria-labelledby` on the title, `aria-describedby` on the body. Focus traps inside the modal while open. Escape key = Cancel.

Pattern B (dialog-less undo-only) is noted in [§16 Open Questions](#16-open-questions).

### 2.8 Mark as Read / Archive

A link can be marked as read without deletion. This is MVP.

**Mechanism:**
- Each card has a subtle read-toggle affordance: a small checkmark icon or "mark read" action accessible via a secondary interaction (e.g., long-hover reveals it, or it's in a card action menu). Exact affordance TBD in design; a reliable option is a swipe-or-hover-reveal `✓` button on the card left edge.
- Marking read sets `isRead: true` on the link.
- Read links render at reduced opacity (0.6) and move to the bottom of the list (after unread items), or optionally render in a collapsible "Read" section.
- **Recommendation:** move read items to bottom of the list (sorted within their group by `updatedAt` desc). No separate view needed for MVP.
- The footer count reflects both: `{n} links · {m} read`.
- Read count is also shown in Settings → About.

### 2.9 Settings Panel

Clicking the gear icon transitions the popup to a **settings view** via a horizontal slide animation (200ms ease-out; `prefers-reduced-motion`: instant swap). A `←` back arrow in the settings header returns to the main list.

**Implementation note:** Use Svelte's `transition:fly={{ x: 380, duration: 200 }}` on the settings view and the list view for paired slide transitions. Svelte transitions respect `prefers-reduced-motion` automatically when using the built-in transition modules.

**Settings sections:**

**Export**
- JSON: all link data including metadata (as the full `SavedLink[]` array).
- Markdown: each link as `- [Title](URL)`, grouped by tag.
- HTML: Netscape Bookmark File format (compatible with Chrome's bookmark import).
- Label: *"Back them up. Just in case."*

**Import**
- File picker accepting `.json` only.
- After file selection: prompt — **Merge** (default) or **Replace** buttons with brief descriptions.
  - Merge: add imported links, skip URL duplicates.
  - Replace: clear all existing links, then import.
- Error handling: see §10.
- Label: *"Bring your links home."*

**Appearance**
- Three-way toggle: Light / Dark / System (default: System).
- Applies immediately.

**Sort order**
- Dropdown: Recently added (default) / Oldest first / Alphabetical / By color / By tag.

**Sync**
- Toggle: off by default. Label: *"Sync across Chrome installs."* Sub-label: *"Uses Chrome's built-in sync. Your links stay yours — no servers involved."*
- When toggled on: migrates existing local data to sync storage.
- Quota failure notice: see §10.

**Badge count**
- Toggle: show/hide the saved-link count badge on the extension icon. Default: on.

**Reset**
- Button labeled *"Start fresh"*.
- Confirmation modal: *"Clear everything? Past-you will be upset. Future-you might not mind."* Actions: **Cancel** and **Clear everything** (destructive).

**About**
- Version number (from `package.json`, injected at build time).
- GitHub link.
- Tagline: *"A calm home for links. Soonish."*

---

## 3. Feature Scope

| # | Feature | Scope | Rationale |
|---|---|---|---|
| 1 | Keyboard shortcut to open popup (`Cmd/Ctrl+Shift+L`) | **MVP** | Low cost, high value; Chrome exposes this natively |
| 2 | Right-click context menu "Save to Important Soonish Links" | **MVP** | Critical discovery path for links on a page (not just the current tab) |
| 3 | Auto-capture metadata (title, favicon, OG description) | **MVP** | Required for a useful link card; no extra permission needed |
| 4 | Drag-to-reorder within the list | **v2** | Adds complexity (DnD library, order persistence); sort options cover MVP need |
| 5 | Sort options (settings) | **MVP** | Already in Settings §2.9; low cost |
| 6 | Filter by color | **MVP** | Single filter row above list; high visual value |
| 7 | Filter by tag | **MVP** | Same filter row; tags are a core feature |
| 8 | Pin / favorite links to top | **v2** | Data model supports it (`pinned: boolean`); UI adds complexity. Post-launch |
| 9 | Notes field per link | **v2** | Valuable but adds card layout complexity; deprioritize for launch polish |
| 10 | Bulk actions (multi-select delete/recolor/retag) | **v2** | Power-user feature; adds significant interaction complexity |
| 11 | Duplicate detection on add | **MVP** | Already specced in §2.5 |
| 12 | Sync via `chrome.storage.sync` | **MVP** | Specced in §2.9 and §7; opt-in, default off |
| 13 | Export formats (JSON, Markdown, HTML) | **MVP** | Already in Settings §2.9 |
| 14 | Empty state | **MVP** | Required; specced in §8 |
| 15 | Toast notifications | **MVP** | Required for all save/delete/import/error feedback |
| 16 | Undo after delete | **MVP** | Already in §2.7 |
| 17 | Open-all-in-tabs for filtered view | **Considered, excluded** | Aggressive tab-opening is disruptive and rarely needed; excludable for launch |
| 18 | Badge counter on extension icon | **MVP** | Trivial to implement via `chrome.action.setBadgeText`; settings toggle |
| 19 | Mark as read / archive | **MVP** | Strongly recommended; provides positive closure without deletion |
| 20 | Reading time estimate | **Considered, excluded** | Requires content fetch (adds permission complexity) or approximation (unreliable). v2 candidate |
| 21 | List virtualization | **v2** | Deferred — typical user library (tens to low hundreds of links) renders fine without it. Revisit if real usage shows jank. |

---

## 4. Technical Requirements

### 4.1 Manifest & Permissions

```json
{
  "manifest_version": 3,
  "name": "Important Soonish Links",
  "version": "1.0.0",
  "description": "A calm home for the links you absolutely intend to read. Soonish.",
  "action": {
    "default_popup": "popup/index.html",
    "default_icon": {
      "16": "icons/icon16.png",
      "32": "icons/icon32.png",
      "48": "icons/icon48.png",
      "128": "icons/icon128.png"
    }
  },
  "background": {
    "service_worker": "background/index.js",
    "type": "module"
  },
  "permissions": [
    "storage",
    "activeTab",
    "tabs",
    "contextMenus"
  ],
  "commands": {
    "_execute_action": {
      "suggested_key": {
        "default": "Ctrl+Shift+L",
        "mac": "Command+Shift+L"
      },
      "description": "Open Important Soonish Links"
    }
  },
  "icons": {
    "16": "icons/icon16.png",
    "32": "icons/icon32.png",
    "48": "icons/icon48.png",
    "128": "icons/icon128.png"
  }
}
```

**Permission justifications:**

| Permission | Justification |
|---|---|
| `storage` | Read/write saved links and settings via `chrome.storage.local` and `chrome.storage.sync` |
| `activeTab` | Required to read the current tab's title, URL, and favicon on `+` click (granted only on explicit user action) |
| `tabs` | `chrome.tabs.query` in popup context requires this permission; `activeTab` alone is insufficient in a popup |
| `contextMenus` | Register the right-click "Save to Important Soonish Links" context menu item |

No host permissions. No `<all_urls>`. The extension never reads page content — only tab metadata already exposed via `chrome.tabs`.

### 4.2 Tech Stack

| Layer | Technology | Justification |
|---|---|---|
| UI framework | **Svelte 5 (runes)** | Compiled output produces a meaningfully smaller bundle than React + ReactDOM — directly relevant for a popup that mounts on every open. Runes (`$state`, `$derived`, `$effect`) give fine-grained reactivity without a virtual DOM. Component count (~15) is small enough that the migration from React syntax is mechanical. |
| Language | TypeScript | Type-safe data model, color/tag constants, storage layer. Svelte files use `<script lang="ts">`; template type-checking via `svelte-check`. |
| Build tool | Vite + `@crxjs/vite-plugin` + `@sveltejs/vite-plugin-svelte` | Fast HMR for extension development; first-class MV3 support; Svelte plugin is maintained by the Svelte core team. |
| Styling | **CSS custom properties + Svelte scoped `<style>` blocks** | No Tailwind. The Notion palette lives in `styles/tokens.css` as CSS variables (single source of truth, already designed as such); components reference those vars in per-component scoped styles. Svelte scopes `<style>` blocks by default, so class-name collisions are a non-issue. Removing Tailwind saves bundle weight, one build step, and one layer of indirection for a popup of this size. |
| State | **Svelte 5 runes** (no external store library) | `$state` in a `.svelte.ts` module replaces Zustand slices. `$derived` replaces selectors. Cross-component reactivity is automatic. One less dependency; one less mental model. |
| Testing | Vitest + `@testing-library/svelte` | Consistent with the Vite ecosystem; `@testing-library/svelte` mirrors the React Testing Library API for component tests. |
| Type-checking templates | `svelte-check` | Catches template-level type errors that `tsc --noEmit` alone misses. Runs in CI as part of `build`. |
| Drag-to-reorder (v2) | `svelte-dnd-action` | Small, MIT-licensed, good keyboard support. Standard choice in the Svelte ecosystem. |

**Libraries explicitly NOT used:**
- No Tailwind, no PostCSS plugins beyond what Vite provides by default.
- No Zustand, Redux, or other state library — runes cover it.
- No list virtualization library for MVP. If added in v2, use `@tanstack/svelte-virtual`.
- No UI component library. All ~15 components are hand-built against the design tokens.

### 4.3 Styling: CSS Custom Properties + Scoped Styles

The palette, spacing scale, shape tokens, and motion tokens all live in `src/styles/tokens.css` as CSS custom properties declared on `:root` (light mode) and `[data-theme="dark"]` (dark mode). See §8 for the complete token set.

Components consume these tokens inside their own `<style>` block, which Svelte scopes to that component automatically:

```svelte
<!-- src/components/LinkCard.svelte -->
<script lang="ts">
  import type { SavedLink } from '../types';
  let { link }: { link: SavedLink } = $props();
</script>

<div class="card" data-color={link.color}>
  <!-- ...card contents... -->
</div>

<style>
  .card {
    padding: 8px 12px;
    border-radius: var(--radius-md);
    min-height: 56px;
    background: var(--color-card-bg);
    transition: box-shadow var(--duration-fast) var(--ease-out);
  }
  .card:hover {
    box-shadow: var(--shadow-card-hover);
  }
  .card[data-color="blue"]   { --color-card-bg: var(--color-blue-bg);   }
  .card[data-color="green"]  { --color-card-bg: var(--color-green-bg);  }
  /* ...one row per color — or generated via an inline style binding... */
</style>
```

For the card's color-driven background, the cleanest pattern is a `style:` directive binding the CSS var directly, so we don't need a rule per color:

```svelte
<div
  class="card"
  style:--color-card-bg="var(--color-{link.color}-bg)"
>
```

**Global styles** (reset, body defaults, scrollbar styling, `@font-face` declarations) live in `src/styles/global.css` and are imported once from `popup/main.ts`.

**Shared utility classes** — if any patterns genuinely repeat across many components (e.g. `.pill`, `.visually-hidden`), define them in `global.css`. Err on the side of keeping styles local to the component.

---

## 5. File & Folder Structure

```
important-soonish-links/
├── public/
│   ├── icons/
│   │   ├── icon16.png          # Extension icon (16×16)
│   │   ├── icon32.png          # Extension icon (32×32)
│   │   ├── icon48.png          # Extension icon (48×48)
│   │   └── icon128.png         # Extension icon (128×128)
│   └── assets/
│       └── fonts/
│           ├── InstrumentSerif-Regular.woff2
│           ├── InstrumentSerif-Italic.woff2
│           ├── Inter-Variable.woff2          # Variable font, covers all weights
│           └── JetBrainsMono-Variable.woff2
├── src/
│   ├── popup/
│   │   ├── index.html          # Popup HTML entry — loads main.ts
│   │   └── main.ts             # Mounts App.svelte, initializes theme, imports global.css
│   ├── background/
│   │   └── index.ts            # Service worker: context menu, badge updates (framework-agnostic)
│   ├── content/                # (empty for MVP — reserved for future content scripts)
│   ├── components/
│   │   ├── App.svelte          # Root component: view router (list ↔ settings)
│   │   ├── Header.svelte       # Header row: + button, wordmark, gear icon
│   │   ├── AddButton.svelte    # + button with caret dropdown and manual-entry form
│   │   ├── SearchBar.svelte    # Debounced search input with clear button
│   │   ├── FilterRow.svelte    # Color chip + tag chip filter strip
│   │   ├── LinkList.svelte     # List of LinkCard components (no virtualization in MVP)
│   │   ├── LinkCard.svelte     # Individual link card (all states)
│   │   ├── ColorPicker.svelte  # Expanding color swatch strip (uses transition:)
│   │   ├── TagDropdown.svelte  # Tag selection dropdown (uses transition:fade)
│   │   ├── Toast.svelte        # Auto-dismissing toast with optional Undo action
│   │   ├── ToastContainer.svelte  # Manages toast queue and positioning
│   │   ├── ConfirmDialog.svelte   # Generic modal confirmation dialog
│   │   ├── SettingsView.svelte    # Full settings panel (all settings sections)
│   │   ├── EmptyState.svelte      # Empty list state with on-voice copy
│   │   └── FaviconImage.svelte    # Favicon with fallback rendering
│   ├── store/
│   │   ├── links.svelte.ts     # Links state + CRUD (replaces Zustand slice)
│   │   ├── settings.svelte.ts  # Settings state + persistence
│   │   ├── filters.svelte.ts   # Active color/tag filter selections
│   │   ├── search.svelte.ts    # Debounced query; derived filtered list
│   │   ├── theme.svelte.ts     # Theme detection + prefers-reduced-motion
│   │   └── toasts.svelte.ts    # Toast queue with imperative push()
│   ├── storage/
│   │   ├── index.ts            # Public API: readLinks, writeLinks, readSettings, writeSettings
│   │   ├── migrations.ts       # Schema migration functions keyed by version number
│   │   └── sync.ts             # Sync/local toggle logic, quota handling
│   ├── lib/
│   │   ├── colors.ts           # Notion palette constants (single source of truth)
│   │   ├── tags.ts             # Default tag definitions
│   │   ├── copy.ts             # All user-facing microcopy strings
│   │   ├── search.ts           # Fuzzy search implementation (no external dependency)
│   │   └── utils.ts            # UUID generation, URL validation, date helpers
│   ├── types/
│   │   └── index.ts            # All TypeScript interfaces and type exports
│   └── styles/
│       ├── tokens.css          # CSS custom properties (palette, radius, spacing, motion)
│       ├── fonts.css           # @font-face declarations
│       └── global.css          # Base reset, body defaults, scrollbar styling, shared utility classes
├── manifest.json
├── vite.config.ts
├── svelte.config.js            # Svelte compiler options (runes mode, preprocessors)
├── tsconfig.json
├── package.json
├── SPEC.md                     # This file
└── README.md
```

**Notes on the restructure from v0.1.0:**
- `hooks/` folder is gone. Each former hook becomes a `.svelte.ts` module in `store/`. Components read/write reactive state directly; no `useX()` wrapper needed because runes already provide fine-grained reactivity.
- `tailwind.config.ts` is gone.
- `svelte.config.js` is added for compiler options (runes mode must be explicitly enabled in Svelte 5 if not using all-runes-everywhere project config).
- All `.tsx` files become `.svelte`. Non-component TypeScript (`lib/`, `storage/`, `types/`, `background/`) is unchanged.

---

## 6. Data Model

```ts
// src/types/index.ts

export type ColorId =
  | "default"
  | "gray"
  | "brown"
  | "orange"
  | "yellow"
  | "green"
  | "blue"
  | "purple"
  | "pink"
  | "red";

export type TagId =
  | "read-later"
  | "reference"
  | "inspiration"
  | "watch-later"
  | "work"
  | "personal";

export type SortOrder =
  | "recent"       // createdAt descending (default)
  | "oldest"       // createdAt ascending
  | "alphabetical" // title ascending
  | "color"        // grouped by colorId
  | "tag";         // grouped by tagId

export interface SavedLink {
  id: string;           // UUIDv4
  title: string;
  url: string;          // normalized (trimmed); validated as http/https on write
  favicon?: string;     // data URI or https URL
  description?: string; // OG description, max 300 chars
  color: ColorId;       // defaults to "default"
  tag?: TagId;          // undefined = no tag
  pinned?: boolean;     // defaults to undefined (falsy)
  notes?: string;       // free text, max 500 chars (v2 feature; field reserved in model)
  isRead?: boolean;     // defaults to undefined (falsy = unread)
  order: number;        // integer for drag-to-reorder; for MVP, matches insertion index
  createdAt: number;    // epoch ms
  updatedAt: number;    // epoch ms
}

export interface AppSettings {
  schemaVersion: number;          // incremented on breaking storage schema changes
  theme: "light" | "dark" | "system";
  sortOrder: SortOrder;
  syncEnabled: boolean;           // default false
  showBadgeCount: boolean;        // default true
}

export interface Tag {
  id: TagId;
  label: string;
  accentColor: ColorId;           // from the Notion palette
}

export interface StorageData {
  links: SavedLink[];
  settings: AppSettings;
}
```

**Defaults:**

```ts
export const DEFAULT_SETTINGS: AppSettings = {
  schemaVersion: 1,
  theme: "system",
  sortOrder: "recent",
  syncEnabled: false,
  showBadgeCount: true,
};

export const DEFAULT_LINK_COLOR: ColorId = "default";
```

---

## 7. Storage Strategy

### 7.1 Storage Abstraction

All reads and writes go through `src/storage/index.ts`. No component or store module calls `chrome.storage.*` directly.

```ts
// src/storage/index.ts (interface contract)

export async function readLinks(): Promise<SavedLink[]>
export async function writeLinks(links: SavedLink[]): Promise<void>
export async function readSettings(): Promise<AppSettings>
export async function writeSettings(settings: AppSettings): Promise<void>
export async function clearAll(): Promise<void>
```

Internally, these functions select either `chrome.storage.sync` or `chrome.storage.local` based on `settings.syncEnabled`, and run migrations on first read after an extension update.

### 7.2 Storage Keys

```ts
const STORAGE_KEYS = {
  LINKS:    "isl_links",
  SETTINGS: "isl_settings",
} as const;
```

Prefixed with `isl_` to avoid collision with other extensions if the storage is ever inspected.

### 7.3 Schema Migrations

On every storage read, compare `storedData.settings.schemaVersion` against `CURRENT_SCHEMA_VERSION`. If older, run migrations sequentially.

```ts
// src/storage/migrations.ts

export type MigrationFn = (data: Partial<StorageData>) => StorageData;

export const migrations: Record<number, MigrationFn> = {
  // Version 1 is the initial schema; no migration needed.
  // Example future migration:
  // 2: (data) => ({ ...data, links: data.links!.map(l => ({ ...l, newField: default })) }),
};

export function runMigrations(data: Partial<StorageData>, fromVersion: number): StorageData {
  let current = data;
  for (let v = fromVersion + 1; v <= CURRENT_SCHEMA_VERSION; v++) {
    if (migrations[v]) current = migrations[v](current);
  }
  return current as StorageData;
}
```

Migrations run at startup (first `readLinks` call) and are idempotent. Migrated data is written back immediately.

### 7.4 Sync Storage & Quota Handling

`chrome.storage.sync` limits:
- Total: 102,400 bytes
- Per-item: 8,192 bytes
- Max items: 512

Strategy:
- Links are stored as a single JSON array under `isl_links`. For large collections this may exceed the per-item limit.
- **Chunking:** if `JSON.stringify(links).length > 7500` (leaving headroom), split into `isl_links_0`, `isl_links_1`, ... up to a computed count. Reassemble on read. Maximum supported collection: ~50,000 bytes / ~100–200 average-length links.
- On `chrome.storage.sync.set` error (quota exceeded): automatically fall back to `chrome.storage.local`, set `settings.syncEnabled = false`, and show a one-time toast: *"Sync hit its limit. Links saved locally instead — no data lost."*
- The sync fallback is permanent for that session; the user must re-enable sync in settings if they want to try again.

### 7.5 Context Menu ↔ Popup Communication

The service worker registers the context menu and handles `chrome.contextMenus.onClicked`. It writes the new link directly to storage, then dispatches a message to the popup (if open) via `chrome.runtime.sendMessage` so the list refreshes. The popup listens via `chrome.runtime.onMessage`.

### 7.6 Store ↔ Storage Integration

Rune-based stores in `src/store/` are the reactive layer; they do not replace the storage abstraction. Each store module:
1. On first subscribe (or on explicit `load()` call from `App.svelte` mount), reads from storage and populates its `$state`.
2. Exposes imperative functions (`addLink`, `updateLink`, `deleteLink`, etc.) that mutate `$state` in memory *and* call the storage layer to persist.
3. Writes are fire-and-forget at the call site but catch storage errors internally and push a toast.

```ts
// src/store/links.svelte.ts (sketch)
import type { SavedLink } from '../types';
import { readLinks, writeLinks } from '../storage';
import { pushToast } from './toasts.svelte';
import { COPY } from '../lib/copy';

export const linksState = $state({
  items: [] as SavedLink[],
  loaded: false,
});

export async function loadLinks() {
  linksState.items = await readLinks();
  linksState.loaded = true;
}

export async function addLink(link: SavedLink) {
  const next = [link, ...linksState.items];
  linksState.items = next;
  try {
    await writeLinks(next);
  } catch {
    pushToast(COPY.STORAGE_WRITE_FAILED);
  }
}
```

---

## 8. Design System

### 8.1 Notion Color Palette

**Source:** Observed from Notion's published UI and block background CSS (inspect Notion app, verify before shipping — colors may shift between Notion releases).

Each color has three variants:
- **Solid** — used for the color dot, focused states, and tag accent text.
- **Light BG** — used as card background tint in light mode.
- **Dark BG** — used as card background tint in dark mode.

```ts
// src/lib/colors.ts

export interface NotionColorTokens {
  solid:   string; // hex
  lightBg: string; // hex
  darkBg:  string; // hex
  label:   string; // human-readable color name
}

export const NOTION_PALETTE: Record<ColorId, NotionColorTokens> = {
  default: { solid: "#9B9A97", lightBg: "#F1F1EF", darkBg: "#2F2F2F", label: "Default"  },
  gray:    { solid: "#9B9A97", lightBg: "#F1F1EF", darkBg: "#2F2F2F", label: "Gray"     },
  brown:   { solid: "#64473A", lightBg: "#F4EEEE", darkBg: "#3A2726", label: "Brown"    },
  orange:  { solid: "#D9730D", lightBg: "#FAEBDD", darkBg: "#3D2314", label: "Orange"   },
  yellow:  { solid: "#DFAB01", lightBg: "#FBF3DB", darkBg: "#3B2F00", label: "Yellow"   },
  green:   { solid: "#0F7B6C", lightBg: "#DDEDEA", darkBg: "#1C3830", label: "Green"    },
  blue:    { solid: "#0B6E99", lightBg: "#DDEBF1", darkBg: "#143A47", label: "Blue"     },
  purple:  { solid: "#6940A5", lightBg: "#EAE4F2", darkBg: "#2E2043", label: "Purple"   },
  pink:    { solid: "#AD1A72", lightBg: "#F4DFEB", darkBg: "#3A0D27", label: "Pink"     },
  red:     { solid: "#E03E3E", lightBg: "#FBE4E4", darkBg: "#3E1414", label: "Red"      },
};
```

These values are **mirrored** into `styles/tokens.css` as CSS custom properties (`--color-blue-solid`, `--color-blue-bg`, etc.) so that templates and scoped `<style>` blocks can reference them directly without importing the TS constant. Keep the two in sync via a code-gen script or manual care — the TS version is authoritative.

> **Implementation note:** `default` and `gray` share the same tokens — `default` is the "no color" state; `gray` is an explicit gray selection. On the color picker, `default` renders as a neutral white/gray outline swatch labeled "None" or "Default."

### 8.2 Tag Accent Colors

Tag chips use the Notion solid + lightBg tokens of their assigned accent color:

| Tag | Accent ColorId | Chip BG (light mode) | Chip text |
|---|---|---|---|
| Read later | `blue` | `#DDEBF1` | `#0B6E99` |
| Reference | `gray` | `#F1F1EF` | `#9B9A97` |
| Inspiration | `pink` | `#F4DFEB` | `#AD1A72` |
| Watch later | `purple` | `#EAE4F2` | `#6940A5` |
| Work | `orange` | `#FAEBDD` | `#D9730D` |
| Personal | `green` | `#DDEDEA` | `#0F7B6C` |

### 8.3 Typography

All fonts are bundled under `public/assets/fonts/` and loaded via `@font-face` in `styles/fonts.css`. Do not load fonts from CDN.

| Role | Font | Weights | Format | License |
|---|---|---|---|---|
| Display / Wordmark | Instrument Serif | Regular (400), Italic | woff2 | OFL 1.1 |
| UI / Body | Inter | Variable (100–900) | woff2 | OFL 1.1 |
| URLs / Metadata | JetBrains Mono | Variable (100–800) | woff2 | OFL 1.1 |

**Alternate pairing (documented, not implemented):** Geist (UI) + Fraunces (display). Consider if Instrument Serif feels too formal in testing.

```css
/* styles/fonts.css */
@font-face {
  font-family: "Instrument Serif";
  src: url("/assets/fonts/InstrumentSerif-Regular.woff2") format("woff2");
  font-weight: 400;
  font-style: normal;
  font-display: swap;
}
@font-face {
  font-family: "Instrument Serif";
  src: url("/assets/fonts/InstrumentSerif-Italic.woff2") format("woff2");
  font-weight: 400;
  font-style: italic;
  font-display: swap;
}
@font-face {
  font-family: "Inter";
  src: url("/assets/fonts/Inter-Variable.woff2") format("woff2-variations");
  font-weight: 100 900;
  font-display: swap;
}
@font-face {
  font-family: "JetBrains Mono";
  src: url("/assets/fonts/JetBrainsMono-Variable.woff2") format("woff2-variations");
  font-weight: 100 800;
  font-display: swap;
}
```

**Font family tokens** (defined in `tokens.css` for use in component styles):

```css
:root {
  --font-display: "Instrument Serif", Georgia, serif;
  --font-ui:      "Inter", system-ui, sans-serif;
  --font-mono:    "JetBrains Mono", ui-monospace, monospace;
}
```

**Type scale (popup-specific):**

| Use | Size | Weight | Font | Color |
|---|---|---|---|---|
| Wordmark | 13px | 400 | Instrument Serif | --color-text-primary |
| Card title | 13px | 500 | Inter | --color-text-primary |
| Card URL | 11px | 400 | JetBrains Mono | --color-text-muted |
| Tag pill label | 11px | 500 | Inter | tag accent solid |
| Search input | 13px | 400 | Inter | --color-text-primary |
| Footer count | 11px | 400 | Inter | --color-text-muted |
| Settings labels | 13px | 500 | Inter | --color-text-primary |
| Toast text | 12px | 400 | Inter | --color-text-inverse |

### 8.4 Spacing

Base unit: 4px. All spacing values are multiples of 4.

```
--space-1: 4px
--space-2: 8px
--space-3: 12px
--space-4: 16px
--space-5: 20px
--space-6: 24px
```

### 8.5 Shape

```
--radius-sm:   4px   /* buttons, favicon */
--radius-md:   8px   /* cards, dropdowns */
--radius-lg:   12px  /* modals, settings panel */
--radius-full: 9999px /* pills, dots */
```

### 8.6 Shadows

```css
--shadow-card-hover: 0 2px 8px rgba(0, 0, 0, 0.08);
--shadow-dropdown:   0 4px 16px rgba(0, 0, 0, 0.12);
--shadow-modal:      0 8px 32px rgba(0, 0, 0, 0.16);
```

### 8.7 Motion Tokens

```css
--duration-fast:   150ms;
--duration-base:   200ms;
--duration-slow:   300ms;
--ease-out:        cubic-bezier(0.0, 0.0, 0.2, 1.0);
--ease-in-out:     cubic-bezier(0.4, 0.0, 0.2, 1.0);
```

All transitions: `@media (prefers-reduced-motion: reduce)` overrides to `transition: none` or `animation: none`. Svelte's built-in `transition:` directives respect this media query automatically.

### 8.8 Light / Dark Mode Tokens

```css
:root {
  /* Surfaces */
  --color-surface-base:     #FFFFFF;
  --color-surface-raised:   #F7F7F5;
  --color-surface-overlay:  rgba(0, 0, 0, 0.04);

  /* Text */
  --color-text-primary:     #1A1A1A;
  --color-text-secondary:   #4A4A4A;
  --color-text-muted:       #9B9A97;
  --color-text-inverse:     #FFFFFF;

  /* Borders */
  --color-border:           rgba(0, 0, 0, 0.08);
  --color-border-focus:     #0B6E99;

  /* Interactive */
  --color-accent:           #0B6E99;
  --color-destructive:      #E03E3E;
}

[data-theme="dark"] {
  --color-surface-base:     #191919;
  --color-surface-raised:   #232323;
  --color-surface-overlay:  rgba(255, 255, 255, 0.04);

  --color-text-primary:     #EBEBEA;
  --color-text-secondary:   #9B9A97;
  --color-text-muted:       #64635F;
  --color-text-inverse:     #191919;

  --color-border:           rgba(255, 255, 255, 0.08);
  --color-border-focus:     #6BAFCA;

  --color-accent:           #6BAFCA;
  --color-destructive:      #F28282;
}
```

### 8.9 Empty State

When no links are saved (or when filters produce no results):

**No links at all:**
> *"No links saved yet. Past-you has some work to do."*

Optional: a small, tasteful line-art illustration (an hourglass, a bookmark, or a gentle rabbit hole motif). Must be SVG, included in the bundle, not fetched.

**No results from search/filter:**
> *"Nothing matches. Past-you may have called it something else."*

---

## 9. Accessibility

- **Keyboard navigation:** Tab order follows visual order (header → search → filter row → list → footer). Within the list: `↑`/`↓` move between cards. `Enter` opens the focused link. `Delete` or `Backspace` on a focused card triggers the delete confirmation. `Space` on a card's color dot opens the color picker; arrow keys navigate swatches; `Enter` selects.
- **Focus management:** When a modal opens, focus traps inside it. On close, focus returns to the triggering element.
- **Visible focus rings:** `outline: 2px solid var(--color-border-focus); outline-offset: 2px;` on all interactive elements. Never `outline: none` without a replacement.
- **ARIA roles:**
  - Color picker: `role="radiogroup"` containing `role="radio"` swatches. `aria-label="Card color"`.
  - Tag dropdown: `role="listbox"` with `role="option"` items. `aria-label="Card tag"`.
  - Confirm dialog: `role="alertdialog"`, `aria-modal="true"`, `aria-labelledby`, `aria-describedby`.
  - Toasts: `role="status"` for informational (save, mark-read), `role="alert"` for errors.
  - Filter chips: `role="group"` containing `role="checkbox"` chips.
  - Settings back button: `aria-label="Back to links"`.
- **Color contrast:** Verify all text on all card background tints meets WCAG AA (4.5:1 for normal text, 3:1 for large text). The Notion tints are pastel — check programmatically with a contrast tool during implementation. Use `--color-text-primary` on tinted backgrounds, not the solid color.
- **`prefers-reduced-motion`:** Apply `transition: none` and `animation: none` on all animated elements when this media query is active. The `theme.svelte.ts` store exposes a reactive `reducedMotion` flag for component-level conditional logic; Svelte's built-in transitions respect the media query by default.
- **Screen reader:** Announce dynamic list changes (add, delete, filter) using an `aria-live="polite"` region off-screen.

---

## 10. Error Handling

| Scenario | Behavior |
|---|---|
| Storage write failure | Toast: *"Something didn't save. Trying again..."* Retry once after 500ms. If retry fails: *"Couldn't save that one. Try again."* No silent data loss. |
| Malformed import file | Toast: *"That file doesn't look right. No changes made."* Do not mutate any data. |
| Import with partial bad records | Skip invalid records, import valid ones. Toast: *"Imported {n} links. Skipped {m} that looked off."* |
| Invalid URL on manual entry | Inline error below the URL field: *"That doesn't look like a link."* Block submission. |
| Sync quota exceeded | Auto-fallback to local. One-time toast: *"Sync hit its limit. Links saved locally — no data lost."* Set `syncEnabled = false`. |
| Missing favicon | Render fallback: first letter of hostname, capitalized, on a small rounded rect in the link's current solid color. |
| `chrome.tabs.query` returns no active tab | Toast: *"Couldn't read the current tab. Try again."* No save attempt. |
| Context menu save on restricted page | Background service worker catches the error and does nothing (chrome:// and other restricted URLs can't be saved). |

---

## 11. Performance

- **Virtualization:** **Deferred to v2.** The MVP renders all link cards. Typical libraries (tens to a few hundred links) render without perceptible jank given the card's small DOM footprint. Revisit if real-world usage or perf profiling shows otherwise. If re-added, use `@tanstack/svelte-virtual`.
- **Search debounce:** 120ms. The search function runs synchronously on the in-memory array — no async needed for under ~5,000 links.
- **Fuzzy search implementation:** A lightweight in-house implementation (no Fuse.js dependency unless needed) — score links by whether the query appears as a substring in title and URL, ranked by position. Sufficient for MVP.
- **Settings view:** Rendered conditionally in `App.svelte` (simple `{#if view === 'settings'}` guard). Svelte's compilation model means conditional branches are only instantiated when their condition is true, so code-splitting the settings view is not necessary for MVP — the popup bundle is already small.
- **Favicon fetches:** Favicons are stored from the tab's `favIconUrl` at save time. No re-fetching after save. `favIconUrl` may be a `data:` URI or an `https://` URL; store as-is.
- **Popup open-to-interactive target:** < 150ms. Achieved by: small compiled Svelte bundle, no CDN fonts, no network requests on open, storage read on mount (async but non-blocking for initial render).
- **Storage reads:** Single read on popup mount populates the rune-based stores. All subsequent operations are in-memory + async write. No polling.
- **Bundle size target:** < 60KB gzipped for the popup bundle (excluding fonts). Track this as part of `npm run build` output.

---

## 12. Testing

### 12.1 Unit Tests

| Target | What to test |
|---|---|
| `storage/index.ts` | Read/write round-trips, migration triggers, key namespacing |
| `storage/migrations.ts` | Each migration function transforms data correctly |
| `storage/sync.ts` | Fallback from sync to local on quota error |
| `store/links.svelte.ts` | CRUD operations mutate state and persist via storage; error paths push toasts |
| `store/filters.svelte.ts` | Derived filtered list matches expected combinations (color OR, tag OR, across AND) |
| `lib/colors.ts` | All 10 colors have valid hex values for all 3 variants |
| `lib/tags.ts` | All 6 tags have required fields |
| `lib/search.ts` | Fuzzy matching: exact match, partial match, case-insensitive, no match, URL vs title |
| `lib/utils.ts` | URL validation (valid http/https, reject chrome://, ftp://, empty string) |
| Import serialization | Round-trip: export to JSON → import → same data |
| Import merge logic | Duplicates skipped; new links added |
| Import replace logic | All existing links cleared; new links set |

### 12.2 Component Tests (`@testing-library/svelte`)

| Component | States to test |
|---|---|
| `LinkCard` | Default, hover, read, pinned, no-favicon, long title truncation, all 10 colors |
| `ColorPicker` | Opens on hover, selects color, closes on outside click, keyboard navigation |
| `TagDropdown` | Opens on click, selects tag, clears tag, keyboard navigation |
| `ConfirmDialog` | Renders text, Cancel restores focus, Delete fires callback |
| `Toast` | Renders, auto-dismisses after timeout, Undo fires callback |
| `SearchBar` | Input triggers search, clear button appears/disappears, debounce |
| `EmptyState` | Renders for empty list, renders for empty search results |

### 12.3 Manual QA Checklist

| Flow | Steps |
|---|---|
| First use | Install extension, open popup → empty state visible |
| Save current tab | Click `+` → card appears, toast shown |
| Save duplicate | Click `+` on already-saved tab → duplicate toast, no new card |
| Manual add | Click `▾`, fill form, submit → card appears |
| Invalid URL | Enter `not-a-url` in manual form → inline error, no submit |
| Recolor | Hover dot, select color → dot and card bg update, persists on popup reopen |
| Tag | Click tag icon, select tag → pill renders, persists |
| Clear tag | Click pill → dropdown → "No tag" → tag clears |
| Delete | Click `×` → confirmation → Delete → card gone, toast with Undo |
| Undo delete | Delete → Undo within 5s → card restored at same position |
| Mark as read | Trigger read toggle → card dims, footer count updates |
| Search | Type in search → list filters live, clear button appears |
| Filter by color | Click color chip in filter row → list filtered |
| Filter by tag | Click tag chip in filter row → list filtered |
| Settings open/close | Gear → settings view, ← → list, slide animation |
| Export JSON | Export → download file → valid JSON parseable |
| Export Markdown | Export → download file → valid Markdown |
| Export HTML | Export → download file → Chrome bookmarks import works |
| Import JSON (merge) | Import a JSON file → links added, duplicates skipped |
| Import JSON (replace) | Import with Replace → all previous links gone |
| Import bad file | Import a malformed JSON → error toast, no data change |
| Dark mode | Toggle dark → all colors switch correctly |
| System dark | Set theme to System, OS in dark mode → popup is dark |
| Sort order | Change sort → list reorders immediately |
| Sync toggle | Enable sync → data moves to sync storage |
| Badge count | Save links → badge updates; disable badge → badge cleared |
| Keyboard nav | Tab to card → ↑↓ navigate → Enter opens link → Delete triggers confirm |
| Context menu | Right-click a link on a page → "Save to Important Soonish Links" → card saved |
| Keyboard shortcut | Press `Cmd/Ctrl+Shift+L` → popup opens |
| Reduced motion | Enable OS reduced-motion → no animations on color picker expand, settings slide, toasts |

---

## 13. Build & Packaging

### 13.1 Scripts

```json
{
  "scripts": {
    "dev":       "vite dev",
    "build":     "svelte-check && vite build",
    "package":   "npm run build && cd dist && zip -r ../important-soonish-links.zip . && cd ..",
    "test":      "vitest",
    "typecheck": "svelte-check && tsc --noEmit"
  }
}
```

- `npm run dev` — starts Vite with HMR; load `dist/` as an unpacked extension in `chrome://extensions`.
- `npm run build` — runs `svelte-check` for template type-safety, then produces `dist/` ready to load as unpacked extension.
- `npm run package` — produces `important-soonish-links.zip` for Chrome Web Store submission.
- `npm run typecheck` — template + TS check, run in CI on every PR.

### 13.2 Vite Configuration

```ts
// vite.config.ts
import { defineConfig } from "vite";
import { svelte } from "@sveltejs/vite-plugin-svelte";
import { crx } from "@crxjs/vite-plugin";
import manifest from "./manifest.json";

export default defineConfig({
  plugins: [svelte(), crx({ manifest })],
  build: {
    outDir: "dist",
    emptyOutDir: true,
  },
});
```

### 13.3 Svelte Configuration

```js
// svelte.config.js
import { vitePreprocess } from "@sveltejs/vite-plugin-svelte";

export default {
  preprocess: vitePreprocess(),
  compilerOptions: {
    runes: true, // Opt into Svelte 5 runes mode project-wide
  },
};
```

### 13.4 TypeScript Configuration

Strict mode enabled. `target: "ES2022"`, `module: "ESNext"`, `lib: ["DOM", "ES2022"]`. Ensure `"moduleResolution": "bundler"` and include Svelte's generated type shims if needed.

---

## 14. User Flows

### 14.1 First Use

1. User installs extension from Chrome Web Store (or loads unpacked).
2. Clicks the extension icon in the toolbar.
3. Popup opens to the main panel.
4. Link list is empty — empty state renders: *"No links saved yet. Past-you has some work to do."*
5. User clicks `+` — current tab is saved. Toast: *"Saved. For soonish."* List shows first card.

### 14.2 Saving a Link

1. User is on a webpage they want to save.
2. Clicks `+` (or presses `Cmd/Ctrl+Shift+L` to open popup, then clicks `+`).
3. Popup captures `title`, `url`, `favIconUrl` from active tab.
4. Duplicate check passes → link saved to storage → card appears at top of list.
5. Toast: *"Saved. For soonish."* dismisses after 2.5 seconds.

**Variant: right-click save**
1. User right-clicks a hyperlink on any page.
2. Selects "Save to Important Soonish Links" from context menu.
3. Service worker saves the link (title from link text or page title, URL from href).
4. (Popup is not necessarily open; no toast visible — silent save via background.)

**Variant: manual entry**
1. User clicks the `▾` caret next to `+`.
2. Inline form appears: Title (pre-filled from current tab), URL (pre-filled).
3. User edits fields. Submits.
4. Same save + toast flow as above.

### 14.3 Recoloring a Link

1. User hovers over the colored dot on a card.
2. Color picker strip expands (10 swatches, 150ms).
3. User clicks a swatch (or navigates with arrow keys + Enter).
4. Dot color updates, card background tint updates (150ms ease-out).
5. Change persists to storage.

### 14.4 Tagging a Link

1. User clicks the tag icon (or existing tag pill) on a card.
2. Tag dropdown appears below (6 tags + "No tag" option).
3. User clicks a tag.
4. Dropdown closes. Tag pill renders on the card.
5. Change persists to storage.

### 14.5 Deleting a Link (with Undo)

1. User hovers a card — `×` button becomes visible.
2. User clicks `×`.
3. Confirmation modal appears: *"Delete this link? Past-you won't mind."*
4. User clicks **Delete**.
5. Modal closes. Card is removed. Toast appears: *"Link removed."* with an **Undo** button.
6. If user clicks **Undo** within 5 seconds: card is restored at original position, toast dismisses.
7. If 5 seconds elapse: deletion is permanent.

### 14.6 Searching

1. User types in the search bar.
2. After 120ms debounce, list filters to cards where query matches title or URL (fuzzy, case-insensitive).
3. Clear `×` appears inside the search bar.
4. User clicks `×` (or clears input) — list returns to full view.
5. If no results: *"Nothing matches. Past-you may have called it something else."*

### 14.7 Filtering by Color / Tag

1. User clicks a color chip in the filter row.
2. List immediately filters to cards of that color.
3. User can click additional chips (OR logic within the same type).
4. Color and tag filters are AND'd if both are active.
5. Clicking an active chip deselects it. All chips inactive = no filter.

### 14.8 Importing Links

1. User opens Settings → Import.
2. Clicks the file picker — selects a `.json` file.
3. Merge / Replace prompt appears.
4. User selects Merge → links added, duplicates skipped. Toast: *"Links imported. Welcome home."*
5. User selects Replace → all existing links cleared, new links set. Toast: *"Fresh start. They're all here."*
6. If file is malformed → toast: *"That file doesn't look right. No changes made."*

### 14.9 Exporting Links

1. User opens Settings → Export.
2. Clicks desired format (JSON / Markdown / HTML).
3. Browser triggers a file download (via `URL.createObjectURL` + anchor click).
4. File saved to user's Downloads folder.

### 14.10 Marking as Read

1. User hovers a card — read toggle appears (checkmark or "✓ Mark read").
2. User clicks it.
3. Card dims (opacity 0.6), moves to bottom of list.
4. Footer count updates: `{n} links · {m+1} read`.
5. User can click the toggle again on the dimmed card to mark as unread.

---

## 15. Microcopy Reference

All user-facing strings are defined in `src/lib/copy.ts` as a typed constant object. No hardcoded strings in components.

```ts
// src/lib/copy.ts (excerpt — exhaustive list below)

export const COPY = {
  // Toasts
  SAVED:                  "Saved. For soonish.",
  ALREADY_SAVED:          "Already saved. Past-you was on top of things.",
  SAVE_FAILED:            "Couldn't save that one. Try again.",
  SAVE_INVALID_URL:       "That one's not saveable. Past-you tried.",
  DELETED:                "Link removed.",
  UNDO:                   "Undo",
  MARKED_READ:            "Marked as read. Look at you.",
  MARKED_UNREAD:          "Back in the pile.",
  IMPORT_SUCCESS:         "Links imported. Welcome home.",
  IMPORT_REPLACE_SUCCESS: "Fresh start. They're all here.",
  IMPORT_PARTIAL:         "Imported {n} links. Skipped {m} that looked off.",
  IMPORT_ERROR:           "That file doesn't look right. No changes made.",
  EXPORT_DONE:            "Your links are backed up.",
  SYNC_QUOTA_EXCEEDED:    "Sync hit its limit. Links saved locally — no data lost.",
  STORAGE_WRITE_RETRY:    "Something didn't save. Trying again...",
  STORAGE_WRITE_FAILED:   "Couldn't save that one. Try again.",
  TAB_QUERY_FAILED:       "Couldn't read the current tab. Try again.",
  RESET_DONE:             "All clear. Soonish starts fresh.",

  // Empty states
  EMPTY_LIST:             "No links saved yet. Past-you has some work to do.",
  EMPTY_SEARCH:           "Nothing matches. Past-you may have called it something else.",

  // Confirm dialogs
  DELETE_CONFIRM_TITLE:   "Delete this link?",
  DELETE_CONFIRM_BODY:    "Past-you won't mind.",
  DELETE_CANCEL:          "Cancel",
  DELETE_ACTION:          "Delete",
  RESET_CONFIRM_TITLE:    "Clear everything?",
  RESET_CONFIRM_BODY:     "Past-you will be upset. Future-you might not mind.",
  RESET_CANCEL:           "Cancel",
  RESET_ACTION:           "Clear everything",

  // Import prompt
  IMPORT_MERGE:           "Merge with existing links",
  IMPORT_REPLACE:         "Replace everything",
  IMPORT_MERGE_DESC:      "Adds new links. Duplicates are skipped.",
  IMPORT_REPLACE_DESC:    "Clears current links. Can't be undone.",

  // Settings labels
  SETTINGS_EXPORT:        "Export",
  SETTINGS_EXPORT_DESC:   "Back them up. Just in case.",
  SETTINGS_IMPORT:        "Import",
  SETTINGS_IMPORT_DESC:   "Bring your links home.",
  SETTINGS_APPEARANCE:    "Appearance",
  SETTINGS_SORT:          "Sort order",
  SETTINGS_SYNC:          "Sync across Chrome installs",
  SETTINGS_SYNC_DESC:     "Uses Chrome's built-in sync. Your links stay yours — no servers involved.",
  SETTINGS_BADGE:         "Show link count on icon",
  SETTINGS_RESET:         "Reset",
  SETTINGS_RESET_BTN:     "Start fresh",
  SETTINGS_ABOUT:         "About",
  ABOUT_TAGLINE:          "A calm home for links. Soonish.",

  // Form
  ADD_TITLE_PLACEHOLDER:  "Title",
  ADD_URL_PLACEHOLDER:    "URL",
  ADD_URL_ERROR:          "That doesn't look like a link.",
  ADD_SAVE:               "Save",
  ADD_CANCEL:             "Cancel",

  // Search
  SEARCH_PLACEHOLDER:     "Find something past-you saved...",

  // Footer
  FOOTER_COUNT:           "{n} links · {m} read",
  FOOTER_COUNT_NONE:      "0 links",
} as const;
```

---

## 16. Open Questions

The following items are genuinely ambiguous and should be resolved before full implementation. Proceeding with the documented defaults is acceptable for a prototype.

1. **Delete flow: Pattern A vs B.**
   This spec defaults to Pattern A (confirmation dialog + undo toast). Pattern B (drop the dialog; rely solely on the undo toast) is the modern standard (Gmail, iOS). It is cleaner and faster. Consider switching to B after an initial usability test — the dialog adds friction for a recoverable action.

2. **User-editable tags in v2.**
   The fixed-set approach is recommended for MVP. For v2, the question is whether the tag list is stored in settings (user can rename/recolor/add/remove) or hardcoded. Recommendation: store tags in settings as a `Tag[]` alongside `AppSettings`; pre-populate with defaults on first run. This is additive and non-breaking.

3. **Font licensing verification.**
   Instrument Serif, Inter, and JetBrains Mono are all published under OFL 1.1, which permits bundling and redistribution. Verify current license status of each before Chrome Web Store submission. OFL fonts cannot be sold standalone but redistribution as part of an application is permitted.

4. **Badge counter default: on or off.**
   This spec defaults to **on**. Some users find badge counts on browser icons visually noisy. Consider defaulting to off if user research suggests this.

5. **Context menu: save link text vs page title for right-click-on-link saves.**
   When the user right-clicks a hyperlink (not the page), the "title" to save is ambiguous: it could be the link's visible text, the page title of the linked page (unknown without a fetch), or the hostname. Recommendation: use the link's anchor text if non-empty, otherwise fall back to the hostname. Document this behavior in the README.

6. **Mark-as-read card treatment: bottom of list vs collapsed section.**
   This spec recommends moving read cards to the bottom. An alternative is a collapsible "Read" section below the unread list, which provides clearer visual separation. Revisit after seeing the design in practice.

7. **Minimum Chrome version.**
   MV3 requires Chrome 88+; `@crxjs/vite-plugin` and the storage APIs used here work on Chrome 96+. Set `minimum_chrome_version: "96"` in manifest.json or higher if specific APIs require it. Verify before submission.

8. **Colors TS constant vs CSS tokens — two sources of truth.**
   The Notion palette is expressed in both `src/lib/colors.ts` (for code that needs to read hex values) and `src/styles/tokens.css` (for CSS consumption). Keeping these in sync is a maintenance cost. Options: (a) treat TS as authoritative and write a small codegen script that emits `tokens.css`, (b) treat CSS as authoritative and read `getComputedStyle(document.documentElement)` in TS at runtime, (c) accept the duplication and guard with a unit test that compares them. Recommendation: (a) if the palette grows; (c) for MVP.

9. **Virtualization threshold.**
   Deferred to v2. If re-added, measure before choosing a threshold — the original 150-item number is a guess. Profile against a realistic synthetic library (5k links) before committing.

---

## 17. Constraints

- **No external services.** No backends, no APIs, no CDNs. Everything runs locally within the extension.
- **No paid APIs or licensed libraries.** All dependencies must be open source with permissive licenses (MIT, ISC, Apache 2.0, OFL, BSD).
- **No analytics, telemetry, or tracking.** The extension does not phone home under any circumstance.
- **No data leaves the extension** except via user-initiated export or `chrome.storage.sync` (when the user explicitly enables sync).
- **No host permissions.** The manifest must not declare `<all_urls>` or any host permission pattern.
- **`chrome.storage.sync` only for cross-device sync** — no third-party sync service.
- **Simplicity over feature sprawl.** A smaller set of features executed with polish beats a long list executed poorly. When in doubt, exclude.
- **Respect user data.** No guessing at user intent. No auto-deletions. Mutations are always reversible or confirmed.
- **Bundle discipline.** Popup bundle under 60KB gzipped (excl. fonts). Every new dependency must justify its weight. Prefer platform primitives and Svelte built-ins over libraries.
