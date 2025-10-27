import { useState, useEffect, useCallback, useRef } from 'react';
import { Box, CssBaseline, Typography } from '@mui/material';
import { ThemeProvider } from '@mui/material/styles';
import theme from '@/styles/theme';
import { layoutStyles } from '@/styles/layoutStyles';
import BottomNavBar from '@/components/Navigations/BottomNavBar';
import SearchAppBar from '@/components/Navigations/SearchAppBar';
import { loadMapData } from '@/utils/mapLoader';
import type { FloorData, IMapItem } from '@/interface';

// floors: [{ key, name, assets? }]
import { floors } from '@/pages/IndoorMap/partials/floors';

// Reuse single map component for all floors
import MapBuilder from '@/components/Maps/Maps';

// plain function
import { handleMultiFloorRoute, routeMapHandler } from '@/hooks/useRouteMapHandler';

import FloorCardSelector from '@/components/Drawers/FloorSelection';

import useMapStore from '@/store/MapStore';
import useDrawerStore from '@/store/DrawerStore';
import { floorMatches, preloadVerticals } from '@/utils/verticalProcessor';

import CalculatingRouteIndicatorModern from '@/components/props/CalculatingRouteLoader';

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

  useEffect(() => {
    const { multiFloorRoute } = useMapStore.getState();

    if (!multiFloorRoute?.isActive) return;
    if (isLoading) return;

    if (!floorData.maps.length || !floorData.nodes.length) {
      console.warn('Floor data not ready yet, waiting...');
      return;
    }

    const nextStep = multiFloorRoute.steps.find(
      (s) => floorMatches(s.floor, selectedFloorMap) && !s.isVerticalTransition
    );

    if (!nextStep) return;

    // ✅ Get current floor name
    const currentFloorName =
      floors.find((f) => f.key === selectedFloorMap)?.name || selectedFloorMap;

    // ✅ More robust key matching
    const preCalculatedKey = `${currentFloorName}:${nextStep.fromId || nextStep.from}:${nextStep.toId || nextStep.to}`;
    const preCalculated = multiFloorRoute.preCalculatedRoutes?.get(preCalculatedKey);

    if (preCalculated && preCalculated.length > 0) {
      console.log(`⚡ Using pre-calculated route for step transition`);

      queueMicrotask(() => {
        setActiveNodeIds(preCalculated);
        useMapStore.getState().setIsCalculatingRoute(false);
      });

      setTimeout(() => {
        useMapStore.getState().nextRouteStep();
      }, 300);
      return;
    }

    useMapStore.getState().setIsCalculatingRoute(true);

    let cancelled = false;

    (async () => {
      try {
        // ✅ Small delay to ensure loader is visible
        await new Promise((resolve) => setTimeout(resolve, 50));

        const currentFloorData = floorDataRef.current;

        if (cancelled || !currentFloorData.maps.length) {
          console.warn('Floor data became invalid during calculation');
          useMapStore.getState().setIsCalculatingRoute(false);
          return;
        }

        const routeFrom = nextStep.fromId
          ? resolveMapItemIdentifier(nextStep.fromId)
          : nextStep.from;
        const routeTo = nextStep.toId ? resolveMapItemIdentifier(nextStep.toId) : nextStep.to;

        console.log(`🔄 Calculating route: ${routeFrom} → ${routeTo} on ${currentFloorName}`);

        // ✅ Force calculation for multi-floor routes
        const result = await routeMapHandler(
          routeFrom as string,
          routeTo as string,
          currentFloorData.maps,
          currentFloorData.nodes,
          currentFloorData.entrances,
          true
        );

        if (!cancelled && result) {
          setTimeout(() => {
            if (!cancelled) {
              useMapStore.getState().nextRouteStep();
            }
          }, 300);
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
  ]);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box sx={layoutStyles.appRoot}>
        {/* ðŸ” Search Bar */}
        <Box sx={layoutStyles.fixedTop}>
          <SearchAppBar
            onSelect={handlePathSelect}
            handlePathSearchBehavior={handlePathSearchBehavior}
            handleRoute={handleRoute}
            getLocationFromHistory={getLocationFromHistory}
          />
        </Box>
        {/* Map Container */}
        {/* Container size pagination problem below */}
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
