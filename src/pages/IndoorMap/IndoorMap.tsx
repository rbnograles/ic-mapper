// App.tsx
import { useState, useEffect } from 'react';
import { Box, CssBaseline, Typography } from '@mui/material';
import { ThemeProvider } from '@mui/material/styles';
import theme from '@/styles/theme';
import { layoutStyles } from '@/styles/layoutStyles';
import BottomNavBar from '@/components/Navigations/BottomNavBar';
import SearchAppBar from '@/components/Navigations/SearchAppBar';
import { loadMapData } from '@/utils/mapLoader';
import type { IMapItem } from '@/interface';

// floors: [{ key, name, assets? }]
import { floors } from '@/pages/IndoorMap/partials/floors';

// Reuse single map component for all floors
import MapBuilder from '@/components/Maps/Maps';

// plain function
import { handleMultiFloorRoute, routeMapHandler } from '@/hooks/useRouteMapHandler';

import FloorCardSelector from '@/components/Drawers/FloorSelection';
import useMapStore from '@/store/MapStore';
import useDrawerStore from '@/store/DrawerStore';
import { floorMatches } from '@/utils/verticalProcessor';

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

  const [selectedMapName, setSelectedMapName] = useState<string>('');

  // 🧱 Data states
  const [maps, setMaps] = useState<any[]>([]);
  const [nodes, setNodes] = useState<any[]>([]);
  const [entrances, setEntrances] = useState<any[]>([]);
  const [buidingMarks, setbuidingMarks] = useState<any[]>([]);
  const [roadMarks, setRoadMarks] = useState<any[]>([]);
  const [boundaries, setboundaries] = useState<any[]>([]);

  useEffect(() => {
    const floor = floors.find((f) => f.key === selectedFloorMap);
    setSelectedMapName(floor?.name ?? '');
  }, [selectedFloorMap]);

  const handlePathSearchBehavior = (path: IMapItem | null) => {
    setIMapItems(path as IMapItem);
  };

  function resolveMapItemIdentifier(candidate: string) {
    const existsAsId =
      maps.some((m) => m.id === candidate) || entrances.some((e) => e.id === candidate);

    // If it's a known id, return the id (routeMapHandler will try id-first)
    // otherwise return the candidate (treat as name)
    return existsAsId ? candidate : candidate;
  }

  // 🧭 Load map + node data dynamically when floor changes
  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);

    loadMapData(selectedFloorMap ?? floors[0].key)
      .then((data) => {
        if (!isMounted) return;
        setMaps(data.maps);
        setNodes(data.nodes);
        setEntrances(data.entrances);
        setbuidingMarks(data.buidingMarks ?? []);
        setRoadMarks(data.roadMarks ?? []);
        setboundaries(data.boundaries ?? []);
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

  const handleRoute = async (from: IMapItem, to: IMapItem, via?: string) => {
    // Check if same floor (existing single-floor logic)
    if (from.floor === to.floor) {
      return routeMapHandler(from.name, to.name, maps, nodes, entrances);
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
        const firstStep = steps[0];

        // prefer id if available, otherwise use display label/name
        const routeFrom = firstStep.fromId
          ? resolveMapItemIdentifier(firstStep.fromId)
          : firstStep.from;
        const routeTo = firstStep.toId ? resolveMapItemIdentifier(firstStep.toId) : firstStep.to;

        return routeMapHandler(routeFrom, routeTo, maps, nodes, entrances);
      }
    }

    return null;
  };

  const getLocationFromHistory = (history: any) => {
    if (history.type === 'Route') {
      setActiveNodeIds(history.raw.nodes);
      return;
    }
    handlePathSelect(history);
  };

  // state change for floor rendering
  // if page refreshed it will go to ground floor
  // we can use cache once requirement to retain floor comes
  const openFloor = (floorKeyToOpen: string) => {
    setSelectedFloorMap(floorKeyToOpen);
    setIsFloorMapOpen(false);
    setIsExpanded(false);
    resetMap();
  };

  // inside IndoorMap component — add after your map loading useEffect
  useEffect(() => {
    let cancelled = false;
    console.log('rendering');
    console.log(useMapStore.getState().multiFloorRoute);
    // Only trigger when we've finished loading the new floor's data
    if (isLoading) return;

    (async () => {
      try {
        const { multiFloorRoute } = useMapStore.getState();
        if (!multiFloorRoute?.isActive) return;

        const nextStep = multiFloorRoute.steps.find(
          (s) => floorMatches(s.floor, selectedFloorMap) && !s.isVerticalTransition
        );

        console.log(nextStep);

        if (!nextStep) return;

        const routeFrom = nextStep.fromId
          ? resolveMapItemIdentifier(nextStep.fromId)
          : nextStep.from;
        const routeTo = nextStep.toId ? resolveMapItemIdentifier(nextStep.toId) : nextStep.to;

        await routeMapHandler(routeFrom as string, routeTo as string, maps, nodes, entrances);

        if (!cancelled) {
          useMapStore.getState().nextRouteStep();
        }
      } catch (err) {
        console.warn('Failed to continue multi-floor route on floor switch', err);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [selectedFloorMap, isLoading, maps, nodes, entrances, setActiveNodeIds]);

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
                Loading {selectedMapName} Map…
              </Typography>
            </Box>
          ) : (
            <MapBuilder
              // reuse the same component for all floors
              map={maps}
              nodes={nodes}
              entrances={entrances}
              boundaries={boundaries}
              buidingMarks={buidingMarks}
              roadMarks={roadMarks}
              floorKey={selectedFloorMap}
            />
          )}
        </div>

        {/* 📌 Bottom Bar */}
        <Box sx={layoutStyles.fixedBottom}>
          <BottomNavBar />
        </Box>

        {/* 🗂️ Floor Drawer */}
        <FloorCardSelector floors={floors} selectedKey={selectedFloorMap} onSelect={openFloor} />
      </Box>
    </ThemeProvider>
  );
}
