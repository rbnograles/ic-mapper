// components/hooks/routeMapHandler.ts
import { findPathBetweenPlacesOptimized } from '@/utils/routing';
import { floors } from '@/pages/IndoorMap/partials/floors';
import type { Graph, IEntrances, IMapItem, INodes } from '@/interface/index';

import useMapStore from '@/store/MapStore';

type RouteResult = {
  from: string;
  to: string;
  floor: string;
  nodes: string[];
  timestamp: number;
} | null;


export async function routeMapHandler(
  from: string,
  to: string,
  maps: IMapItem[],
  nodes: INodes[],
  entrances: IEntrances[]
): Promise<string[] | null> {

  const mapStore = useMapStore.getState();
  const selectedMap = mapStore.selectedMap
  const setActiveNodeIds = mapStore.setActiveNodeIds
  const setSelectedId = mapStore.setSelectedId

  if (!from || !to) return null;

  const floorMap = { nodes, entrances, maps: maps } as unknown as Graph;

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
            setSelectedId(to);
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
  setSelectedId(to);

  return orderedNodes;
}
