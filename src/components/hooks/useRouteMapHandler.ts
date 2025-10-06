import type { SetStateAction} from 'react';
import { findPathBetweenPlacesOptimized } from '../util/core/routing';
import { floors } from '../Maps/partials/floors';
import type { Graph } from '../../interface/BaseMap';

export default function useRouteMapHandler(
  from: string,
  to: string,
  nodes: any[],
  entrances: any[],
  maps: any[],
  selectedMap: string,
  setActiveNodeIds: (value: SetStateAction<string[]>) => void,
  setHighlightId: (value: React.SetStateAction<string | null>) => void
) {
  if (!from || !to) return;

  const floorMap = { nodes, entrances, places: maps };

  // use encodeURIComponent to avoid characters breaking keys
  const key = `route-cache-${selectedMap}-${encodeURIComponent(from)}-${encodeURIComponent(to)}`;
  const reverseKey = `route-cache-${selectedMap}-${encodeURIComponent(to)}-${encodeURIComponent(from)}`;

  // detect which key is present
  const cachedKey = localStorage.getItem(key)
    ? key
    : localStorage.getItem(reverseKey)
      ? reverseKey
      : null;

  if (cachedKey) {
    try {
      const parsed = JSON.parse(localStorage.getItem(cachedKey) as string);
      const cachedNodes: string[] = parsed?.nodes ?? [];

      if (Array.isArray(cachedNodes) && cachedNodes.length) {
        // if we read the reverseKey, reverse the nodes so they reflect `from -> to`
        const nodesToUse = cachedKey === reverseKey ? [...cachedNodes].reverse() : cachedNodes;
        setActiveNodeIds(nodesToUse);
        console.log(
          `✅ Using cached route for ${from} ↔ ${to} (from ${cachedKey === key ? 'key' : 'reverseKey'})`
        );
        return;
      }
    } catch (err) {
      console.warn('⚠️ Failed to parse cached route:', err);
    }
  }

  // compute new path
  const path = findPathBetweenPlacesOptimized(floorMap as unknown as Graph, from, to);

  if (!path || !path.nodes) {
    console.warn('❌ No route found between', from, 'and', to);
    setActiveNodeIds([]);
    return;
  }

  // canonical route nodes should be in `from -> to` order
  const orderedNodes = path.nodes;

  const routeData = {
    from,
    to,
    floor: floors.find((f) => selectedMap === f.key)?.name ?? selectedMap,
    nodes: orderedNodes,
    timestamp: Date.now(),
  };

  // store both directions: key (from->to) and reverseKey (to->from with reversed nodes)
  try {
    localStorage.setItem(key, JSON.stringify(routeData));

    // prepare reverse entry so future lookups find correct-order nodes
    const reverseRouteData = {
      from: to,
      to: from,
      floor: routeData.floor,
      nodes: [...orderedNodes].reverse(),
      timestamp: Date.now(),
    };
    localStorage.setItem(reverseKey, JSON.stringify(reverseRouteData));
  } catch (err) {
    console.warn('⚠️ Failed to store route in cache:', err);
  }

  setActiveNodeIds(orderedNodes);
  setHighlightId(to);
}
