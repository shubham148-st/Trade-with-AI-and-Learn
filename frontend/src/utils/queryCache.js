/**
 * Client-Side Query Cache (Stale-While-Revalidate + Request Deduplication)
 *
 * Capabilities:
 * 1. Request Deduplication: In-flight promises share the same underlying network request.
 * 2. Stale-While-Revalidate (SWR): Returns cached data instantly while refreshing in the background.
 * 3. Configurable TTL: Granular freshness per endpoint.
 */

const cache = new Map();
const inFlightRequests = new Map();

/**
 * Fetch a JSON resource with SWR caching and deduplication.
 *
 * @param {string} url - Request endpoint URL.
 * @param {RequestInit} [fetchOptions={}] - Fetch configuration (headers, signal, etc.)
 * @param {Object} [config={}] - Cache configuration
 * @param {number} [config.ttl=30000] - Cache freshness duration (ms). Defaults to 30s.
 * @param {boolean} [config.staleWhileRevalidate=true] - Return stale cache while revalidating in background.
 * @param {boolean} [config.forceRefresh=false] - Bypass cache and force network fetch.
 * @returns {Promise<any>}
 */
export async function fetchWithCache(url, fetchOptions = {}, config = {}) {
  const {
    ttl = 30000,
    staleWhileRevalidate = true,
    forceRefresh = false
  } = config;

  const cacheKey = url;
  const now = Date.now();
  const cachedEntry = cache.get(cacheKey);

  // 1. Fresh cache hit: Return immediately
  if (!forceRefresh && cachedEntry && (now - cachedEntry.timestamp < ttl)) {
    return cachedEntry.data;
  }

  // 2. Request deduplication: If a request for this URL is currently in flight, reuse its promise
  if (inFlightRequests.has(cacheKey)) {
    return inFlightRequests.get(cacheKey);
  }

  // Helper to execute network request and cache the result
  const executeFetch = async () => {
    try {
      const response = await fetch(url, fetchOptions);
      if (!response.ok) {
        throw new Error(`HTTP error ${response.status} for ${url}`);
      }
      const data = await response.json();
      cache.set(cacheKey, {
        data,
        timestamp: Date.now()
      });
      return data;
    } finally {
      inFlightRequests.delete(cacheKey);
    }
  };

  // 3. Stale-While-Revalidate: Return stale data immediately and revalidate in background
  if (!forceRefresh && cachedEntry && staleWhileRevalidate) {
    const fetchPromise = executeFetch().catch(err => {
      console.warn(`[SWR] Background revalidation failed for ${cacheKey}:`, err);
    });
    inFlightRequests.set(cacheKey, fetchPromise);
    return cachedEntry.data;
  }

  // 4. Cold cache or forceRefresh: Await network response
  const fetchPromise = executeFetch();
  inFlightRequests.set(cacheKey, fetchPromise);
  return fetchPromise;
}

/**
 * Invalidate a specific cache key or all keys matching a prefix.
 *
 * @param {string} [keyOrPrefix] - Key or prefix to invalidate. If omitted, clears entire cache.
 */
export function invalidateCache(keyOrPrefix) {
  if (!keyOrPrefix) {
    cache.clear();
    return;
  }
  for (const key of cache.keys()) {
    if (key.startsWith(keyOrPrefix)) {
      cache.delete(key);
    }
  }
}

/**
 * Read cached value synchronously if present.
 *
 * @param {string} key
 * @returns {any|undefined}
 */
export function getCachedValue(key) {
  const entry = cache.get(key);
  return entry ? entry.data : undefined;
}

export default fetchWithCache;
