// components/hooks/routeMapHandler.ts
import type { Dispatch, SetStateAction } from 'react';
import { findPathBetweenPlacesOptimized } from '../util/core/routing';
import { floors } from '../Maps/partials/floors';
import type { Graph } from '../../interface/BaseMap';

type RouteResult = {
  from: string;
  to: string;
  floor: string;
  nodes: string[];
  timestamp: number;
} | null;

/**
 * Plain function (NOT a hook) that computes a route between two places,
 * caches results in localStorage (both directions), and updates supplied setters.
 *
 * Returns the ordered nodes (from -> to) or null if no route.
 */
export async function routeMapHandler(
  from: string,
  to: string,
  nodes: any[],
  entrances: any[],
  maps: any[],
  selectedMap: string,
  setActiveNodeIds: Dispatch<SetStateAction<string[]>>,
  setHighlightId: Dispatch<SetStateAction<string | null>>
): Promise<string[] | null> {
  if (!from || !to) return null;

  const floorMap = { nodes, entrances, places: maps } as unknown as Graph;

  const safeLocalStorageAvailable =
    typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';

  const key = `route-cache-${selectedMap}-${encodeURIComponent(from)}-${encodeURIComponent(to)}`;
  const reverseKey = `route-cache-${selectedMap}-${encodeURIComponent(to)}-${encodeURIComponent(from)}`;

  // Check cache (both directions)
  if (safeLocalStorageAvailable) {
    try {
      const cachedRaw = window.localStorage.getItem(key) ?? window.localStorage.getItem(reverseKey);
      const cachedKey = window.localStorage.getItem(key)
        ? key
        : window.localStorage.getItem(reverseKey)
          ? reverseKey
          : null;

      if (cachedRaw && cachedKey) {
        try {
          const parsed = JSON.parse(cachedRaw) as RouteResult;
          const cachedNodes = parsed?.nodes ?? [];

          if (Array.isArray(cachedNodes) && cachedNodes.length) {
            // If we read the reverseKey, reverse the nodes so they reflect `from -> to`
            const nodesToUse = cachedKey === reverseKey ? [...cachedNodes].reverse() : cachedNodes;
            setActiveNodeIds(nodesToUse);
            console.log(
              `✅ Using cached route for ${from} ↔ ${to} (from ${cachedKey === key ? 'key' : 'reverseKey'})`
            );
            // ensure highlight set to destination
            setHighlightId(to);
            return nodesToUse;
          }
        } catch (err) {
          console.warn('⚠️ Failed to parse cached route:', err);
        }
      }
    } catch (err) {
      console.warn('⚠️ localStorage access error while reading cache:', err);
    }
  }

  // Compute path
  const path = findPathBetweenPlacesOptimized(floorMap, from, to);

  if (!path || !Array.isArray(path.nodes) || path.nodes.length === 0) {
    console.warn('❌ No route found between', from, 'and', to);
    setActiveNodeIds([]);
    return null;
  }

  const orderedNodes = path.nodes;

  const routeData: RouteResult = {
    from,
    to,
    floor: floors.find((f) => selectedMap === f.key)?.name ?? selectedMap,
    nodes: orderedNodes,
    timestamp: Date.now(),
  };

  // store both directions: key and reverseKey
  if (safeLocalStorageAvailable) {
    try {
      window.localStorage.setItem(key, JSON.stringify(routeData));

      const reverseRouteData: RouteResult = {
        from: to,
        to: from,
        floor: routeData!.floor,
        nodes: [...orderedNodes].reverse(),
        timestamp: Date.now(),
      };
      window.localStorage.setItem(reverseKey, JSON.stringify(reverseRouteData));
    } catch (err) {
      console.warn('⚠️ Failed to store route in cache:', err);
    }
  }

  // update state
  setActiveNodeIds(orderedNodes);
  setHighlightId(to);

  return orderedNodes;
}
