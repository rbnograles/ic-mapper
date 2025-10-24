// App.tsx
import { useState, useEffect } from 'react';
import { Box, CssBaseline, Typography } from '@mui/material';
import { ThemeProvider } from '@mui/material/styles';
import theme from '@/styles/theme';
import { layoutStyles } from '@/styles/layoutStyles';
import BottomNavBar from '@/components/Navigations/BottomNavBar';
import SearchAppBar from '@/components/Navigations/SearchAppBar';
import { loadMapData } from '@/utils/mapLoader';
import type { IPlace, IMapItem } from '@/interface';

// floors: [{ key, name, assets? }]
import { floors } from '@/pages/IndoorMap/partials/floors';

// Reuse single map component for all floors
import MapBuilder from '@/components/Maps';

// plain function
import { routeMapHandler } from '@/hooks/useRouteMapHandler';

import FloorCardSelector from '@/components/Drawers/FloorSelection';
import useMapStore from '@/store/MapStore';
import useDrawerStore from '@/store/DrawerStore';

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

  // Pathfinding with caching — plain function that accepts current state
  const handleRoute = (from: IPlace, to: IPlace) => {
    return routeMapHandler(from.name, to.name, maps, nodes, entrances);
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
