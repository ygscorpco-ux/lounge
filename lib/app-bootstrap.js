const HOME_BOOTSTRAP_KEY = "lounge-home-feed-bootstrap-v2";
const NOTIFICATIONS_BOOTSTRAP_KEY = "lounge-notifications-bootstrap-v2";
const BOOTSTRAP_PROMISE_KEY = "__loungeInitialBootstrapPromise";
const BOOTSTRAP_TTL_MS = 1000 * 20;

function getSessionStorage() {
  if (typeof window === "undefined") return null;
  return window.sessionStorage;
}

export function writeBootstrapCache(key, data) {
  const storage = getSessionStorage();
  if (!storage || data == null) return;

  try {
    storage.setItem(
      key,
      JSON.stringify({
        savedAt: Date.now(),
        data,
      }),
    );
  } catch (error) {
    console.error(error);
  }
}

export function readBootstrapCache(key) {
  const storage = getSessionStorage();
  if (!storage) return null;

  try {
    const raw = storage.getItem(key);
    if (!raw) return null;

    const parsed = JSON.parse(raw);
    const savedAt = Number(parsed?.savedAt || 0);
    if (!savedAt || Date.now() - savedAt > BOOTSTRAP_TTL_MS) {
      storage.removeItem(key);
      return null;
    }

    return parsed?.data ?? null;
  } catch (error) {
    console.error(error);
    return null;
  }
}

export function consumeBootstrapCache(key) {
  const storage = getSessionStorage();
  const data = readBootstrapCache(key);
  if (storage) {
    storage.removeItem(key);
  }
  return data;
}

export function setBootstrapPromise(promise) {
  if (typeof window === "undefined") return;
  window[BOOTSTRAP_PROMISE_KEY] = promise;
}

export function getBootstrapPromise() {
  if (typeof window === "undefined") return null;
  return window[BOOTSTRAP_PROMISE_KEY] || null;
}

export { HOME_BOOTSTRAP_KEY, NOTIFICATIONS_BOOTSTRAP_KEY };
