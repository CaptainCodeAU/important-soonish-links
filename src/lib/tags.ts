import type { Tag, TagId } from "../types";

export const DEFAULT_TAGS: Tag[] = [
  { id: "read-later",  label: "Read later",   accentColor: "blue"   },
  { id: "reference",   label: "Reference",    accentColor: "gray"   },
  { id: "inspiration", label: "Inspiration",  accentColor: "pink"   },
  { id: "watch-later", label: "Watch later",  accentColor: "purple" },
  { id: "work",        label: "Work",         accentColor: "orange" },
  { id: "personal",    label: "Personal",     accentColor: "green"  },
];

export const TAG_MAP: Record<TagId, Tag> = Object.fromEntries(
  DEFAULT_TAGS.map(t => [t.id, t])
) as Record<TagId, Tag>;
