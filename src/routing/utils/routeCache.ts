interface CachedRoute {
  nodes: string[];
  timestamp: number;
}

const memoryCache = new Map<string, CachedRoute>();
const MAX_CACHE_SIZE = 50;
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

// âœ… Safe cache key that prevents collisions
function createCacheKey(floor: string, from: string, to: string): string {
  // Use length prefixes to prevent collision
  return `${floor}:${from.length}:${from}:${to.length}:${to}`;
}

export function getCachedRoute(
  floor: string,
  from: string,
  to: string
): string[] | null {
  const key = createCacheKey(floor, from, to);
  const reverseKey = createCacheKey(floor, to, from);

  // Check memory cache first
  let cached = memoryCache.get(key);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.nodes;
  }

  // Check reverse
  cached = memoryCache.get(reverseKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return [...cached.nodes].reverse();
  }

  // Fallback to localStorage
  if (typeof window === 'undefined' || !window.localStorage) {
    return null;
  }

  try {
    const lsKey = `route-cache-${floor}-${encodeURIComponent(from)}-${encodeURIComponent(to)}`;
    const lsReverseKey = `route-cache-${floor}-${encodeURIComponent(to)}-${encodeURIComponent(from)}`;

    const rawData = localStorage.getItem(lsKey) || localStorage.getItem(lsReverseKey);
    if (rawData) {
      const parsed = JSON.parse(rawData) as { nodes: string[]; timestamp: number };
      if (Date.now() - parsed.timestamp < CACHE_TTL) {
        // Promote to memory cache
        const route: CachedRoute = {
          nodes: parsed.nodes,
          timestamp: parsed.timestamp,
        };
        memoryCache.set(key, route);
        
        const isReverse = localStorage.getItem(lsKey) === null;
        return isReverse ? [...parsed.nodes].reverse() : parsed.nodes;
      }
    }
  } catch (err) {
    console.warn('Cache read error:', err);
  }

  return null;
}

export function setCachedRoute(
  floor: string,
  from: string,
  to: string,
  nodes: string[]
): void {
  const key = createCacheKey(floor, from, to);
  const cached: CachedRoute = { nodes, timestamp: Date.now() };

  // Store in memory
  memoryCache.set(key, cached);

  // Evict old entries (LRU-style)
  if (memoryCache.size > MAX_CACHE_SIZE) {
    const firstKey = memoryCache.keys().next().value;
    if (firstKey) {
      memoryCache.delete(firstKey);
    }
  }

  // Store in localStorage asynchronously
  if (typeof window !== 'undefined' && window.localStorage) {
    requestIdleCallback(() => {
      try {
        const lsKey = `route-cache-${floor}-${encodeURIComponent(from)}-${encodeURIComponent(to)}`;
        localStorage.setItem(lsKey, JSON.stringify(cached));

        // Store reverse
        const reverseKey = `route-cache-${floor}-${encodeURIComponent(to)}-${encodeURIComponent(from)}`;
        localStorage.setItem(
          reverseKey,
          JSON.stringify({
            nodes: [...nodes].reverse(),
            timestamp: cached.timestamp,
          })
        );
      } catch (err) {
        console.warn('Cache write error:', err);
      }
    });
  }
}

// âœ… Clear expired cache entries
export function cleanExpiredCache(): void {
  const now = Date.now();
  
  // Clean memory cache
  for (const [key, value] of memoryCache.entries()) {
    if (now - value.timestamp > CACHE_TTL) {
      memoryCache.delete(key);
    }
  }
  
  // Clean localStorage in background
  if (typeof window !== 'undefined' && window.localStorage) {
    requestIdleCallback(() => {
      try {
        const keysToRemove: string[] = [];
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && key.startsWith('route-cache-')) {
            const raw = localStorage.getItem(key);
            if (raw) {
              const parsed = JSON.parse(raw) as { timestamp: number };
              if (now - parsed.timestamp > CACHE_TTL) {
                keysToRemove.push(key);
              }
            }
          }
        }
        keysToRemove.forEach((key) => localStorage.removeItem(key));
      } catch (err) {
        console.warn('Cache cleanup error:', err);
      }
    });
  }
}