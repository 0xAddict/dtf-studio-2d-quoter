/**
 * signedUrlCache — LRU cache for Supabase Storage signed URLs.
 * TTL: 5 minutes (5 * 60 * 1000 ms). Max 200 entries.
 * Evicts the oldest-inserted entry when maxSize exceeded.
 */

const TTL_MS = 5 * 60 * 1000; // 5 minutes
const MAX_CACHE_SIZE = 200;

interface CacheEntry {
  url: string;
  expiresAt: number;
}

// Insertion-ordered Map: oldest key = first key
const urlMap = new Map<string, CacheEntry>();

function evictExpired(): void {
  const now = Date.now();
  for (const [key, entry] of urlMap) {
    if (entry.expiresAt <= now) {
      urlMap.delete(key);
    }
  }
}

function evictOldest(): void {
  const firstKey = urlMap.keys().next().value;
  if (firstKey !== undefined) {
    urlMap.delete(firstKey);
  }
}

/**
 * getCachedSignedUrl — returns a signed URL for a Supabase Storage path.
 * On hit (within TTL), returns the memoised URL without calling Supabase.
 * On miss or expiry, calls createSignedUrl, stores result, and returns it.
 *
 * @param bucket  Supabase Storage bucket name (e.g. 'dtf-files')
 * @param path    Object path inside the bucket
 * @param supabaseClient  Supabase client instance
 * @param ttlMs   URL TTL in ms (default 5 min). Must match Supabase expiry seconds.
 */
export async function getCachedSignedUrl(
  bucket: string,
  path: string,
  supabaseClient: import('@supabase/supabase-js').SupabaseClient,
  ttlMs: number = TTL_MS,
): Promise<string> {
  const cacheKey = `${bucket}::${path}`;
  const now = Date.now();

  // Cache hit?
  const existing = urlMap.get(cacheKey);
  if (existing && existing.expiresAt > now) {
    // Refresh insertion order (LRU touch)
    urlMap.delete(cacheKey);
    urlMap.set(cacheKey, existing);
    return existing.url;
  }

  // Miss or expired — fetch fresh signed URL
  const expirySeconds = Math.ceil(ttlMs / 1000);
  const { data, error } = await supabaseClient.storage
    .from(bucket)
    .createSignedUrl(path, expirySeconds);

  if (error || !data?.signedUrl) {
    throw new Error(`signedUrlCache: failed to sign ${path}: ${error?.message ?? 'no data'}`);
  }

  const entry: CacheEntry = {
    url: data.signedUrl,
    expiresAt: now + ttlMs,
  };

  // Evict expired first, then check maxSize
  evictExpired();
  if (urlMap.size >= MAX_CACHE_SIZE) {
    evictOldest();
  }

  urlMap.set(cacheKey, entry);
  return data.signedUrl;
}

/** Exposed for testing / debugging — do not call from UI code. */
export function _getCacheSize(): number {
  return urlMap.size;
}

export function _clearCache(): void {
  urlMap.clear();
}
