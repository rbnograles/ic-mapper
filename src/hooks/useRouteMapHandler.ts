import type { Graph, IEntrances, IMapItem, INodes, RouteStep } from '@/types/index';
import { findPathBetweenPlacesOptimized } from '@/routing/algorithms/routing';
import { floors } from '@/routing/utils/Constants';
import { loadMapData } from '@/routing/utils/mapLoader';
import useMapStore from '@/store/MapStore';
import { loadVerticals } from '@/routing/utils/verticalProcessor';
import { getCachedRoute, setCachedRoute } from '@/routing/utils/routeCache';
import { Normalizer } from '@/routing/utils/Normalizer';

const activeCalculations = new Map<string, { isPreCalculation?: boolean }>();
const NormalizeFloor = new Normalizer(floors);

export async function routeMapHandler(
  from: string,
  to: string,
  maps: IMapItem[],
  nodes: INodes[],
  entrances: IEntrances[],
  forceCalculation: boolean = false
): Promise<string[] | null> {
  const mapStore = useMapStore.getState();
  const selectedFloorMap = mapStore.selectedFloorMap;
  const setActiveNodeIds = mapStore.setActiveNodeIds;
  const setSelectedId = mapStore.setSelectedId;
  const setIsCalculatingRoute = mapStore.setIsCalculatingRoute;

  if (!from || !to) return null;

  // ✅ Use normalized floor name for key creation
  const currentFloorName = NormalizeFloor.normalizeFloorName(selectedFloorMap);
  const preCalculatedKey = NormalizeFloor.createRouteKey(currentFloorName, from, to);

  const preCalculated = mapStore.multiFloorRoute.preCalculatedRoutes?.get(preCalculatedKey);

  if (preCalculated && preCalculated.length > 0) {
    console.log(`⚡ Using pre-calculated route for ${from} → ${to}`);
    queueMicrotask(() => {
      setActiveNodeIds(preCalculated);
      setSelectedId(to);
      setIsCalculatingRoute(false);
    });
    return preCalculated;
  }

  // ✅ Check cache
  if (!forceCalculation) {
    const cachedNodes = getCachedRoute(selectedFloorMap, from, to);
    if (cachedNodes) {
      console.log(`✅ Cache hit for ${from} → ${to}`);
      queueMicrotask(() => {
        setActiveNodeIds(cachedNodes);
        setSelectedId(to);
        setIsCalculatingRoute(false);
      });
      return cachedNodes;
    }
  }

  setIsCalculatingRoute(true);

  console.log('🔄 Starting route calculation:', { from, to, floor: currentFloorName });

  const calculationKey = `${selectedFloorMap}-${from}-${to}`;

  const existing = activeCalculations.get(calculationKey);

  if (existing) {
    activeCalculations.delete(calculationKey);
  }

  const debounceTime = /iPhone|iPad|iPod/.test(navigator.userAgent) ? 30 : 50;

  return new Promise((resolve) => {
    setTimeout(() => {
      const floorMap = { nodes, entrances, maps } as unknown as Graph;

      function resolvePlaceCandidate(candidate: string): string {
        if (!candidate) return candidate;
        const byId = maps.find((m) => m.id === candidate);

        if (byId) return byId.id;

        const byName = maps.find((m) => m.name === candidate);

        if (byName) return byName.name;

        const mapViaEntrance = maps.find(
          (m) =>
            Array.isArray((m as any).entranceNodes) && (m as any).entranceNodes.includes(candidate)
        );

        if (mapViaEntrance) return mapViaEntrance.id ?? mapViaEntrance.name;

        return candidate;
      }

      const resolvedFrom = resolvePlaceCandidate(from);
      const resolvedTo = resolvePlaceCandidate(to);

      try {
        const path = findPathBetweenPlacesOptimized(floorMap, resolvedFrom, resolvedTo);

        if (!path || !Array.isArray(path.nodes) || path.nodes.length === 0) {
          console.warn('❌ No route found between', from, 'and', to);
          setActiveNodeIds([]);
          setIsCalculatingRoute(false);
          resolve(null);
          return;
        }

        const orderedNodes = path.nodes;
        setCachedRoute(selectedFloorMap, from, to, orderedNodes);

        queueMicrotask(() => {
          setActiveNodeIds(orderedNodes);
          setSelectedId(to);
          setIsCalculatingRoute(false);
          // ✅ Don't auto-advance, let user click
        });

        console.log('✅ Route calculation complete:', orderedNodes.length, 'nodes');
        resolve(orderedNodes);
      } catch (error) {
        console.error('Error calculating route:', error);
        setActiveNodeIds([]);
        setIsCalculatingRoute(false);
        resolve(null);
      } finally {
        activeCalculations.delete(calculationKey);
      }

      activeCalculations.set(calculationKey, {});
    }, debounceTime);
  });
}

