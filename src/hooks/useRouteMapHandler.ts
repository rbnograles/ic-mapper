import { findPathBetweenPlacesOptimized } from '@/utils/routing';
import { floors } from '@/pages/IndoorMap/partials/floors';
import type { Graph, IEntrances, IMapItem, INodes, RouteStep } from '@/interface/index';
import useMapStore from '@/store/MapStore';
import { loadVerticals, findVerticalConnector } from '@/utils/verticalProcessor';
import { getCachedRoute, setCachedRoute } from '@/utils/routeCache';
import { loadMapData } from '@/utils/mapLoader';

// Track active calculations to enable cleanup
const activeCalculations = new Map<
  string,
  {
    isPreCalculation?: boolean;
  }
>();

// ✅ Helper function to normalize floor names consistently
function normalizeFloorName(floorIdentifier: string): string {
  const floor = floors.find(
    (f) =>
      f.key === floorIdentifier ||
      f.name.toLowerCase() === floorIdentifier.toLowerCase() ||
      f.aliases.some((a) => a.toLowerCase() === floorIdentifier.toLowerCase())
  );
  return floor ? floor.name : floorIdentifier;
}

// ✅ Helper to create consistent cache keys
function createRouteKey(floor: string, from: string, to: string): string {
  const normalizedFloor = normalizeFloorName(floor);
  return `${normalizedFloor}:${from}:${to}`;
}

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

  // ✅ FIX: Use normalized floor name for key creation
  const currentFloorName = normalizeFloorName(selectedFloorMap);
  const preCalculatedKey = createRouteKey(currentFloorName, from, to);
  
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

  // ✅ Check cache with normalized key
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

  // ✅ Set loading state IMMEDIATELY
  setIsCalculatingRoute(true);
  console.log('🔄 Starting route calculation:', { from, to, floor: currentFloorName });

  const calculationKey = `${selectedFloorMap}-${from}-${to}`;
  const existing = activeCalculations.get(calculationKey);
  if (existing) {
    activeCalculations.delete(calculationKey);
  }

  // ✅ Adaptive debounce based on device
  const debounceTime = /iPhone|iPad|iPod/.test(navigator.userAgent) ? 30 : 50;

  return new Promise((resolve) => {
    const timeoutId = setTimeout(() => {
      const floorMap = { nodes, entrances, maps } as unknown as Graph;

      function resolvePlaceCandidate(candidate: string): string {
        if (!candidate) return candidate;
        const byId = maps.find((m) => m.id === candidate);
        if (byId) return byId.id;
        const byName = maps.find((m) => m.name === candidate);
        if (byName) return byName.name;
        const mapViaEntrance = maps.find(
          (m) =>
            Array.isArray((m as any).entranceNodes) && 
            (m as any).entranceNodes.includes(candidate)
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

  for (const step of steps) {
    if (step.isVerticalTransition) continue;

    // ✅ FIX: Normalize floor name before looking up data
    const normalizedFloor = normalizeFloorName(step.floor);
    const floorData: any = allFloorsData.get(step.floor) || allFloorsData.get(normalizedFloor);
    
    if (!floorData) {
      console.warn(`No floor data found for ${step.floor} (normalized: ${normalizedFloor})`);
      continue;
    }

    const from = step.fromId || step.from;
    const to = step.toId || step.to;
    
    // ✅ Use consistent key creation
    const key = createRouteKey(step.floor, from, to);

    try {
      const floorMap = {
        nodes: floorData.nodes,
        entrances: floorData.entrances,
        maps: floorData.maps,
      } as unknown as Graph;

      function resolveIdentifier(candidate: string): string {
        const byId = floorData.maps.find((m: { id: string }) => m.id === candidate);
        if (byId) return byId.name || byId.id;
        const byName = floorData.maps.find((m: { name: string }) => m.name === candidate);
        if (byName) return byName.name;
        const entrance = floorData.entrances.find((e: { id: string }) => e.id === candidate);
        if (entrance) return candidate;
        return candidate;
      }

      const resolvedFrom = resolveIdentifier(from);
      const resolvedTo = resolveIdentifier(to);

      const path = findPathBetweenPlacesOptimized(floorMap, resolvedFrom, resolvedTo);
      
      if (path && path.nodes && path.nodes.length > 0) {
        preCalculated.set(key, path.nodes);
        console.log(`⚡ Pre-calculated: ${key} (${path.nodes.length} nodes)`);
      } else {
        console.warn(`Failed to pre-calculate ${key}: No path found`);
      }
    } catch (err) {
      console.warn(`Failed to pre-calculate ${key}:`, err);
    }
  }

  return preCalculated;
}
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
  
  // ✅ Yield to browser to render the loader
  await new Promise(resolve => setTimeout(resolve, 0));
  
  console.log('🎯 Starting multi-floor route creation...');

  const steps: RouteStep[] = [];

  try {
    // ✅ FIX #2: Wrap heavy sync work in async chunks
    const verticals = await loadVerticals(from.floor);
    
    // Yield again after loading
    await new Promise(resolve => setTimeout(resolve, 0));
    
    const connector = findVerticalConnector(verticals, from.floor, to.floor, via);

    if (!connector) {
      console.error(`No ${via} connector found between floors`);
      useMapStore.getState().setIsCalculatingRoute(false);
      return null;
    }

    // Build steps
    steps.push({
      floor: from.floor,
      from: from.name,
      to: connector.fromLabel,
      toId: connector.fromId,
      isVerticalTransition: false,
    });

    steps.push({
      floor: to.floor,
      from: connector.toLabel,
      fromId: connector.toId,
      to: connector.toLabel,
      isVerticalTransition: true,
    });

    steps.push({
      floor: to.floor,
      from: connector.toLabel,
      fromId: connector.toId,
      to: to.name,
      isVerticalTransition: false,
    });

    const byAlias: any = floors.find((f) => (f.aliases || []).includes(from.floor));

    console.log('🎯 Multi-floor route created:', {
      steps: steps.map((s) => `${s.floor}: ${s.from} → ${s.to}`),
      startingFloor: byAlias?.key,
    });

    // ✅ FIX #3: Load floor data in parallel with better error handling
    const allFloorsData = new Map<
      string,
      { maps: IMapItem[]; nodes: INodes[]; entrances: IEntrances[] }
    >();

    const uniqueFloors = [...new Set(steps.map((s) => s.floor))];

    const floorLoadPromises = uniqueFloors.map(async (floorName) => {
      const floorKey = floors.find(
        (f) =>
          f.name.toLowerCase() === floorName.toLowerCase() ||
          f.aliases.some((a) => a.toLowerCase() === floorName.toLowerCase())
      )?.key;

      if (!floorKey) {
        console.warn(`No floor key found for ${floorName}`);
        return;
      }

      try {
        const data = await loadMapData(floorKey);
        allFloorsData.set(floorName, {
          maps: data.maps,
          nodes: data.nodes,
          entrances: data.entrances,
        });
        console.log(`✅ Loaded data for ${floorName}`);
      } catch (err) {
        console.error(`Failed to load data for ${floorName}:`, err);
      }
    });

    await Promise.all(floorLoadPromises);

    // ✅ FIX #4: Pre-calculate routes with progress tracking
    const preCalculatedRoutes = await preCalculateMultiFloorRoutes(steps, allFloorsData);

    console.log(`✅ Pre-calculated ${preCalculatedRoutes.size} route segments`);

    // ✅ Store routes and switch floor
    setMultiFloorRoute(steps, to, preCalculatedRoutes);
    setSelectedFloorMap(byAlias.key);

    // ✅ Loader stays visible - will be cleared by routeMapHandler
    console.log('✅ Multi-floor route setup complete, starting first segment...');

    return steps;
  } catch (err) {
    console.error('Error setting up multi-floor route:', err);
    useMapStore.getState().setIsCalculatingRoute(false);
    return null;
  }
};
