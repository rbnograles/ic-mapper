// routeCalculationUtil.ts (new file, replace useRouteCalculation)
import type { Graph, IEntrances, IMapItem, INodes } from '@/types/index';
import { findPathBetweenPlacesOptimized } from '@/routing/algorithms/routing';
import { floors } from '@/routing/utils/Constants';
import useMapStore from '@/store/MapStore';
import { getCachedRoute, setCachedRoute } from '@/routing/utils/routeCache';
import { Normalizer } from '@/routing/utils/Normalizer';

const activeCalculations = new Map<string, { isPreCalculation?: boolean }>();
const NormalizeFloor = new Normalizer(floors);

interface CreateRouteCalculationProps {
  maps: IMapItem[];
  nodes: INodes[];
  entrances: IEntrances[];
  selectedFloorMap: string;
}

export function createRouteCalculation({
  maps,
  nodes,
  entrances,
  selectedFloorMap,
}: CreateRouteCalculationProps) {
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

  async function calculateRoute(
    from: string,
    to: string,
    forceCalculation: boolean = false
  ): Promise<string[] | null> {
    const mapStore = useMapStore.getState();
    const setActiveNodeIds = mapStore.setActiveNodeIds;
    const setSelectedId = mapStore.setSelectedId;
    const setIsCalculatingRoute = mapStore.setIsCalculatingRoute;

    if (!from || !to) return null;

    const currentFloorName = NormalizeFloor.normalizeFloorName(selectedFloorMap);
    const preCalculatedKey = NormalizeFloor.createRouteKey(currentFloorName, from, to);

    const preCalculated = mapStore.multiFloorRoute.preCalculatedRoutes?.get(preCalculatedKey);

    if (preCalculated && preCalculated.length > 0) {
      queueMicrotask(() => {
        setActiveNodeIds(preCalculated);
        setSelectedId(to);
        setIsCalculatingRoute(false);
      });
      return preCalculated;
    }

    if (!forceCalculation) {
      const cachedNodes = getCachedRoute(selectedFloorMap, from, to);
      if (cachedNodes) {
        queueMicrotask(() => {
          setActiveNodeIds(cachedNodes);
          setSelectedId(to);
          setIsCalculatingRoute(false);
        });
        return cachedNodes;
      }
    }

    setIsCalculatingRoute(true);

    const calculationKey = `${selectedFloorMap}-${from}-${to}`;
    if (activeCalculations.has(calculationKey)) {
      // optionally handle deduplication
      activeCalculations.delete(calculationKey);
    }

    const debounceTime = /iPhone|iPad|iPod/.test(navigator.userAgent) ? 30 : 50;

    return new Promise((resolve) => {
      setTimeout(() => {
        const floorMap = { nodes, entrances, maps } as unknown as Graph;

        const resolvedFrom = resolvePlaceCandidate(from);
        const resolvedTo = resolvePlaceCandidate(to);

        try {
          const path = findPathBetweenPlacesOptimized(floorMap, resolvedFrom, resolvedTo);

          if (!path || !Array.isArray(path.nodes) || path.nodes.length === 0) {
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

  return { calculateRoute, resolvePlaceCandidate };
}
