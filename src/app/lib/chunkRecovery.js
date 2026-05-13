const CHUNK_RELOAD_KEY = "melachow_chunk_reload";
const CHUNK_RELOAD_WINDOW_MS = 2 * 60 * 1000;

export function isChunkLoadError(error) {
  const message = String(error?.message || error?.reason?.message || error || "");
  const name = String(error?.name || error?.reason?.name || "");

  return (
    name.includes("ChunkLoadError") ||
    message.includes("ChunkLoadError") ||
    message.includes("Failed to load chunk") ||
    message.includes("/_next/static/chunks/")
  );
}

export async function clearChunkCaches() {
  if (typeof window === "undefined" || !("caches" in window)) return;

  try {
    const cacheNames = await caches.keys();
    await Promise.all(
      cacheNames
        .filter((cacheName) => cacheName.startsWith("melachow-") && cacheName.includes("-static"))
        .map((cacheName) => caches.delete(cacheName))
    );
  } catch (error) {
    console.warn("[ChunkRecovery] Failed to clear static caches", error);
  }
}

export async function recoverFromChunkLoadError({ force = false } = {}) {
  if (typeof window === "undefined") return false;

  const now = Date.now();
  const lastReloadAt = Number(sessionStorage.getItem(CHUNK_RELOAD_KEY) || 0);
  const canReload = force || !lastReloadAt || now - lastReloadAt > CHUNK_RELOAD_WINDOW_MS;

  if (!canReload) return false;

  if (navigator.onLine === false && !force) {
    window.addEventListener("online", () => recoverFromChunkLoadError({ force: true }), { once: true });
    return false;
  }

  sessionStorage.setItem(CHUNK_RELOAD_KEY, String(now));
  await clearChunkCaches();
  window.location.reload();
  return true;
}
