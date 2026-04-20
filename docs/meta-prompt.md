# Meta-Prompt: Generate `SPEC.md` for a Chrome Extension

You are tasked with creating a comprehensive, engineering-grade `SPEC.md` file for a Chrome browser extension. This spec will be handed directly to an implementation agent, so it must be detailed, unambiguous, and technically complete. Make sensible decisions and document them as assumptions rather than asking clarifying questions. At the end of the spec, include a short "Open Questions" section for anything genuinely ambiguous.

---

## Project Identity

**App Name:** Important Soonish Links
**Repo / Folder Name:** `important-soonish-links`
**Description (use this verbatim — it is the product's voice):**

> A chrome extension for saving important links you absolutely intend to read. Past-you had plans. The works. Present-you is lost in a rabbit hole about something else entirely. Not today. Definitely not today. Right after this one other thing. And after those tabs are dealt with. Soonish. That much is certain.

### Voice & Tone Notes

The description above is the product's voice. It is **ADHD-aware, self-aware, warm, and quietly funny**. The humor is affectionate, not shaming — it's laughing *with* the user, not at them. Where the extension has copy (empty states, toast messages, settings labels, confirm dialogs, onboarding, etc.), it should carry this same tone — dry, forgiving, lightly absurd, never preachy, never "productivity guru." The product is a gentle home for links, not a to-do list with deadlines.

Examples of on-voice microcopy the spec should suggest (and you should expand on):

- Empty state: *"No links saved yet. Past-you has some work to do."*
- Add confirmation toast: *"Saved. For soonish."*
- Delete confirm: *"Delete this link? Past-you won't mind."*
- Duplicate link warning: *"Already saved. Past-you was on top of things."*
- Settings → Import: *"Bring your links home."*
- Settings → Export: *"Back them up. Just in case."*

Claude Code should generate additional on-voice microcopy throughout. Err toward restraint — one good line beats five clever ones.

---

## Project Overview

Build a Chrome browser extension called **Important Soonish Links** that lets users save, organize, color-tag, category-tag, and search links from any webpage. The extension must feel **premium and considered** — thoughtful typography, smooth micro-interactions, and visual polish are as important as the functionality. It is a calm, low-pressure space — the anti-productivity-app.

---

## Core Requirements

### 1. Extension Entry Point

- A browser action icon in the Chrome toolbar.
- Clicking the icon opens a **dropdown popup panel** (not a new tab, not a side panel by default — a popup anchored to the toolbar icon).
- The popup has a fixed, well-considered width (~360–400px) and a reasonable max height (~560–600px) with internal scrolling for the link list.

### 2. Main Popup Panel Layout (top to bottom)

- **Header row**:
  - A `+` button on one side (adds the current tab — see §5).
  - A settings (gear) icon on the other side (opens the settings view — see §9).
  - The extension name/wordmark in the header (small, elegant, set in the chosen display typeface).
- **Search bar**: live, fuzzy, case-insensitive search that filters the list in real time by **title AND URL**. Debounce input (~120ms). Include a small clear (×) button inside the input when it has content.
- **Link list**: vertically scrollable list of saved link cards (see §3). Below the list, show a subtle count (e.g., "12 links, 0 read").

### 3. Link Card Anatomy

Each card is **narrow**, visually light, and contains (in layout order from left to right, roughly):

- A small **colored dot** (tag color indicator — see §4).
- A small **tag icon** immediately next to the colored dot (category tag — see §6).
- Primary content (takes most of the width):
  - **Page title** as the primary text (clickable — opens in a new tab in background by default; modifier-click for foreground).
  - **URL or hostname** on the line beneath the title, smaller and muted.
  - Optional: favicon to the left of the title (small, 16px).
- A small **cross (×) button** on the far right (delete — see §7).

Cards have rounded corners, subtle shadow on hover, and a background color that reflects the selected color tag (see §4). Clicking anywhere on the card body (outside the dot, tag, or × button) opens the link.

### 4. Color Dot → Color Picker Interaction

- **Hovering** the colored dot expands it into a small horizontal strip (or compact grid) of **tiny colored boxes** representing the full palette.
- The palette uses **Notion's exact color set** — the nine standard colors Notion exposes for blocks and tags:
  **Default (neutral gray), Gray, Brown, Orange, Yellow, Green, Blue, Purple, Pink, Red** (10 colors total including Default).
- Spec the **exact hex values** for three variants of each color:
  - **Solid** (used for the dot itself) — Notion's solid text/icon color
  - **Light-mode background tint** (used as card background) — Notion's soft pastel block background
  - **Dark-mode background tint** (used as card background in dark mode) — Notion's dark-mode block background
- Document these as a single source of truth in a `colors.ts` or equivalent constants file. Look up Notion's actual published palette and match it precisely.
- **Clicking** a color swatch:
  - Changes the dot's color.
  - Changes the card's background to the matching tint.
  - Persists the choice.
  - Animates smoothly (~150–200ms ease-out).
- The expansion and collapse of the color strip should be animated. Respect `prefers-reduced-motion`.
- Include a "no color" / default option that uses the neutral card background.

### 5. `+` Button Behavior (Quick Add)

- Clicking the `+` button **saves the current active tab** (title, URL, favicon captured automatically via `chrome.tabs.query({ active: true, currentWindow: true })`).
- The action is **instant** — no modal or form interruption. Show a subtle, auto-dismissing toast: *"Saved. For soonish."*
- If the URL already exists in the list, **do not create a duplicate**. Show a non-blocking toast instead: *"Already saved. Past-you was on top of things."*
- **Secondary behavior:** a small caret/dropdown next to the `+` button (or a long-press/right-click affordance — recommend the cleanest pattern in the spec) reveals a **manual-entry form** for adding a custom link (title + URL). This is a secondary action; the primary action remains one-click save.
- Reject invalid URLs gracefully with an on-voice toast.

### 6. Tag System (Categories)

Tags are **semantic categories**, distinct from and complementary to colors (which are personal visual organization).

- A small **tag icon** (outline style — e.g., Lucide's `Tag` icon) sits on each card, immediately next to the colored dot.
- Clicking the tag icon opens a **small dropdown list** of **6 predefined tags**.
- Proposed default tag set (finalize in spec with rationale):
  1. **Read later** — long reads, articles
  2. **Reference** — docs, technical resources
  3. **Inspiration** — design, creative, moodboard-ish
  4. **Watch later** — video content
  5. **Work** — job-related
  6. **Personal** — personal interests, hobbies
- Selecting a tag:
  - Replaces the tag-icon position on the card with the **chosen tag rendered as a small, aesthetically pleasing pill/chip**.
  - Persists to the link's data model.
- The tag chip must look **inviting and small**:
  - Fully rounded (pill shape).
  - Compact padding (~4px vertical, ~8px horizontal).
  - Small font size (~11–12px), medium weight.
  - Subtle background tint with slightly deeper text of the same hue, or a soft neutral.
  - Optional tiny icon or dot prefix — use judgment.
- Each of the 6 tags has its own distinct accent color, **drawn from the Notion palette but chosen to not collide visually with the user's color-dot selection**. Document the chosen tag colors.
- **Clicking an already-applied tag chip** re-opens the dropdown (allowing change or clear). Include a **"No tag"** / clear option in the dropdown.
- **For MVP**, tags are fixed. For v2, consider making them user-editable (rename, recolor, add/remove) — recommend yes for v2 and justify.
- **Filter by tag** in the main view (alongside filter by color — see Additional Features).

Document clearly in the spec that **colors = visual/personal organization** and **tags = semantic categorization**. Both coexist on a card without conflict.

### 7. Delete Flow

- Clicking the `×` button triggers a **confirmation dialog** (modal within the popup, not a separate window).
- Dialog text (on-voice): *"Delete this link? Past-you won't mind."*
- Actions: **Cancel** (neutral) and **Delete** (red/destructive).
- After deletion, show a toast with an **Undo** action (~5 second window). Undo restores the exact card including its color and tag.
- **Recommendation to make in spec:** the confirmation dialog plus undo toast is slightly redundant. Recommend one of two patterns:
  - **(A)** Keep both — confirmation for intentional deletes, undo as a safety net.
  - **(B)** Drop the dialog entirely and rely on the undo toast — faster flow, standard modern pattern (Gmail, iOS).
  - The user (in conversation) asked for the dialog, so **default to (A)** but call out (B) as a viable alternative in the spec's "Open Questions" section.

### 8. Settings Panel

- Clicking the gear icon transitions the popup into a **settings view** (same window, slide or fade transition, not a new window). Include a back arrow to return to the main list.
- Settings include:
  - **Export** — download all saved links as a JSON file. Also offer Markdown and HTML bookmark-file exports (HTML should be compatible with Chrome's bookmark import format).
  - **Import** — upload a JSON file. Prompt the user: *"Merge with existing links"* or *"Replace existing links"* (default: merge, with duplicate detection by URL).
  - **Appearance** — light / dark / system (auto based on `prefers-color-scheme`). Default: system.
  - **Sort order** — Recently added (default), Oldest first, Alphabetical, By color, By tag.
  - **Reset** — clear all data. Behind a confirmation dialog with an on-voice warning.
  - **About** — version number, link to GitHub repo, one-line on-voice tagline.

### 9. Visual Design & Typography

- The UI must look **pleasing, modern, and considered** — not generic, not "AI-app default."
- **Typography** — use **custom web fonts bundled with the extension**. Do NOT use Google Fonts CDN at runtime (Chrome extension CSP and offline behavior make runtime font loading fragile). Bundle the font files in `/assets/fonts` and load them via `@font-face` with local paths.
  - **Recommended primary pairing** (justify in spec, suggest alternates):
    - **Display/Wordmark**: **Instrument Serif** (warm, slightly literary, pairs well with the product's tone)
    - **UI/Body**: **Inter** (clean, neutral, excellent at small sizes)
    - **Optional accent / numerics**: **JetBrains Mono** for URLs or metadata
  - Alternate pairing to mention: **Geist** (UI) + **Fraunces** (display).
  - License check: ensure chosen fonts are OFL or similarly permissive for bundling and redistribution.
- **Dark/light mode** — design both, using `prefers-color-scheme`. Settings allow override.
- **Spacing** — 4px or 8px grid. Generous whitespace. Don't crowd the cards.
- **Shapes** — rounded corners (suggest 8px for cards, 6px for buttons, fully rounded for pills/dots).
- **Shadows** — subtle, soft, low-opacity. Used sparingly (hover on cards, the settings sheet, dialogs).
- **Micro-interactions** — every interactive element has a hover state, a pressed state, and a smooth transition. Respect `prefers-reduced-motion`.
- **Empty state** — a friendly, on-voice message (see Voice section) and optionally a small, tasteful illustration or ornament. Do not use stock clip-art.

---

## Suggested Additional Features

Evaluate each and mark in the spec as **Included (MVP)**, **Included (v2)**, or **Considered but excluded** with a one-line rationale.

1. **Keyboard shortcut** to open the popup (default `Cmd/Ctrl+Shift+L`, user-configurable via Chrome shortcuts page).
2. **Right-click context menu** on pages and links: *"Save to Important Soonish Links."*
3. **Auto-capture metadata**: page title, favicon, `<meta name="description">`, Open Graph tags. Store description as optional preview text.
4. **Drag-to-reorder** within the list. Persists order.
5. **Sort options** (exposed in settings — see §8).
6. **Filter by color** — a filter row of color chips above the list; clicking filters. Multi-select.
7. **Filter by tag** — same pattern, tag chips.
8. **Pin / favorite** important links to the top. Small pin icon on each card.
9. **Notes field** on each link (expandable on card click or via a small edit affordance). Optional, free text, small character limit.
10. **Bulk actions** — multi-select mode for delete, recolor, retag.
11. **Duplicate detection** on add (see §5).
12. **Sync via `chrome.storage.sync`** — so links follow the user across Chrome installs. Fall back to `chrome.storage.local` when sync quota is exceeded (detail the quota handling strategy — sync has per-item and total size limits). Make sync optional, togglable in settings.
13. **Export formats** (see §8): JSON, Markdown, HTML.
14. **Empty state** (see §9).
15. **Toast notifications** — subtle, auto-dismissing, on-voice.
16. **Undo after delete** (see §7).
17. **Open-all-in-tabs** action for the current filtered view (with a sensible confirmation if >10 tabs).
18. **Badge counter** on the extension icon showing total saved links. Respect user preference to disable.
19. **"Mark as read" / archive** — a toggle state (separate from delete) that moves a link to a read archive. Preserves the user's history and gives them dopamine for actually reading things. Include read count in the settings/about area. **Strong recommendation for MVP.**
20. **Reading time estimate** on cards (fetched when available via metadata, otherwise calculated). *Optional, v2.*

---

## Technical Requirements

The `SPEC.md` must cover:

### Manifest & Permissions

- **Manifest V3** (required).
- List minimum required permissions with per-permission justification:
  - `storage` — saving links
  - `activeTab` — reading current tab info on `+` click
  - `tabs` — required for `chrome.tabs.query` in popup context
  - `contextMenus` — for right-click save (if included)
  - Host permissions — none, ideally. Avoid `<all_urls>`.
- Keep permissions minimal. Justify every one.

### Tech Stack

Recommend **React + TypeScript + Vite** with the `@crxjs/vite-plugin` for Chrome extension development. Justification:

- The interaction complexity (color picker expansion, tag dropdown, view transitions between list and settings, drag-to-reorder, multi-select, toasts) is enough to warrant React over vanilla.
- Vite + crxjs gives fast HMR for extension development, which vanilla Chrome extension workflows lack.
- TypeScript for the data model, storage layer, and color/tag constants.

Styling: **Tailwind CSS** with a custom theme configured from the Notion palette, OR **CSS Modules** with CSS custom properties. Recommend Tailwind for velocity, with the palette defined as CSS variables so it's accessible outside Tailwind too.

State: **Zustand** or React Context + reducer. Recommend Zustand for simplicity.

### File & Folder Structure

Provide a full tree with every file's purpose explained. Something like:

```
important-soonish-links/
├── public/
│   ├── icons/            # 16/32/48/128 extension icons
│   └── assets/fonts/     # bundled font files
├── src/
│   ├── popup/            # popup entry
│   │   ├── index.html
│   │   ├── main.tsx
│   │   └── App.tsx
│   ├── background/       # service worker
│   │   └── index.ts
│   ├── components/       # React components
│   │   ├── LinkCard.tsx
│   │   ├── LinkList.tsx
│   │   ├── ColorPicker.tsx
│   │   ├── TagDropdown.tsx
│   │   ├── SearchBar.tsx
│   │   ├── ConfirmDialog.tsx
│   │   ├── Toast.tsx
│   │   ├── SettingsView.tsx
│   │   └── ...
│   ├── hooks/
│   ├── store/            # Zustand store
│   ├── storage/          # chrome.storage wrapper + migrations
│   ├── lib/
│   │   ├── colors.ts     # Notion palette constants
│   │   ├── tags.ts       # default tag definitions
│   │   └── copy.ts       # on-voice microcopy constants
│   ├── types/
│   └── styles/
├── manifest.json
├── vite.config.ts
├── tailwind.config.ts
├── tsconfig.json
├── package.json
└── README.md
```

### Data Model

Provide full TypeScript interfaces:

```ts
type ColorId =
  | "default" | "gray" | "brown" | "orange" | "yellow"
  | "green" | "blue" | "purple" | "pink" | "red";

type TagId =
  | "read-later" | "reference" | "inspiration"
  | "watch-later" | "work" | "personal";

interface SavedLink {
  id: string;              // uuid
  title: string;
  url: string;
  favicon?: string;
  description?: string;    // from OG tags
  color: ColorId;          // default "default"
  tag?: TagId;             // optional
  pinned?: boolean;
  notes?: string;
  isRead?: boolean;        // archive/read state
  order: number;           // for drag-to-reorder
  createdAt: number;       // epoch ms
  updatedAt: number;
}

interface AppSettings {
  schemaVersion: number;
  theme: "light" | "dark" | "system";
  sortOrder: "recent" | "oldest" | "alphabetical" | "color" | "tag";
  syncEnabled: boolean;
  showBadgeCount: boolean;
  // ...
}

interface Tag {
  id: TagId;
  label: string;
  accentColor: ColorId;
}
```

### Storage Strategy

- Read/write through a single abstracted storage layer (not scattered `chrome.storage.*` calls).
- Include a `schemaVersion` and a migration plan. Spec the migration function signature and how migrations run on extension startup.
- Handle `chrome.storage.sync` quota failures with automatic fallback to `local`, surfaced to the user via a one-time non-blocking notice.

### Color System (Single Source of Truth)

Ship a `colors.ts` with the exact Notion palette. Hex values for:

- Dot color (solid)
- Card background — light mode
- Card background — dark mode
- Text color for the color name (used in color picker tooltips)

Notion's palette is publicly observable; match it precisely. Document the source (Notion's design system or Notion app CSS inspection) in a comment.

### Accessibility

- Full keyboard navigation through the list (arrow keys to move between cards, Enter to open, Delete key to delete with confirm, etc.).
- Visible focus rings on all interactive elements.
- ARIA roles and labels for the color picker (treat as a radiogroup), tag dropdown (combobox or menu), confirm dialog (alertdialog), and toasts (status/alert).
- Color contrast must meet WCAG AA for text on all card background tints in both light and dark modes — verify during implementation.
- Respect `prefers-reduced-motion` — all transitions must have a reduced-motion variant.

### Error Handling

- Storage write failures → user-facing toast + retry.
- Malformed import files → clear error message, no data mutation.
- Invalid URLs → rejected with on-voice toast.
- Sync quota exceeded → automatic local fallback + one-time notice.
- Missing favicon → graceful fallback (neutral globe icon or the first letter of the hostname in the link's color).

### Performance

- Virtualize the list when it exceeds ~150 items (recommend `react-virtuoso` or `@tanstack/react-virtual`).
- Debounce search input.
- Lazy-load the settings view.
- Favicon fetches should be non-blocking.
- Target popup open-to-interactive under 150ms.

### Testing

- **Unit tests**: storage layer, migrations, color/tag logic, search/filter, import/export serialization.
- **Component tests**: LinkCard (all states), ColorPicker, TagDropdown, ConfirmDialog.
- **Manual QA checklist**: covering every user flow (save, tag, recolor, delete, undo, search, filter, import, export, sync, light/dark, keyboard nav).
- Recommend Vitest + React Testing Library.

### Build & Packaging

- `npm run dev` for HMR development with unpacked extension loading.
- `npm run build` produces a `dist/` folder ready to load as an unpacked extension.
- `npm run package` produces a `.zip` ready for Chrome Web Store submission.
- Include a `README.md` with setup instructions, how to load unpacked for dev, and how to build.

---

## Deliverable

Produce a single `SPEC.md` file with:

- Clear, hierarchical sectioning (use heading levels thoughtfully).
- Code blocks for all interfaces, data shapes, and color constants.
- A "Design System" section consolidating the palette, typography, spacing, and motion tokens.
- A "User Flows" section walking through: first use, saving a link, recoloring, tagging, deleting with undo, searching, importing, exporting.
- A "Microcopy Reference" section cataloguing every piece of UI copy in one place, on-voice.
- An "Open Questions" section at the end listing ambiguities the human should resolve before full implementation.

Keep the tone of the spec itself **precise and engineering-focused** — no marketing language. The product's playful voice lives in the microcopy section and in user-facing strings, not in the spec prose.

---

## Constraints

- No third-party services. No backends. Everything runs locally in the extension. Sync uses `chrome.storage.sync` only.
- No paid APIs or licensed libraries.
- No ads, no analytics, no telemetry. The extension does not phone home.
- Favor simplicity and polish over feature sprawl — a smaller set of features executed beautifully beats a long list executed poorly.
- Respect user data: no data leaves the extension except via user-initiated export or `chrome.storage.sync`.
