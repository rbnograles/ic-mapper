// src/routing/utils/createRoutePreCalculation.ts
import type { Graph, IEntrances, IMapItem, INodes, RouteStep } from '@/types/index';
import { findPathBetweenPlacesOptimized } from '@/routing/algorithms/routing';
import { floors } from '@/routing/utils/Constants';

export function createRoutePreCalculation() {
  async function preCalculateMultiFloorRoutes(
    steps: RouteStep[],
    allFloorsData: Map<string, { maps: IMapItem[]; nodes: INodes[]; entrances: IEntrances[] }>
  ): Promise<Map<string, string[]>> {
    const preCalculated = new Map<string, string[]>();
    const lastIndex = steps.length - 1;

    for (let idx = 0; idx < steps.length; idx++) {
      const step = steps[idx];
      if (step.isVerticalTransition) continue;

      const floorKey = step.floor;
      const floorData = allFloorsData.get(floorKey);

      if (!floorData) {
        console.warn(`   ⚠️ No floor data found for key: ${floorKey}`);
        continue;
      }

      const { maps, nodes, entrances } = floorData;

      if (!maps || !nodes || !entrances) {
        console.warn(`   ⚠️ Incomplete floor data for key: ${floorKey}`);
        continue;
      }

      const from = step.fromId || step.from;
      const to = step.toId || step.to;

      const floorObj = floors.find((f) => f.key === floorKey);
      const floorName = floorObj ? floorObj.name : floorKey;

      const key = `${floorName}:${from}:${to}`;

      try {
        const floorMap = {
          nodes,
          entrances,
          maps,
        } as unknown as Graph;

        const resolveIdentifier = (candidate: string): string => {
          const byId = maps.find((m: { id: string }) => m.id === candidate);
          if (byId) return byId.id;

          const byName = maps.find((m: { name: string }) => m.name === candidate);
          if (byName) return byName.name;

          const mapViaEntrance = maps.find(
            (m: { entranceNodes?: string[] }) =>
              Array.isArray(m.entranceNodes) && m.entranceNodes.includes(candidate)
          );
          if (mapViaEntrance) return mapViaEntrance.id ?? mapViaEntrance.name;

          const entrance = entrances.find((e: { id: string }) => e.id === candidate);
          if (entrance) return candidate;

          return candidate;
        };

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

  return { preCalculateMultiFloorRoutes };
}
