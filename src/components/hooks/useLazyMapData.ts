import { useEffect, useState, useCallback, useRef } from 'react';
import { loadMapData } from '../util/core/mapLoader';

interface Place {
  id: string;
  name: string;
  type?: string;
  floor?: string;
  [key: string]: any;
}

export function useLazyMapData(floor: string, initialLimit = 20) {
  const [allPlaces, setAllPlaces] = useState<Place[]>([]);
  const [visiblePlaces, setVisiblePlaces] = useState<Place[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasMore, setHasMore] = useState(false);

  // 🧠 In-memory cache for selected places
  const cacheRef = useRef<Record<string, Place[]>>({});

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

  const filterPlaces = useCallback((places: Place[]) => {
    // remove unwanted and duplicate names
    const seen = new Set<string>();
    return places.filter((p) => {
      const valid =
        p.name !== 'Unknown' && p.name !== 'NotClickable' && !seen.has(normalizeName(p.name));
      if (valid) seen.add(normalizeName(p.name));
      return valid;
    });
  }, []);

  // =====================
  // Load Map Data
  // =====================
  useEffect(() => {
    let isMounted = true;

    async function fetchData() {
      setLoading(true);
      try {
        const { places } = await loadMapData(floor);
        const filtered = filterPlaces(places);

        if (isMounted) {
          setAllPlaces(filtered);
          setVisiblePlaces(filtered.slice(0, initialLimit));
          setHasMore(filtered.length > initialLimit);
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
  // Infinite Scroll
  // =====================
  const loadMore = useCallback(() => {
    setVisiblePlaces((prev) => {
      const next = allPlaces.slice(0, prev.length + initialLimit);
      setHasMore(next.length < allPlaces.length);
      return next;
    });
  }, [allPlaces, initialLimit]);

  // =====================
  // Smart Search (name + type)
  // =====================
  const search = useCallback(
    (query: string): Place[] => {
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
    (selectedPlace: Place) => {
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
