import type { IEntrances, IMapItem, INodes, RouteStep } from '@/types/index';
import useMapStore from '@/store/MapStore';
import { loadMapData } from '@/routing/utils/mapLoader';
import { loadVerticals } from '@/routing/utils/verticalProcessor';
import { createRouteCalculation } from '@/hooks/helper/createRouteCalculation';
import { createFloorKeyResolver } from '@/hooks/helper/createFloorKeyResolver';
import { createMultiFloorPathfinding } from '@/hooks/helper/createMultiFloorPathfinding';
import { createRoutePreCalculation } from '@/hooks/helper/createRoutePreCalculation';
import { createMultiFloorRouteBuilder } from '@/hooks/helper/createMultiFloorRouteBuilder';

/**
 * Main route handler function - can be used standalone or with the hook
 */
export async function routeMapHandler(
  from: string,
  to: string,
  maps: IMapItem[],
  nodes: INodes[],
  entrances: IEntrances[],
  forceCalculation: boolean = false
): Promise<string[] | null> {
  const selectedFloorMap = useMapStore.getState().selectedFloorMap;

  // Use the calculation hook's logic directly
  const { calculateRoute } = createRouteCalculation({ maps, nodes, entrances, selectedFloorMap });

  return calculateRoute(from, to, forceCalculation);
}

/**
 * Multi-floor route handler with all logic extracted to custom hooks
 */
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

  const { getFloorKey } = createFloorKeyResolver();
  const { findMultiFloorPath } = createMultiFloorPathfinding();
  const { preCalculateMultiFloorRoutes } = createRoutePreCalculation();
  const { buildRouteSteps } = createMultiFloorRouteBuilder();

  try {
    // Load verticals data
    const verticals = await loadVerticals(from.floor);
    await new Promise((resolve) => setTimeout(resolve, 0));

    // Find path through floors
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

    // Build route steps
    const steps = buildRouteSteps(from, to, via, connectorPath);

    // Load floor data for all unique floors
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

    // Pre-calculate all route segments
    const preCalculatedRoutes = await preCalculateMultiFloorRoutes(steps, allFloorsData);
    console.log(`✅ Pre-calculated ${preCalculatedRoutes.size} route segments`);

    // Set up the multi-floor route
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