// Per-device recent searches stored in localStorage (YouTube-style).
// A device-scoped key keeps history isolated per browser/device.

const MAX_ITEMS = 10;

const getDeviceId = (): string => {
  try {
    let id = localStorage.getItem("jua_device_id");
    if (!id) {
      id = (crypto as any).randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2)}`;
      localStorage.setItem("jua_device_id", id);
    }
    return id;
  } catch {
    return "default";
  }
};

const keyFor = (scope: string) => `jua_recent_searches:${scope}:${getDeviceId()}`;

export const getRecentSearches = (scope = "catalogue"): string[] => {
  try {
    const raw = localStorage.getItem(keyFor(scope));
    if (!raw) return [];
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? arr.filter((x) => typeof x === "string") : [];
  } catch {
    return [];
  }
};

export const addRecentSearch = (term: string, scope = "catalogue") => {
  const t = (term || "").trim();
  if (!t) return;
  try {
    const list = getRecentSearches(scope).filter((x) => x.toLowerCase() !== t.toLowerCase());
    list.unshift(t);
    localStorage.setItem(keyFor(scope), JSON.stringify(list.slice(0, MAX_ITEMS)));
  } catch {}
};

export const removeRecentSearch = (term: string, scope = "catalogue") => {
  try {
    const list = getRecentSearches(scope).filter((x) => x.toLowerCase() !== term.toLowerCase());
    localStorage.setItem(keyFor(scope), JSON.stringify(list));
  } catch {}
};

export const clearRecentSearches = (scope = "catalogue") => {
  try {
    localStorage.removeItem(keyFor(scope));
  } catch {}
};