async function preCalculateMultiFloorRoutes(
  steps: RouteStep[],
  allFloorsData: Map<string, { maps: IMapItem[]; nodes: INodes[]; entrances: IEntrances[] }>
): Promise<Map<string, string[]>> {
  const preCalculated = new Map<string, string[]>();

  const lastIndex = steps.length - 1; // <-- last item index

  for (let idx = 0; idx < steps.length; idx++) {
    const step = steps[idx];
    if (step.isVerticalTransition) continue;

    // step.floor is already a key like "ground", "second", etc.
    const floorKey = step.floor;
    const floorData = allFloorsData.get(floorKey);

    if (!floorData) {
      console.warn(`   ⚠️ No floor data found for key: ${floorKey}`);
      continue;
    }

    // Destructure into new consts so TypeScript keeps non-null narrowing
    const { maps, nodes, entrances } = floorData;

    // Extra safety check (optional) — keeps intent clear
    if (!maps || !nodes || !entrances) {
      console.warn(`   ⚠️ Incomplete floor data for key: ${floorKey}`);
      continue;
    }

    const from = step.fromId || step.from;
    const to = step.toId || step.to;

    // Get floor name for the key (for display and cache key)
    const floorObj = floors.find((f) => f.key === floorKey);
    const floorName = floorObj ? floorObj.name : floorKey;

    const key = `${floorName}:${from}:${to}`;

    try {
      const floorMap = {
        nodes,
        entrances,
        maps,
      } as unknown as Graph;

      function resolveIdentifier(candidate: string): string {
        const byId = maps.find((m: { id: string }) => m.id === candidate);
        if (byId) return byId.id;

        const byName = maps.find((m: { name: string }) => m.name === candidate);
        if (byName) return byName.name;

        // If candidate is an entrance id, prefer returning the *map that contains that entrance* (if any)
        const mapViaEntrance = maps.find(
          (m: { entranceNodes?: string[] }) =>
            Array.isArray(m.entranceNodes) && m.entranceNodes.includes(candidate)
        );
        if (mapViaEntrance) return mapViaEntrance.id ?? mapViaEntrance.name;

        // fallback to leaving the entrance id (so findPathBetweenPlacesOptimized can handle it)
        const entrance = entrances.find((e: { id: string }) => e.id === candidate);
        if (entrance) return candidate;

        return candidate;
      }

      // Prefer explicit step.toId for the final segment (and prefer step.fromId when applicable)
      const isLastItem = idx === lastIndex;
      const resolvedFrom = isLastItem && step.fromId ? step.fromId : resolveIdentifier(from);
      const resolvedTo = isLastItem && step.toId ? step.toId : resolveIdentifier(to);

      const path = findPathBetweenPlacesOptimized(floorMap, resolvedFrom, resolvedTo);

      console.log(path);

      if (path && path.nodes && path.nodes.length > 0) {
        preCalculated.set(key, path.nodes);
        console.log(`   ⚡ Pre-calculated: ${key} (${path.nodes.length} nodes)`);
      } else {
        console.warn(`   ❌ Failed to pre-calculate ${key}: No path found`);
      }
    } catch (err) {
      console.warn(`   ❌ Failed to pre-calculate ${key}:`, err);
    }
  }

  return preCalculated;
}

/**
 * Find path through multiple floors using BFS - FIXED for bidirectional traversal
 */
