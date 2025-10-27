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
import {
  handleMultiFloorRoute,
  routeMapHandler,
  cancelAllRouteCalculations,
} from '@/hooks/useRouteMapHandler';

import FloorCardSelector from '@/components/Drawers/FloorSelection';

import useMapStore from '@/store/MapStore';
import useDrawerStore from '@/store/DrawerStore';
import { floorMatches, preloadVerticals } from '@/utils/verticalProcessor';
import { cleanExpiredCache } from '@/utils/routeCache';
import CalculatingRouteIndicator from '@/components/props/CalculatingRouteLoader';

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

  // ðŸ§± Data states
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
    cleanExpiredCache();

    // Clean cache every 5 minutes
    const intervalId = setInterval(cleanExpiredCache, 5 * 60 * 1000);

    return () => {
      clearInterval(intervalId);
      cancelAllRouteCalculations();
    };
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
      if (from.floor === to.floor) {
        return routeMapHandler(
          from.name,
          to.name,
          floorData.maps,
          floorData.nodes,
          floorData.entrances,
          false // ✅ Use cache for same-floor routes
        );
      }

      if (via) {
        const steps = await handleMultiFloorRoute(
          from,
          to,
          via,
          useMapStore.getState().setMultiFloorRoute,
          setSelectedFloorMap
        );

        if (steps && steps.length > 0) {
          const firstStep = steps[0];
          const routeFrom = firstStep.fromId
            ? resolveMapItemIdentifier(firstStep.fromId)
            : firstStep.from;
          const routeTo = firstStep.toId ? resolveMapItemIdentifier(firstStep.toId) : firstStep.to;

          return routeMapHandler(
            routeFrom,
            routeTo,
            floorData.maps,
            floorData.nodes,
            floorData.entrances,
            true
          );
        }
      }

      return null;
    },
    [floorData, resolveMapItemIdentifier, setSelectedFloorMap]
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

        // âœ… Mark floor as loaded
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

  // âœ… Multi-floor route continuation effect with stable dependencies
  useEffect(() => {
    if (isLoading) return;

    const { multiFloorRoute } = useMapStore.getState();
    if (!multiFloorRoute?.isActive) return;

    const nextStep = multiFloorRoute.steps.find(
      (s) => floorMatches(s.floor, selectedFloorMap) && !s.isVerticalTransition
    );

    if (!nextStep) return;

    let cancelled = false;

    (async () => {
      try {
        const currentFloorData = floorDataRef.current;

        const routeFrom = nextStep.fromId
          ? resolveMapItemIdentifier(nextStep.fromId)
          : nextStep.from;
        const routeTo = nextStep.toId ? resolveMapItemIdentifier(nextStep.toId) : nextStep.to;

        // âœ… Force calculation for multi-floor routes
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
        }
      } catch (err) {
        console.warn('Failed to continue multi-floor route', err);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [selectedFloorMap, isLoading, resolveMapItemIdentifier]);

  // Smart preloading - only load once per floor
  useEffect(() => {
    const currentIndex = floors.findIndex((f) => f.key === selectedFloorMap);
    if (currentIndex < 0) return;

    // Preload next floor if not already loaded
    if (currentIndex < floors.length - 1) {
      const nextFloorKey = floors[currentIndex + 1].key;
      if (!loadedFloorsRef.current.has(nextFloorKey)) {
        requestIdleCallback(() => {
          loadMapData(nextFloorKey)
            .then(() => {
              loadedFloorsRef.current.add(nextFloorKey);
            })
            .catch(console.error);
        });
      }
    }

    // Preload previous floor if not already loaded
    if (currentIndex > 0) {
      const prevFloorKey = floors[currentIndex - 1].key;
      if (!loadedFloorsRef.current.has(prevFloorKey)) {
        requestIdleCallback(() => {
          loadMapData(prevFloorKey)
            .then(() => {
              loadedFloorsRef.current.add(prevFloorKey);
            })
            .catch(console.error);
        });
      }
    }
  }, [selectedFloorMap]);

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
              <CalculatingRouteIndicator isVisible={isCalculatingRoute} />
              <MapBuilder
                map={floorData.maps}
                nodes={floorData.nodes}
                entrances={floorData.entrances}
                boundaries={floorData.boundaries}
                buidingMarks={floorData.buidingMarks}
                roadMarks={floorData.roadMarks}
                floorKey={selectedFloorMap}
              />
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
