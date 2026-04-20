import { afterEach } from "vitest";
import { cleanup } from "@testing-library/svelte";

afterEach(cleanup);

function makeStorageArea(): chrome.storage.StorageArea {
  const store: Record<string, unknown> = {};
  return {
    get: (keys?: null | string | string[] | Record<string, unknown>) =>
      Promise.resolve(
        keys === null || keys === undefined
          ? { ...store }
          : typeof keys === "string"
          ? { [keys]: store[keys] }
          : Array.isArray(keys)
          ? Object.fromEntries(keys.map(k => [k, store[k]]))
          : Object.fromEntries(Object.keys(keys).map(k => [k, store[k] ?? keys[k]]))
      ),
    set: (items: Record<string, unknown>) => {
      Object.assign(store, items);
      return Promise.resolve();
    },
    remove: (keys: string | string[]) => {
      const arr = Array.isArray(keys) ? keys : [keys];
      arr.forEach(k => delete store[k]);
      return Promise.resolve();
    },
    clear: () => {
      for (const k in store) delete store[k];
      return Promise.resolve();
    },
    getBytesInUse: () => Promise.resolve(0),
    setAccessLevel: () => Promise.resolve(),
    onChanged: { addListener: () => {}, removeListener: () => {}, hasListener: () => false, hasListeners: () => false, addRules: () => {}, getRules: () => {}, removeRules: () => {} },
  } as unknown as chrome.storage.StorageArea;
}

const local = makeStorageArea();
const sync = Object.assign(makeStorageArea(), { QUOTA_BYTES: 102400 });

(globalThis as Record<string, unknown>).chrome = {
  storage: { local, sync },
  runtime: {
    onInstalled: { addListener: () => {} },
    onMessage: { addListener: () => {} },
    sendMessage: () => {},
  },
  contextMenus: {
    create: () => {},
    onClicked: { addListener: () => {} },
  },
  tabs: {
    query: () => Promise.resolve([]),
    create: () => Promise.resolve({ id: 1 }),
  },
  action: {
    setBadgeText: () => {},
    setBadgeBackgroundColor: () => {},
  },
};