function findMultiFloorPath(
  verticalsData: any,
  fromFloor: string,
  toFloor: string,
  viaType: string
): any[] | null {
  if (!verticalsData?.verticals) return null;

  const verticals = verticalsData.verticals;

  // Helper: Extract floor key from node ID or floor name
  const getFloorKey = (identifier: string): string => {
    const parts = identifier.split('_');
    const floorPart = parts[0].toLowerCase();

    const floor = floors.find(
      (f) =>
        f.key === floorPart ||
        f.name.toLowerCase().includes(floorPart) ||
        f.aliases.some((a) => a.toLowerCase().includes(floorPart)) ||
        f.aliases.some((a) => a.toLowerCase().includes(identifier.toLowerCase()))
    );

    return floor ? floor.key : floorPart;
  };

  // Build adjacency map with BIDIRECTIONAL edges
  const adj = new Map<string, { vertical: any; neighbor: string; direction: 'up' | 'down' }[]>();

  for (const v of verticals) {
    if (v.type?.toLowerCase() !== viaType.toLowerCase()) continue;

    const fromKey = getFloorKey(v.from);
    const toKey = getFloorKey(v.to);

    if (!adj.has(fromKey)) adj.set(fromKey, []);
    if (!adj.has(toKey)) adj.set(toKey, []);

    // ✅ Store both directions with proper metadata
    adj.get(fromKey)!.push({
      vertical: v,
      neighbor: toKey,
      direction: 'up', // fromKey -> toKey is "up"
    });

    adj.get(toKey)!.push({
      vertical: v,
      neighbor: fromKey,
      direction: 'down', // toKey -> fromKey is "down"
    });
  }

  const startKey = getFloorKey(fromFloor);
  const targetKey = getFloorKey(toFloor);

  console.log(`🔍 BFS: "${startKey}" → "${targetKey}"`);
  console.log(`   Available floors:`, Array.from(adj.keys()));

  // BFS with direction tracking
  const queue = [startKey];
  const visited = new Set([startKey]);
  const parent = new Map<string, { from: string; vertical: any; direction: 'up' | 'down' }>();

  while (queue.length > 0) {
    const current = queue.shift()!;

    if (current === targetKey) {
      // Reconstruct path with proper direction info
      const path: any[] = [];
      let cur = targetKey;

      while (cur !== startKey) {
        const p = parent.get(cur)!;

        // ✅ Create connector with correct orientation based on direction
        const connector = {
          ...p.vertical,
          // Swap from/to if going down
          from: p.direction === 'down' ? p.vertical.to : p.vertical.from,
          to: p.direction === 'down' ? p.vertical.from : p.vertical.to,
          labelFrom: p.direction === 'down' ? p.vertical.labelTo : p.vertical.labelFrom,
          labelTo: p.direction === 'down' ? p.vertical.labelFrom : p.vertical.labelTo,
          direction: p.direction,
        };

        path.unshift(connector);
        cur = p.from;
      }

      console.log(`✅ Found path with ${path.length} hop(s)`);
      return path;
    }

    const neighbors = adj.get(current) ?? [];
    for (const { vertical, neighbor, direction } of neighbors) {
      if (!visited.has(neighbor)) {
        visited.add(neighbor);
        parent.set(neighbor, { from: current, vertical, direction });
        queue.push(neighbor);
      }
    }
  }

  console.log(`❌ No path found`);
  return null;
}

