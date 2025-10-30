import { useCallback } from 'react';
import type { IMapItem, FloorData } from '@/types';
import { handleMultiFloorRoute, routeMapHandler } from '@/hooks/useRouteMapHandler';
import useMapStore from '@/store/MapStore';

interface UseRouteHandlerProps {
  floorData: Omit<FloorData, 'floor'>;
  floorDataRef: React.MutableRefObject<Omit<FloorData, 'floor'>>;
  resolveMapItemIdentifier: (candidate: string) => string;
  setSelectedFloorMap: (floor: string) => void;
  setIsExpanded: (expanded: boolean) => void;
  setIsFloorMapOpen: (open: boolean) => void;
}

export function useRouteHandler({
  floorData,
  floorDataRef,
  resolveMapItemIdentifier,
  setSelectedFloorMap,
  setIsExpanded,
  setIsFloorMapOpen,
}: UseRouteHandlerProps) {
  const handleRoute = useCallback(
    async (from: IMapItem, to: IMapItem, via?: string) => {
      useMapStore.getState().setIsCalculatingRoute(true);

      requestAnimationFrame(() => {
        // Close drawer first
        setIsExpanded(false);
        setIsFloorMapOpen(false);

        requestAnimationFrame(async () => {
          // Extra delay on mobile for drawer animation
          const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
          if (isMobile) {
            await new Promise((resolve) => setTimeout(resolve, 100));
          }

          try {
            // Same floor routing
            if (from.floor === to.floor) {
              return routeMapHandler(
                from.name,
                to.name,
                floorData.maps,
                floorData.nodes,
                floorData.entrances,
                false
              );
            }

            // Multi-floor routing
            if (via) {
              const steps = await handleMultiFloorRoute(
                from,
                to,
                via,
                useMapStore.getState().setMultiFloorRoute,
                setSelectedFloorMap
              );

              if (steps && steps.length > 0) {
                const waitForFloorData = () => {
                  return new Promise<void>((resolve) => {
                    const checkData = () => {
                      const currentData = floorDataRef.current;
                      if (currentData.maps.length > 0 && currentData.nodes.length > 0) {
                        resolve();
                      } else {
                        setTimeout(checkData, 50);
                      }
                    };
                    checkData();
                  });
                };

                await waitForFloorData();

                const firstStep = steps[0];
                const routeFrom = firstStep.fromId
                  ? resolveMapItemIdentifier(firstStep.fromId)
                  : firstStep.from;
                const routeTo = firstStep.toId
                  ? resolveMapItemIdentifier(firstStep.toId)
                  : firstStep.to;

                return routeMapHandler(
                  routeFrom,
                  routeTo,
                  floorDataRef.current.maps,
                  floorDataRef.current.nodes,
                  floorDataRef.current.entrances,
                  true
                );
              }
            }

            return null;
          } catch (err) {
            console.error('Route handler error:', err);
            useMapStore.getState().setIsCalculatingRoute(false);
            return null;
          }
        });
      });
    },
    [
      floorData,
      floorDataRef,
      resolveMapItemIdentifier,
      setSelectedFloorMap,
      setIsExpanded,
      setIsFloorMapOpen,
    ]
  );

  return { handleRoute };
}