import { readSettings, readLinks, writeLinks } from "../storage";
import { validateUrl, generateId, hostnameFromUrl, now } from "../lib/utils";
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

  const title = info.selectionText?.trim() || tab?.title || hostnameFromUrl(url);
  const links = await readLinks();
  if (links.some(l => l.url === url)) return;

  const newLink: SavedLink = {
    id: generateId(),
    title,
    url,
    color: "default",
    order: links.length,
    createdAt: now(),
    updatedAt: now(),
  };

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
