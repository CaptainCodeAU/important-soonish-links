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
  | "recent"
  | "oldest"
  | "alphabetical"
  | "color"
  | "tag";

export type SyncMode = "links-only" | "everything";

export interface SavedLink {
  id: string;
  title: string;
  url: string;
  favicon?: string;
  description?: string;
  color: ColorId;
  tag?: TagId;
  pinned?: boolean;
  notes?: string;
  isRead?: boolean;
  order: number;
  createdAt: number;
  updatedAt: number;
}

export interface AppSettings {
  schemaVersion: number;
  theme: "light" | "dark" | "system";
  sortOrder: SortOrder;
  syncEnabled: boolean;
  syncMode: SyncMode;
  showBadgeCount: boolean;
}

export interface Tag {
  id: TagId;
  label: string;
  accentColor: ColorId;
}

export interface StorageData {
  links: SavedLink[];
  settings: AppSettings;
}

export const DEFAULT_SETTINGS: AppSettings = {
  schemaVersion: 1,
  theme: "system",
  sortOrder: "recent",
  syncEnabled: false,
  syncMode: "links-only",
  showBadgeCount: true,
};

export const DEFAULT_LINK_COLOR: ColorId = "default";

export const COLOR_IDS: ColorId[] = [
  "default", "gray", "brown", "orange", "yellow",
  "green", "blue", "purple", "pink", "red",
];

export const TAG_IDS: TagId[] = [
  "read-later", "reference", "inspiration",
  "watch-later", "work", "personal",
];
