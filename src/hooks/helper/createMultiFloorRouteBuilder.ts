// src/hooks/helper/createMultiFloorRouteBuilder.ts
import type { IMapItem, RouteStep } from '@/types/index';
import { createFloorKeyResolver } from '@/hooks/helper/createFloorKeyResolver';

export function createMultiFloorRouteBuilder() {
  const { getFloorKey, getFloorKeyFromNode } = createFloorKeyResolver();

  function buildRouteSteps(from: IMapItem, to: IMapItem, via: string, connectorPath: any[]): RouteStep[] {
    const steps: RouteStep[] = [];

    // Step 1: Origin floor - from location to first connector
    const firstConnector = connectorPath[0];
    const originFloorKey = getFloorKey(from.floor);

    steps.push({
      floor: originFloorKey,
      from: from.name,
      fromId: from.id,
      to: via,
      toId: firstConnector.from,
      isVerticalTransition: false,
    });

    console.log(`   [${steps.length}] ${from.floor}: ${from.name} → ${firstConnector.labelFrom || via}`);

    // Traverse each connector
    for (let i = 0; i < connectorPath.length; i++) {
      const connector = connectorPath[i];
      const fromFloorKey = getFloorKeyFromNode(connector.from);
      const toFloorKey = getFloorKeyFromNode(connector.to);

      console.log(`[${steps.length + 1}] ${fromFloorKey} → ${toFloorKey}: ${via} (${connector.direction})`);

      const isLastConnector = i === connectorPath.length - 1;

      if (!isLastConnector) {
        const nextConnector = connectorPath[i + 1];

        steps.push({
          floor: toFloorKey,
          from: connector.labelTo || connector.to,
          fromId: connector.to,
          to: nextConnector.labelFrom || nextConnector.from,
          toId: nextConnector.from,
          isVerticalTransition: false,
        });

        console.log(
          `   [${steps.length}] ${toFloorKey}: ${connector.to} → ${nextConnector.from} (connector-to-connector)`
        );
      } else {
        // Final floor: connector exit to destination
        const destFloorKey = getFloorKey(to.floor);

        steps.push({
          floor: destFloorKey,
          from: connector.labelTo || connector.to,
          fromId: connector.to,
          to: to.name,
          toId: to.id,
          isVerticalTransition: false,
        });

        console.log(`   [${steps.length}] ${to.floor}: ${connector.to} → ${to.name} (final)`);
      }
    }

    console.log(`✅ Multi-floor route created: ${steps.length} steps`);
    return steps;
  }

  return { buildRouteSteps };
}
