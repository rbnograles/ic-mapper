import { useEffect } from 'react';

import type { IMapItem } from '@/types';

import theme from '@/styles/theme';
import { ThemeProvider } from '@mui/material/styles';
import { layoutStyles } from '@/styles/layoutStyles';
import { Box, CssBaseline, Typography } from '@mui/material';

import BottomNavBar from '@/components/navigation/BottomNavBar';
import SearchAppBar from '@/components/navigation/SearchAppBar';
import FloorSelection from '@/components/drawer/FloorSelection';

import MapBuilder from '@/components/map/Maps';
import CalculatingRouteIndicatorModern from '@/components/common/CalculatingRouteLoader';

import useMapStore from '@/store/MapStore';
import useDrawerStore from '@/store/DrawerStore';

import { preloadVerticals } from '@/routing/utils/verticalProcessor';

import { floors } from '@/routing/utils/Constants';

// Custom Hooks
import { useFloorData } from '@/hooks/useFloorData';
import { useMapItemResolver } from '@/hooks/useMapItemResolver';
import { useRouteHandler } from '@/hooks/useRouteHandler';
import { useMultiFloorContinuation } from '@/hooks/useMultiFloorContinuation';

export function IndoorMap() {
  // MapStore
  const resetMap = useMapStore((state) => state.resetMap);
  const handlePathSelect = useMapStore((state) => state.handlePathSelect);
  const setIMapItems = useMapStore((state) => state.setMapItems);
  const setActiveNodeIds = useMapStore((state) => state.setActiveNodeIds);
  const selectedFloorMap = useMapStore((state) => state.selectedFloorMap);
  const setSelectedFloorMap = useMapStore((state) => state.setSelectedFloorMap);
  const isCalculatingRoute = useMapStore((state) => state.isCalculatingRoute);

  // Drawer Store
  const isLoading = useDrawerStore((state) => state.isLoading);
  const setIsLoading = useDrawerStore((state) => state.setIsLoading);
  const setIsExpanded = useDrawerStore((state) => state.setIsExpanded);
  const setIsFloorMapOpen = useDrawerStore((state) => state.setIsFloorMapOpen);

  // Custom Hooks
  const {
    floorData,
    floorDataRef,
    isLoading: floorDataLoading,
    selectedMapName,
  } = useFloorData(selectedFloorMap, setIsLoading);

  const { resolveMapItemIdentifier } = useMapItemResolver(floorData);

  const { handleRoute } = useRouteHandler({
    floorData,
    floorDataRef,
    resolveMapItemIdentifier,
    setSelectedFloorMap,
    setIsExpanded,
    setIsFloorMapOpen,
  });

  useMultiFloorContinuation({
    selectedFloorMap,
    isLoading: floorDataLoading,
    floorData,
    floorDataRef,
    resolveMapItemIdentifier,
  });

  // Preload verticals on mount
  useEffect(() => {
    preloadVerticals();
  }, []);

  const handlePathSearchBehavior = (path: IMapItem | null) => {
    setIMapItems(path as IMapItem);
  };

  const getLocationFromHistory = (history: any) => {
    if (history.type === 'Route') {
      setActiveNodeIds(history.raw.nodes);
      return;
    }
    handlePathSelect(history);
  };

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
        {/* Search Bar */}
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

        {/* Floor Drawer */}
        <FloorSelection floors={floors} selectedKey={selectedFloorMap} onSelect={openFloor} />
      </Box>
    </ThemeProvider>
  );
}
