function fmt(template: string, vars: Record<string, number | string>): string {
  return template.replace(/\{(\w+)\}/g, (_, k) => String(vars[k] ?? ""));
}

export const COPY = {
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

  EMPTY_LIST:             "No links saved yet. Past-you has some work to do.",
  EMPTY_SEARCH:           "Nothing matches. Past-you may have called it something else.",

  DELETE_CONFIRM_TITLE:   "Delete this link?",
  DELETE_CONFIRM_BODY:    "Past-you won't mind.",
  DELETE_CANCEL:          "Cancel",
  DELETE_ACTION:          "Delete",
  RESET_CONFIRM_TITLE:    "Clear everything?",
  RESET_CONFIRM_BODY:     "Past-you will be upset. Future-you might not mind.",
  RESET_CANCEL:           "Cancel",
  RESET_ACTION:           "Clear everything",

  IMPORT_MERGE:           "Merge with existing links",
  IMPORT_REPLACE:         "Replace everything",
  IMPORT_MERGE_DESC:      "Adds new links. Duplicates are skipped.",
  IMPORT_REPLACE_DESC:    "Clears current links. Can't be undone.",

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

  ADD_TITLE_PLACEHOLDER:  "Title",
  ADD_URL_PLACEHOLDER:    "URL",
  ADD_URL_ERROR:          "That doesn't look like a link.",
  ADD_SAVE:               "Save",
  ADD_CANCEL:             "Cancel",

  SEARCH_PLACEHOLDER:     "Find something past-you saved...",

  FOOTER_COUNT:           "{n} links · {m} read",
  FOOTER_COUNT_NONE:      "0 links",
} as const;

export { fmt };
