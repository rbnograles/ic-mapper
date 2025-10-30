import { useEffect } from 'react';
import type { FloorData } from '@/types';
import { floors } from '@/routing/utils/Constants';
import { floorMatches } from '@/routing/utils/verticalProcessor';
import { routeMapHandler } from '@/hooks/useRouteMapHandler';
import useMapStore from '@/store/MapStore';

interface UseMultiFloorContinuationProps {
  selectedFloorMap: string;
  isLoading: boolean;
  floorData: Omit<FloorData, 'floor'>;
  floorDataRef: React.MutableRefObject<Omit<FloorData, 'floor'>>;
  resolveMapItemIdentifier: (candidate: string) => string;
}

export function useMultiFloorContinuation({
  selectedFloorMap,
  isLoading,
  floorData,
  floorDataRef,
  resolveMapItemIdentifier,
}: UseMultiFloorContinuationProps) {
  useEffect(() => {
    const { multiFloorRoute } = useMapStore.getState();

    if (!multiFloorRoute?.isActive) return;
    if (isLoading) return;
    if (!floorData.maps.length || !floorData.nodes.length) {
      console.warn('Floor data not ready yet, waiting...');
      return;
    }

    const currentStep = multiFloorRoute.steps[multiFloorRoute.currentStep];

    if (!currentStep) {
      console.warn('No current step found');
      return;
    }

    if (!floorMatches(currentStep.floor, selectedFloorMap)) {
      console.log(
        `⏳ Waiting for correct floor. Current: ${selectedFloorMap}, Expected: ${currentStep.floor}`
      );
      return;
    }

    console.log(
      `🎯 Processing step ${multiFloorRoute.currentStep + 1}/${multiFloorRoute.steps.length}`
    );
    console.log(`   Floor: ${currentStep.floor}`);
    console.log(`   Route: ${currentStep.from} → ${currentStep.to}`);

    const currentFloorName =
      floors.find((f) => f.key === selectedFloorMap)?.name || selectedFloorMap;

    const preCalculatedKey = `${currentFloorName}:${currentStep.fromId || currentStep.from}:${currentStep.toId || currentStep.to}`;

    const preCalculated = multiFloorRoute.preCalculatedRoutes?.get(preCalculatedKey);

    if (preCalculated && preCalculated.length > 0) {
      console.log(`⚡ Using pre-calculated route (${preCalculated.length} nodes)`);

      queueMicrotask(() => {
        useMapStore.getState().setActiveNodeIds(preCalculated);
        useMapStore.getState().setIsCalculatingRoute(false);
        useMapStore.getState().setCurrentStepNodes(preCalculated);

        // Highlight the destination
        let destMap = null;

        if (currentStep.toId) {
          destMap = floorData.maps.find((m) => m.id === currentStep.toId) ?? null;
        }

        if (!destMap && currentStep.to) {
          const isEntranceId = floorData.entrances.some((e) => e.id === currentStep.to);
          if (isEntranceId) {
            destMap =
              floorData.maps.find(
                (m) => Array.isArray(m.entranceNodes) && m.entranceNodes.includes(currentStep.to)
              ) ?? null;
          }
        }

        if (!destMap && currentStep.to) {
          const nameMatches = floorData.maps.filter((m) => m.name === currentStep.to);
          if (nameMatches.length === 1) {
            destMap = nameMatches[0];
          } else if (nameMatches.length > 1) {
            console.warn(
              `[highlight] name "${currentStep.to}" matched ${nameMatches.length} maps — skipping highlight to avoid highlighting multiples.`
            );
          }
        }

        if (destMap) {
          console.log(`[highlight] highlighting dest map id=${destMap.id} name="${destMap.name}"`);
          useMapStore.getState().setHighlightedPlace(destMap);
        } else {
          console.log('[highlight] no unique destMap found — not highlighting');
        }
      });

      return;
    }

    // Calculate route if not pre-calculated
    useMapStore.getState().setIsCalculatingRoute(true);

    let cancelled = false;

    (async () => {
      try {
        await new Promise((resolve) => setTimeout(resolve, 50));

        const currentFloorData = floorDataRef.current;

        if (cancelled || !currentFloorData.maps.length) {
          console.warn('Floor data became invalid during calculation');
          useMapStore.getState().setIsCalculatingRoute(false);
          return;
        }

        const routeFrom = currentStep.fromId
          ? resolveMapItemIdentifier(currentStep.fromId)
          : currentStep.from;
        const routeTo = currentStep.toId
          ? resolveMapItemIdentifier(currentStep.toId)
          : currentStep.to;

        console.log(`🔄 Calculating route: ${routeFrom} → ${routeTo}`);

        const result = await routeMapHandler(
          routeFrom as string,
          routeTo as string,
          currentFloorData.maps,
          currentFloorData.nodes,
          currentFloorData.entrances,
          true
        );

        if (!cancelled && result) {
          useMapStore.getState().setCurrentStepNodes(result);

          const destMap = currentFloorData.maps.find(
            (m) => m.id === currentStep.toId || m.name === currentStep.to
          );
          if (destMap) {
            useMapStore.getState().setHighlightedPlace(destMap);
          }
        } else if (!cancelled) {
          console.error('Route calculation returned no result');
          useMapStore.getState().setIsCalculatingRoute(false);
        }
      } catch (err) {
        console.error('Failed to continue multi-floor route', err);
        if (!cancelled) {
          useMapStore.getState().setIsCalculatingRoute(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [
    selectedFloorMap,
    isLoading,
    resolveMapItemIdentifier,
    floorData.maps.length,
    floorData.nodes.length,
    useMapStore.getState().multiFloorRoute.currentStep,
  ]);
}