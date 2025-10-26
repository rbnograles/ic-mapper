// components/hooks/routeMapHandler.ts
import { findPathBetweenPlacesOptimized } from '@/utils/routing';
import { floors } from '@/pages/IndoorMap/partials/floors';
import type { Graph, IEntrances, IMapItem, INodes, RouteStep } from '@/interface/index';

import useMapStore from '@/store/MapStore';
import { loadVerticals, findVerticalConnector } from '@/utils/verticalProcessor';

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
  const selectedFloorMap = mapStore.selectedFloorMap;
  const setActiveNodeIds = mapStore.setActiveNodeIds;
  const setSelectedId = mapStore.setSelectedId;

  if (!from || !to) return null;

  // Build graph object expected by routing util
  const floorMap = { nodes, entrances, maps: maps } as unknown as Graph;

  /**
   * Helper: resolve a "candidate" value (could be id, name, or an entrance id)
   * into something route-finder can accept (prefer map.id, otherwise map.name).
   *
   * Priority:
   * 1) If candidate matches a map.id -> return that id
   * 2) If candidate matches a map.name -> return that name
   * 3) If candidate matches an entrance.id -> find a map that references that entrance
   *    and return that map.id (preferred) or map.name
   * 4) Fallback: return the original candidate (so findPathBetweenPlacesOptimized
   *    can still attempt name matching)
   */
  function resolvePlaceCandidate(candidate: string): string {
    if (!candidate) return candidate;

    // 1) exact map id
    const byId = maps.find((m) => m.id === candidate);
    if (byId) return byId.id;

    // 2) exact map name
    const byName = maps.find((m) => m.name === candidate);
    if (byName) return byName.name;

    // 3) entrance id -> find a map item that references that entrance (entranceNodes)
    const mapViaEntrance = maps.find(
      (m) => Array.isArray((m as any).entranceNodes) && (m as any).entranceNodes.includes(candidate)
    );
    if (mapViaEntrance) return mapViaEntrance.id ?? mapViaEntrance.name;

    // 4) not found — maybe it's already a friendly label for a vertical connector.
    // Return candidate unchanged and let the pathfinder attempt name-based lookup.
    return candidate;
  }

  const safeLocalStorageAvailable =
    typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';

  // Build cache keys using raw function inputs (we keep them as-is for cache lookup)
  const key = `route-cache-${selectedFloorMap}-${encodeURIComponent(from)}-${encodeURIComponent(to)}`;
  const reverseKey = `route-cache-${selectedFloorMap}-${encodeURIComponent(to)}-${encodeURIComponent(from)}`;

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
            // ensure highlight set to destination (we pass the original `to` value; it's fine if it's id or name)
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

  // Resolve inputs into something the pathfinder can accept.
  // This covers cases where `from` / `to` are entrance ids
  // or connector ids, or names.
  const resolvedFrom = resolvePlaceCandidate(from);
  const resolvedTo = resolvePlaceCandidate(to);

  // Compute path — findPathBetweenPlacesOptimized should be updated to accept id OR name.
  const path = findPathBetweenPlacesOptimized(floorMap, resolvedFrom, resolvedTo);

  if (!path || !Array.isArray(path.nodes) || path.nodes.length === 0) {
    console.warn('❌ No route found between', from, 'and', to, { resolvedFrom, resolvedTo });
    setActiveNodeIds([]);
    return null;
  }

  const orderedNodes = path.nodes;
  const routeData: RouteResult = {
    from,
    to,
    floor: floors.find((f) => selectedFloorMap === f.key)?.name ?? selectedFloorMap,
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

// Pathfinding with caching — plain function that accepts current state
export const handleMultiFloorRoute = async (
  from: IMapItem,
  to: IMapItem,
  via: string,
  setMultiFloorRoute: (steps: RouteStep[], finalDestination: IMapItem) => void,
  setSelectedFloorMap: (floor: string) => void
) => {
  const steps: RouteStep[] = [];

  const verticals = await loadVerticals(from.floor);
  const connector = findVerticalConnector(verticals, from.floor, to.floor, via);

  if (!connector) {
    console.error(`No ${via} connector found between floors`);
    return null;
  }

  // Step 1: route from origin to the connector on origin floor
  steps.push({
    floor: from.floor,
    from: from.name,
    to: connector.fromLabel, // display label
    toId: connector.fromId, // actual id to be used by routing logic if needed
    isVerticalTransition: false,
  });

  // Step 2: vertical transition step (user taps to move floors)
  steps.push({
    floor: to.floor,
    from: connector.toLabel,
    fromId: connector.toId,
    to: connector.toLabel,
    isVerticalTransition: true,
  });

  // Step 3: route from connector to final destination on target floor
  steps.push({
    floor: to.floor,
    from: connector.toLabel,
    fromId: connector.toId,
    to: to.name,
    isVerticalTransition: false,
  });
  const byAlias: any = floors.find((f) => (f.aliases || []).includes(from.floor));
  setMultiFloorRoute(steps, to);
  setSelectedFloorMap(byAlias.key);
  return steps;
};
