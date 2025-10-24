import { AppBar, Box, Toolbar, useMediaQuery, CssBaseline } from '@mui/material';

import { ThemeProvider, useTheme } from '@mui/material/styles';

import uniqueTypes from '@/Data/unique_types.json';
import Direction from '@/components/Drawers/DirectionSearch';
import { Chips } from '@/components/Navigations/Chips';
import type { IMapItem } from '@/interface';
import { useLazyMapData } from '@/hooks/useLazyMapData';
import useDrawerStore from '@/store/DrawerStore';
import useSearchStore from '@/store/SearchStore';
import SearchBar from '../props/SearchInput';
import useMapStore from '@/store/MapStore';

export default function SearchAppBar({
  onSelect,
  handlePathSearchBehavior,
  handleRoute,
  getLocationFromHistory,
}: {
  onSelect: (item: any, type?: 'A' | 'B') => void;
  handlePathSearchBehavior: (item: any, type?: 'A' | 'B') => void;
  handleRoute: (from: IMapItem, to: IMapItem) => void;
  getLocationFromHistory: (history: any) => void;
}) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  // Use Drawer Store
  const setIsDirectionPanelOpen = useDrawerStore((state) => state.setIsDirectionPanelOpen);

  // Use Search Store
  const pointA = useSearchStore((state) => state.pointA);
  const pointB = useSearchStore((state) => state.pointB);
  // handlers
  const setPointA = useSearchStore((state) => state.setPointA);
  const setPointB = useSearchStore((state) => state.setPointB);

  // Use Map Store
  const floor = useMapStore((state) => state.selectedFloorMap)

  // Lazy search data
  const { visiblePlaces, hasMore, loadMore, search, loading, saveToCache } = useLazyMapData(
    floor,
    20
  );

  // Point Handling
  const setPointAMethod = (val: IMapItem) => {
    setPointA(val);
    if (val?.name && pointB?.name) {
      handleRoute(val, pointB);
      setIsDirectionPanelOpen(false);
    }
    saveToCache(val);
  };

  const setPointBMethod = (val: IMapItem) => {
    setPointB(val);
    if (pointA?.name && val?.name) {
      handleRoute(pointA, val);
      setIsDirectionPanelOpen(false);
    }
    saveToCache(val);
  };

  const handleSwapPoints = () => {
    if (!pointA || !pointB) return; // need both to swap
    setPointA(pointB);
    setPointB(pointA);
    handleRoute(pointB, pointA);
  };

  // Render Component
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box sx={{ flexGrow: 1 }}>
        <AppBar
          position="fixed"
          elevation={0}
          sx={{
            width: '100vw', // make sure it never exceeds viewport
            maxWidth: '100%',
            left: 0,
            backgroundColor: 'transparent',
            boxShadow: 'none',
            paddingTop: 1.5,
            flexDirection: isMobile ? 'column' : 'row',
            overflowX: 'hidden',
          }}
        >
          <Toolbar
            sx={{
              justifyContent: 'space-between',
              width: isMobile ? '100vw' : '45vw',
              alignItems: 'center',
              gap: 2,
            }}
          >
            <SearchBar
              placeholder="Search for a place or type"
              value={pointA}
              onChange={(val) => {
                setPointA(val);
                onSelect(val, 'A');
              }}
              lazy={{
                visiblePlaces,
                hasMore,
                loadMore,
                search,
                loading,
                saveToCache,
              }}
            />
          </Toolbar>

          <Chips types={uniqueTypes} />
        </AppBar>

        {/* === Drawer for directions === */}
        <Direction
          isMobile={isMobile}
          handlePathSearchBehavior={handlePathSearchBehavior}
          setPointBMethod={setPointBMethod}
          setPointAMethod={setPointAMethod}
          handleSwapPoints={handleSwapPoints}
          getLocationFromHistory={getLocationFromHistory}
        />
      </Box>
    </ThemeProvider>
  );
}
