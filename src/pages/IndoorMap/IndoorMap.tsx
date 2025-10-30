import { useState, useEffect, useCallback, useRef } from 'react';
import { Box, CssBaseline, Typography } from '@mui/material';
import { ThemeProvider } from '@mui/material/styles';
import theme from '@/styles/theme';
import { layoutStyles } from '@/styles/layoutStyles';
import BottomNavBar from '@/components/navigation/BottomNavBar';
import SearchAppBar from '@/components/navigation/SearchAppBar';
import { loadMapData } from '@/routing/utils/mapLoader';
import type { FloorData, IMapItem } from '@/types';
import FloorCardSelector from '@/components/drawers/FloorSelection';

// floors: [{ key, name, assets? }]
import { floors } from '@/routing/utils/Constants';

// Reuse single map component for all floors
import MapBuilder from '@/components/map/Maps';

// plain function
import { handleMultiFloorRoute, routeMapHandler } from '@/hooks/useRouteMapHandler';



import useMapStore from '@/store/MapStore';
import useDrawerStore from '@/store/DrawerStore';
import { floorMatches, preloadVerticals } from '@/routing/utils/verticalProcessor';

import CalculatingRouteIndicatorModern from '@/components/common/CalculatingRouteLoader';

export function IndoorMap() {
  // MapStore
  // Actions
  const resetMap = useMapStore((state) => state.resetMap);
  const handlePathSelect = useMapStore((state) => state.handlePathSelect);
  const setIMapItems = useMapStore((state) => state.setMapItems);
  const setActiveNodeIds = useMapStore((state) => state.setActiveNodeIds);

  // Drawer Store
  const isLoading = useDrawerStore((state) => state.isLoading);
  const setIsLoading = useDrawerStore((state) => state.setIsLoading);
  const setIsExpanded = useDrawerStore((state) => state.setIsExpanded);
  const setIsFloorMapOpen = useDrawerStore((state) => state.setIsFloorMapOpen);

  const selectedFloorMap = useMapStore((state) => state.selectedFloorMap);
  const setSelectedFloorMap = useMapStore((state) => state.setSelectedFloorMap);
  const isCalculatingRoute = useMapStore((state) => state.isCalculatingRoute);

  const loadedFloorsRef = useRef(new Set<string>());

  const [selectedMapName, setSelectedMapName] = useState<string>('');

  // Data states
  const [floorData, setFloorData] = useState<Omit<FloorData, 'floor'>>({
    maps: [],
    nodes: [],
    entrances: [],
    buidingMarks: [],
    roadMarks: [],
    boundaries: [],
  });

  const floorDataRef = useRef(floorData);
  useEffect(() => {
    floorDataRef.current = floorData;
  }, [floorData]);

  useEffect(() => {
    preloadVerticals();
  }, []);

  useEffect(() => {
    const floor = floors.find((f) => f.key === selectedFloorMap);
    setSelectedMapName(floor?.name ?? '');
  }, [selectedFloorMap]);

  const handlePathSearchBehavior = (path: IMapItem | null) => {
    setIMapItems(path as IMapItem);
  };

  const resolveMapItemIdentifier = useCallback(
    (candidate: string) => {
      const existsAsId =
        floorData.maps.some((m) => m.id === candidate) ||
        floorData.entrances.some((e) => e.id === candidate);
      return existsAsId ? candidate : candidate;
    },
    [floorData.maps, floorData.entrances]
  );

  const getLocationFromHistory = (history: any) => {
    if (history.type === 'Route') {
      setActiveNodeIds(history.raw.nodes);
      return;
    }
    handlePathSelect(history);
  };

  const handleRoute = useCallback(
    async (from: IMapItem, to: IMapItem, via?: string) => {
      useMapStore.getState().setIsCalculatingRoute(true);

      requestAnimationFrame(() => {
        // Close drawer first
        setIsExpanded(false);
        setIsFloorMapOpen(false);

        requestAnimationFrame(async () => {
          // ✅ Extra delay on mobile for drawer animation
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
    [floorData, resolveMapItemIdentifier, setSelectedFloorMap, setIsExpanded, setIsFloorMapOpen]
  );

  // state change for floor rendering
  // if page refreshed it will go to ground floor
  // we can use cache once requirement to retain floor comes
  const openFloor = (floorKeyToOpen: string) => {
    setSelectedFloorMap(floorKeyToOpen);
    setIsFloorMapOpen(false);
    setIsExpanded(false);
    resetMap();
  };

  // Load map + node data dynamically when floor changes
  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);

    const floorKey = selectedFloorMap ?? floors[0].key;

    loadMapData(floorKey)
      .then((data) => {
        if (!isMounted) return;

        setFloorData({
          maps: data.maps,
          nodes: data.nodes,
          entrances: data.entrances,
          buidingMarks: data.buidingMarks ?? [],
          roadMarks: data.roadMarks ?? [],
          boundaries: data.boundaries ?? [],
        });

        // Mark floor as loaded
        loadedFloorsRef.current.add(floorKey);
        setIsLoading(false);
      })
      .catch((err) => {
        console.error('Error loading map data:', err);
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [selectedFloorMap]);

  // ✅ UPDATED: Multi-floor route continuation logic
  useEffect(() => {
    const { multiFloorRoute } = useMapStore.getState();

    if (!multiFloorRoute?.isActive) return;
    if (isLoading) return;
    if (!floorData.maps.length || !floorData.nodes.length) {
      console.warn('Floor data not ready yet, waiting...');
      return;
    }

    // ✅ Get the CURRENT step using currentStep index
    const currentStep = multiFloorRoute.steps[multiFloorRoute.currentStep];

    if (!currentStep) {
      console.warn('No current step found');
      return;
    }

    // ✅ Check if this step matches the current floor
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

    // ✅ Get current floor name
    const currentFloorName =
      floors.find((f) => f.key === selectedFloorMap)?.name || selectedFloorMap;

    // ✅ Create key for pre-calculated route
    const preCalculatedKey = `${currentFloorName}:${currentStep.fromId || currentStep.from}:${currentStep.toId || currentStep.to}`;

    const preCalculated = multiFloorRoute.preCalculatedRoutes?.get(preCalculatedKey);

    if (preCalculated && preCalculated.length > 0) {
      console.log(`⚡ Using pre-calculated route (${preCalculated.length} nodes)`);

      queueMicrotask(() => {
        setActiveNodeIds(preCalculated);
        useMapStore.getState().setIsCalculatingRoute(false);

        // ✅ Store nodes in the multi-floor route state
        useMapStore.getState().setCurrentStepNodes(preCalculated);

        // ✅ Highlight the destination
        // ✅ Highlight the destination (prefer id → entrance owner → unique name)
        let destMap = null;

        // 1) Prefer explicit destination id
        if (currentStep.toId) {
          destMap = floorData.maps.find((m) => m.id === currentStep.toId) ?? null;
        }

        // 2) If no id, but `to` is an entrance id, find the map that contains that entrance
        if (!destMap && currentStep.to) {
          const isEntranceId = floorData.entrances.some((e) => e.id === currentStep.to);
          if (isEntranceId) {
            destMap =
              floorData.maps.find(
                (m) => Array.isArray(m.entranceNodes) && m.entranceNodes.includes(currentStep.to)
              ) ?? null;
          }
        }

        // 3) Last-resort: only use name if it's unique on this floor
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

    // ✅ If not pre-calculated, calculate now
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
          // ✅ Store the calculated nodes
          useMapStore.getState().setCurrentStepNodes(result);

          // ✅ Highlight destination
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
    // ✅ IMPORTANT: Trigger on step changes
    useMapStore.getState().multiFloorRoute.currentStep,
  ]);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box sx={layoutStyles.appRoot}>
        {/* 🔍 Search Bar */}
        <Box sx={layoutStyles.fixedTop}>
          <SearchAppBar
            onSelect={handlePathSelect}
            handlePathSearchBehavior={handlePathSearchBehavior}
            handleRoute={handleRoute}
            getLocationFromHistory={getLocationFromHistory}
          />
        </Box>
        {/* Map Container */}
        <div style={{ ...layoutStyles.mapContainer }}>
          {isLoading ? (
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                height: '100%',
              }}
            >
              <Typography variant="h6" style={{ color: theme.palette.primary.main }}>
                Loading {selectedMapName} Map!
              </Typography>
            </Box>
          ) : (
            <>
              <MapBuilder
                map={floorData.maps}
                nodes={floorData.nodes}
                entrances={floorData.entrances}
                boundaries={floorData.boundaries}
                buidingMarks={floorData.buidingMarks}
                roadMarks={floorData.roadMarks}
                floorKey={selectedFloorMap}
              />
              <CalculatingRouteIndicatorModern isVisible={isCalculatingRoute} />
            </>
          )}
        </div>

        {/* Bottom Bar */}
        <Box sx={layoutStyles.fixedBottom}>
          <BottomNavBar />
        </Box>

        {/*Floor Drawer */}
        <FloorCardSelector floors={floors} selectedKey={selectedFloorMap} onSelect={openFloor} />
      </Box>
    </ThemeProvider>
  );
}
