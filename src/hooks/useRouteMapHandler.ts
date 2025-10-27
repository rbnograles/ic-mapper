import { findPathBetweenPlacesOptimized } from '@/utils/routing';
import { floors } from '@/pages/IndoorMap/partials/floors';
import type { Graph, IEntrances, IMapItem, INodes, RouteStep } from '@/interface/index';
import useMapStore from '@/store/MapStore';
import { loadVerticals, findVerticalConnector } from '@/utils/verticalProcessor';
import { getCachedRoute, setCachedRoute } from '@/utils/routeCache';
import { requestIdleCallback, cancelIdleCallback } from '@/utils/polyfills';

// Track active calculations to enable cleanup
const activeCalculations = new Map<
  string,
  {
    timeoutId: NodeJS.Timeout;
    idleCallbackId: number;
  }
>();

export async function routeMapHandler(
  from: string,
  to: string,
  maps: IMapItem[],
  nodes: INodes[],
  entrances: IEntrances[],
  forceCalculation: boolean = false // ✅ NEW PARAMETER
): Promise<string[] | null> {
  const mapStore = useMapStore.getState();
  const selectedFloorMap = mapStore.selectedFloorMap;
  const setActiveNodeIds = mapStore.setActiveNodeIds;
  const setSelectedId = mapStore.setSelectedId;
  const setIsCalculatingRoute = mapStore.setIsCalculatingRoute;

  if (!from || !to) {
    return null;
  }

  // ✅ Check cache first (unless forced to recalculate)
  if (!forceCalculation) {
    const cachedNodes = getCachedRoute(selectedFloorMap, from, to);
    if (cachedNodes) {
      console.log(`✅ Cache hit for ${from} → ${to}`);
      setActiveNodeIds(cachedNodes);
      setSelectedId(to);
      return cachedNodes;
    }
  }

  // ✅ Set loading state for actual calculations
  setIsCalculatingRoute(true);
  console.log('🔄 Starting route calculation:', { from, to, floor: selectedFloorMap });

  // Create calculation key for tracking
  const calculationKey = `${selectedFloorMap}-${from}-${to}`;

  // Cancel any existing calculation for this route
  const existing = activeCalculations.get(calculationKey);
  if (existing) {
    clearTimeout(existing.timeoutId);
    cancelIdleCallback(existing.idleCallbackId);
    activeCalculations.delete(calculationKey);
  }

  // Debounce the pathfinding
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

      // Schedule heavy computation during idle time
      const idleCallbackId = requestIdleCallback(() => {
        try {
          const path = findPathBetweenPlacesOptimized(floorMap, resolvedFrom, resolvedTo);

          if (!path || !Array.isArray(path.nodes) || path.nodes.length === 0) {
            console.warn('❌ No route found between', from, 'and', to);
            setActiveNodeIds([]);
            resolve(null);
            return;
          }

          const orderedNodes = path.nodes;

          // Cache the result
          setCachedRoute(selectedFloorMap, from, to, orderedNodes);

          setActiveNodeIds(orderedNodes);
          setSelectedId(to);
          console.log('✅ Route calculation complete:', orderedNodes.length, 'nodes');
          resolve(orderedNodes);
        } catch (error) {
          console.error('Error calculating route:', error);
          setActiveNodeIds([]);
          resolve(null);
        } finally {
          // ✅ Clear loading state when calculation finishes
          setIsCalculatingRoute(false);
          // Clean up tracking
          activeCalculations.delete(calculationKey);
        }
      });

      // Track this calculation
      activeCalculations.set(calculationKey, { timeoutId, idleCallbackId });
    }, 100); // 100ms debounce
  });
}

// Cleanup function to cancel all pending calculations
export function cancelAllRouteCalculations(): void {
  activeCalculations.forEach(({ timeoutId, idleCallbackId }) => {
    clearTimeout(timeoutId);
    cancelIdleCallback(idleCallbackId);
  });
  activeCalculations.clear();

  // Also clear the loading state
  useMapStore.getState().setIsCalculatingRoute(false);
}

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
    to: connector.fromLabel,
    toId: connector.fromId,
    isVerticalTransition: false,
  });

  // Step 2: vertical transition step
  steps.push({
    floor: to.floor,
    from: connector.toLabel,
    fromId: connector.toId,
    to: connector.toLabel,
    isVerticalTransition: true,
  });

  // Step 3: route from connector to final destination
  steps.push({
    floor: to.floor,
    from: connector.toLabel,
    fromId: connector.toId,
    to: to.name,
    isVerticalTransition: false,
  });

  const byAlias: any = floors.find((f) => (f.aliases || []).includes(from.floor));
  
  console.log('🎯 Multi-floor route created:', {
    steps: steps.map(s => `${s.floor}: ${s.from} → ${s.to}`),
    startingFloor: byAlias?.key
  });
  
  setMultiFloorRoute(steps, to);
  setSelectedFloorMap(byAlias.key);
  return steps;
};