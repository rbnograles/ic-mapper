import { useEffect, useState, useCallback, useRef } from 'react';
import { loadMapData } from '@/utils/mapLoader';
import { IMapItem } from '@/interface';

export function useLazyMapData(floor: string, initialLimit = 20) {
  const [allPlaces, setAllPlaces] = useState<IMapItem[]>([]);
  const [visiblePlaces, setVisiblePlaces] = useState<IMapItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasMore, setHasMore] = useState(false);

  // 🧠 In-memory cache for selected maps
  const cacheRef = useRef<Record<string, IMapItem[]>>({});

  // Prevent duplicate "load all" requests
  const loadingAllRef = useRef(false);

  // Load saved cache on mount
  useEffect(() => {
    const saved = localStorage.getItem(`map-cache-${floor}`);
    if (saved) {
      try {
        cacheRef.current = JSON.parse(saved);
      } catch (err) {
        console.error('Error parsing saved cache:', err);
      }
    }
  }, [floor]);

  // =====================
  // Helpers
  // =====================
  const normalizeName = (name: string) => name.trim().toLowerCase();

  const filterPlaces = useCallback((maps: IMapItem[]) => {
    // remove unwanted and duplicate names (by normalized name)
    const seen = new Set<string>();
    return maps.filter((p) => {
      const valid =
        p.name !== 'Unknown' && p.name !== 'NotClickable' && !seen.has(normalizeName(p.name));
      if (valid) seen.add(normalizeName(p.name));
      return valid;
    });
  }, []);

  // utility to merge and dedupe by name (preserve first occurrence order)
  const mergeUniqueByName = (base: IMapItem[], extra: IMapItem[]) => {
    const map = new Map<string, IMapItem>();
    // keep base order first
    base.forEach((p) => map.set(normalizeName(p.name), p));
    extra.forEach((p) => {
      const key = normalizeName(p.name);
      if (!map.has(key)) map.set(key, p);
    });
    return Array.from(map.values());
  };

  // =====================
  // Load Map Data (for current `floor`)
  // =====================
  useEffect(() => {
    let isMounted = true;

    async function fetchData() {
      setLoading(true);
      try {
        const { maps } = await loadMapData(floor);
        const filtered = filterPlaces(maps);

        if (isMounted) {
          setAllPlaces(filtered);
          // Sort: prioritize items whose `floor` matches the requested floor (if floor !== 'all')
          const sorted = filtered.sort((a, b) => {
            // Use consistent property `floor`
            if (floor === 'all') return 0; // no reordering when showing "all"
            const aIsFloor = (a.floor ?? '').toString().toLowerCase() === floor.toLowerCase();
            const bIsFloor = (b.floor ?? '').toString().toLowerCase() === floor.toLowerCase();
            if (aIsFloor && !bIsFloor) return -1;
            if (!aIsFloor && bIsFloor) return 1;
            return 0;
          });

          setVisiblePlaces(sorted.slice(0, initialLimit));
          setHasMore(sorted.length > initialLimit); // hasMore true if more items exist
        }
      } catch (err) {
        console.error('Error loading map data:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    fetchData();
    return () => {
      isMounted = false;
    };
  }, [floor, initialLimit, filterPlaces]);

  // =====================
  // Infinite Scroll / loadMore
  // - If we've exhausted the current `allPlaces` and `floor !== 'all'`
  //   then try to fetch the `'all'` dataset and merge it so loading continues.
  // =====================
  const loadMore = useCallback(() => {
    setVisiblePlaces((prev) => {
      // Next chunk from the current allPlaces
      const next = allPlaces.slice(0, prev.length + initialLimit);

      // If next already reached all available items
      if (next.length >= allPlaces.length) {
        // If we're already showing the global 'all' dataset, there's nothing more to load.
        if (floor === 'all') {
          setHasMore(false);
          return next;
        }

        // If we haven't already requested the 'all' dataset, fetch and merge it.
        if (!loadingAllRef.current) {
          loadingAllRef.current = true;

          loadMapData('all')
            .then(({ maps: allMaps }) => {
              const filteredAll = filterPlaces(allMaps);

              // Merge base (current allPlaces) with filteredAll; avoid duplicates by name.
              const merged = mergeUniqueByName(allPlaces, filteredAll);

              // Re-sort by current floor priority (so items of the currently selected floor are still prioritized)
              const sortedMerged = merged.sort((a, b) => {
                if (floor === 'all') return 0;
                const aIsFloor = (a.floor ?? '').toString().toLowerCase() === floor.toLowerCase();
                const bIsFloor = (b.floor ?? '').toString().toLowerCase() === floor.toLowerCase();
                if (aIsFloor && !bIsFloor) return -1;
                if (!aIsFloor && bIsFloor) return 1;
                return 0;
              });

              // Update state with merged results
              setAllPlaces(sortedMerged);

              // Extend visiblePlaces: allow the UI to continue from previous length + initialLimit
              setVisiblePlaces((prevVisible) => {
                const nextLen = Math.min(sortedMerged.length, prevVisible.length + initialLimit);
                setHasMore(nextLen < sortedMerged.length);
                return sortedMerged.slice(0, nextLen);
              });
            })
            .catch((err) => {
              console.error('Error loading ALL map data:', err);
            })
            .finally(() => {
              loadingAllRef.current = false;
            });
        }

        // Return `next` for now while 'all' is being fetched; UI will get updated when merged completes.
        setHasMore(false); // temporarily set false until merged result updates it
        return next;
      }

      // If not yet exhausted, update hasMore based on slices
      setHasMore(next.length < allPlaces.length);
      return next;
    });
  }, [allPlaces, filterPlaces, floor, initialLimit]);

  // =====================
  // Smart Search (name + type)
  // =====================
  const search = useCallback(
    (query: string): IMapItem[] => {
      const q = query.trim().toLowerCase();
      if (!q) return visiblePlaces;

      const filtered = allPlaces.filter((p) => p.name !== 'Unknown' && p.name !== 'NotClickable');

      const typeMatchExists = filtered.some((p) => p.type?.toLowerCase().includes(q));

      const matches = typeMatchExists
        ? filtered.filter((p) => p.type?.toLowerCase().includes(q))
        : filtered.filter(
            (p) => p.name?.toLowerCase().includes(q) || p.type?.toLowerCase().includes(q)
          );

      // ✅ Deduplicate by name
      const uniqueByName = Array.from(
        new Map(matches.map((p) => [normalizeName(p.name), p])).values()
      );

      return uniqueByName;
    },
    [allPlaces, visiblePlaces]
  );

  // =====================
  // Cache only on selection
  // =====================
  const saveToCache = useCallback(
    (selectedPlace: IMapItem) => {
      if (!selectedPlace) return;

      const key = normalizeName(selectedPlace.name);
      const current = cacheRef.current[key] || [];

      // ✅ prevent duplicates (same name or same ID)
      if (current.some((p) => normalizeName(p.name) === key || p.id === selectedPlace.id)) return;

      const updated = {
        ...cacheRef.current,
        [key]: [...current, selectedPlace],
      };

      cacheRef.current = updated;
      localStorage.setItem(`map-cache-${floor}`, JSON.stringify(updated));
    },
    [floor]
  );

  // Clear all cached selections
  const clearCache = useCallback(() => {
    cacheRef.current = {};
    localStorage.removeItem(`map-cache-${floor}`);
  }, [floor]);

  return {
    visiblePlaces,
    hasMore,
    loadMore,
    search,
    loading,
    clearCache,
    saveToCache,
  };
}