// ✅ Updated handleMultiFloorRoute to use the fixed path finding
export const handleMultiFloorRoute = async (
  from: IMapItem,
  to: IMapItem,
  via: string,
  setMultiFloorRoute: (
    steps: RouteStep[],
    finalDestination: IMapItem,
    preCalculatedRoutes?: Map<string, string[]>
  ) => void,
  setSelectedFloorMap: (floor: string) => void
) => {
  useMapStore.getState().setIsCalculatingRoute(true);
  await new Promise((resolve) => setTimeout(resolve, 0));

  console.log('🎯 Starting multi-floor route creation...');
  console.log(`   From: ${from.name} (${from.floor})`);
  console.log(`   To: ${to.name} (${to.floor})`);
  console.log(`   Via: ${via}`);

  const steps: RouteStep[] = [];

  const getFloorKey = (floorIdentifier: string): string => {
    if (!floorIdentifier) return 'ground';

    const identifier = floorIdentifier.toLowerCase().trim();

    const floor = floors.find(
      (f) =>
        f.key === identifier ||
        f.name.toLowerCase() === identifier ||
        f.aliases.some((a) => a.toLowerCase() === identifier)
    );

    if (floor) {
      console.log(`   🔑 Resolved "${floorIdentifier}" → key: "${floor.key}"`);
      return floor.key;
    }

    console.warn(`   ⚠️ Could not resolve floor: "${floorIdentifier}"`);
    return identifier;
  };

  try {
    const verticals = await loadVerticals(from.floor);
    await new Promise((resolve) => setTimeout(resolve, 0));

    // ✅ Use fixed BFS with bidirectional support
    const connectorPath = findMultiFloorPath(verticals, from.floor, to.floor, via);

    if (!connectorPath || connectorPath.length === 0) {
      console.error(`No ${via} path found between floors`);
      useMapStore.getState().setIsCalculatingRoute(false);
      return null;
    }

    console.log(`✅ Will traverse ${connectorPath.length} floor(s)`);
    console.log(
      `   Direction: ${connectorPath[0].direction === 'up' ? '⬆️ Upward' : '⬇️ Downward'}`
    );

    // ✅ Step 1: Origin floor - from location to first connector
    const firstConnector = connectorPath[0];
    const originFloorKey = getFloorKey(from.floor);

    steps.push({
      floor: originFloorKey,
      from: from.name,
      fromId: from.id,
      to: via,
      toId: firstConnector.from, // Already corrected by BFS
      isVerticalTransition: false,
    });

    console.log(
      `   [${steps.length}] ${from.floor}: ${from.name} → ${firstConnector.labelFrom || via}`
    );

    // ✅ Traverse each connector - now properly handles both directions
    for (let i = 0; i < connectorPath.length; i++) {
      const connector = connectorPath[i];

      const getFloorKeyFromNode = (nodeId: string): string => {
        const floorPart = nodeId.split('_')[0];
        return getFloorKey(floorPart);
      };

      const fromFloorKey = getFloorKeyFromNode(connector.from);
      const toFloorKey = getFloorKeyFromNode(connector.to);

      console.log(
        `[${steps.length + 1}] ${fromFloorKey} → ${toFloorKey}: ${via} (${connector.direction})`
      );

      const isLastConnector = i === connectorPath.length - 1;

      if (!isLastConnector) {
        const nextConnector = connectorPath[i + 1];

        steps.push({
          floor: toFloorKey,
          from: connector.labelTo || connector.to, // Use label for display
          fromId: connector.to, // ✅ Specific connector exit ID
          to: nextConnector.labelFrom || nextConnector.from, // Use label for display
          toId: nextConnector.from, // ✅ Specific next connector entrance ID
          isVerticalTransition: false,
        });

        console.log(
          `   [${steps.length}] ${toFloorKey}: ${connector.to} → ${nextConnector.from} (connector-to-connector)`
        );
      } else {
        // ✅ Final floor: connector exit to destination
        const destFloorKey = getFloorKey(to.floor);

        steps.push({
          floor: destFloorKey,
          from: connector.labelTo || connector.to, // Use label for display
          fromId: connector.to, // ✅ Specific connector exit ID
          to: to.name,
          toId: to.id,
          isVerticalTransition: false,
        });

        console.log(`   [${steps.length}] ${to.floor}: ${connector.to} → ${to.name} (final)`);
      }
    }

    console.log(`✅ Multi-floor route created: ${steps.length} steps`);

    // Load floor data and pre-calculate routes (unchanged)
    const allFloorsData = new Map<
      string,
      { maps: IMapItem[]; nodes: INodes[]; entrances: IEntrances[] }
    >();

    const uniqueFloorKeys = [...new Set(steps.map((s) => s.floor))];
    console.log(`   Loading data for floors:`, uniqueFloorKeys);

    await Promise.all(
      uniqueFloorKeys.map(async (floorKey) => {
        try {
          const data = await loadMapData(floorKey);
          allFloorsData.set(floorKey, {
            maps: data.maps,
            nodes: data.nodes,
            entrances: data.entrances,
          });
          console.log(`   ✅ Loaded data for floor key: ${floorKey}`);
        } catch (err) {
          console.error(`   ❌ Failed to load data for ${floorKey}:`, err);
        }
      })
    );

    const preCalculatedRoutes = await preCalculateMultiFloorRoutes(steps, allFloorsData);
    console.log(`✅ Pre-calculated ${preCalculatedRoutes.size} route segments`);

    const startingFloorKey = getFloorKey(from.floor);
    setMultiFloorRoute(steps, to, preCalculatedRoutes);
    setSelectedFloorMap(startingFloorKey);

    console.log(`✅ Multi-floor route setup complete. Starting on floor: ${startingFloorKey}`);

    return steps;
  } catch (err) {
    console.error('Error setting up multi-floor route:', err);
    useMapStore.getState().setIsCalculatingRoute(false);
    return null;
  }
};
