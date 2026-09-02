import { readSettings, readLinks, writeLinks } from "../storage";
import { validateUrl, containsUrl } from "../lib/utils";
import { createLink } from "../lib/link";
import type { SavedLink } from "../types";

chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: "save-to-isl",
    title: "Save to Important Soonish Links",
    contexts: ["link", "page"],
  });
});

chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  const url = info.linkUrl ?? info.pageUrl ?? tab?.url;
  if (!url || !validateUrl(url)) return;

  // createLink falls back to the hostname itself when title is falsy, so this only
  // needs the two levels genuinely specific to a context-menu save.
  const title = info.selectionText?.trim() || tab?.title;
  const links = await readLinks();
  if (containsUrl(links, url)) return;

  const newLink = createLink({ url, title });

  const next = [newLink, ...links];
  await writeLinks(next);
  await updateBadge(next);
  chrome.runtime.sendMessage({ type: "link-saved" }).catch(() => { /* popup not open */ });
});

async function updateBadge(links?: SavedLink[]): Promise<void> {
  const settings = await readSettings();
  if (!settings.showBadgeCount) {
    chrome.action.setBadgeText({ text: "" });
    return;
  }
  const count = links?.length ?? (await readLinks()).length;
  chrome.action.setBadgeText({ text: count > 0 ? String(count) : "" });
  chrome.action.setBadgeBackgroundColor({ color: "#0B6E99" });
}

chrome.storage.onChanged.addListener(async () => {
  await updateBadge();
});
