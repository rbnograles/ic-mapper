import { AppBar, Box, Toolbar, useMediaQuery, CssBaseline } from '@mui/material';
import { ThemeProvider, useTheme } from '@mui/material/styles';
import { useState } from 'react';

import uniqueTypes from '@/Data/unique_types.json';
import Direction from '@/components/drawer/DirectionSearch';
import { Chips } from '@/components/common/Chips';
import type { IMapItem, ViaOption } from '@/types';
import { useLazyMapData } from '@/hooks/useLazyMapData';
import useDrawerStore from '@/store/DrawerStore';
import useSearchStore from '@/store/SearchStore';
import SearchBar from '../props/SearchInput';
import useMapStore from '@/store/MapStore';

function getFloor(value: any): string | null {
  if (!value && value !== 0) return null;

  if (typeof value === 'object') {
    if (value.floor !== undefined && value.floor !== null) return String(value.floor);
    if (value.level !== undefined && value.level !== null) return String(value.level);
    if (value.meta && (value.meta.floor || value.meta.level)) {
      return String(value.meta.floor ?? value.meta.level);
    }
  }

  if (typeof value === 'string') {
    const patterns = [
      /(?:Floor|floor|level|Level)\s*#?:?\s*([-\dA-Za-z]+)/i,
      /\bF\s*#?:?\s*([-\dA-Za-z]+)\b/i,
      /\b(\d+)(?:st|nd|rd|th)?\s+floor\b/i,
      /#\s*([-\dA-Za-z]+)/,
      /\b(\d+)\b/,
    ];
    for (const re of patterns) {
      const m = value.match(re);
      if (m && m[1]) return m[1].toString();
    }
  }

  const s = String(value);
  if (s && !isNaN(Number(s))) return s;
  return null;
}

export default function SearchAppBar({
  onSelect,
  handlePathSearchBehavior,
  handleRoute,
  getLocationFromHistory,
}: {
  onSelect: (item: any, type?: 'A' | 'B') => void;
  handlePathSearchBehavior: (item: any, type?: 'A' | 'B') => void;
  // changed: third optional parameter via
  handleRoute: (from: IMapItem, to: IMapItem, via?: ViaOption) => void;
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

  // Via selection state (parent keeps it so we can choose when to call handleRoute)
  const [viaMethod, setViaMethod] = useState<ViaOption>('');

  // Use Map Store
  const floor = useMapStore((state) => state.selectedFloorMap);

  // Lazy search data
  const { visiblePlaces, hasMore, loadMore, search, loading, saveToCache } = useLazyMapData(
    floor,
    20
  );

  // Point Handling
  const setPointAMethod = (val: IMapItem) => {
    setPointA(val);
    // if both points exist and floors don't conflict, run route immediately
    if (val?.name && pointB?.name) {
      const aFloor = getFloor(val);
      const bFloor = getFloor(pointB);
      if (aFloor && bFloor && aFloor !== bFloor) {
        // floors different — expect user to pick Via -> keep drawer open
        saveToCache(val);
        setIsDirectionPanelOpen(true);
        return;
      }
      // same floor or unknown: proceed with routing, pass current via only if set
      if (viaMethod) {
        handleRoute(val, pointB, viaMethod);
      } else {
        handleRoute(val, pointB);
      }
      setIsDirectionPanelOpen(false);
    } else {
      saveToCache(val);
    }
  };

  const setPointBMethod = (val: IMapItem) => {
    // always set destination locally first
    setPointB(val);
    saveToCache(val);

    // if origin exists, check floors
    if (pointA?.name && val?.name) {
      const aFloor = getFloor(pointA);
      const bFloor = getFloor(val);

      if (aFloor && bFloor && aFloor !== bFloor) {
        // floors differ -> DO NOT call handleRoute yet
        // open drawer so user can pick Via (Direction component displays Via)
        setIsDirectionPanelOpen(true);
        return;
      }

      // same floor (or unknown floors) -> proceed as usual
      if (viaMethod) {
        handleRoute(pointA, val, viaMethod);
      } else {
        handleRoute(pointA, val);
      }
      setIsDirectionPanelOpen(false);
    }
  };

  // called when parent Direction component calls setViaMethod (user picks stairs/elevator/etc)
  const onViaSelected = (m: ViaOption) => {
    setViaMethod(m);
    // If we have both points, now we can proceed with routing and include via
    if (pointA?.name && pointB?.name) {
      handleRoute(pointA, pointB, m);
      setIsDirectionPanelOpen(false);
      // optionally keep the via selection or reset; here we reset after use
      setViaMethod('');
    }
  };

  const handleSwapPoints = () => {
    if (!pointA || !pointB) return; // need both to swap
    setPointA(pointB);
    setPointB(pointA);
    // swapping may change need for via — reset it
    setViaMethod('');
    // if after swapping both floors same, run route
    const aFloor = getFloor(pointB);
    const bFloor = getFloor(pointA);
    if (aFloor && bFloor && aFloor === bFloor) {
      handleRoute(pointB, pointA);
    } else {
      // keep drawer open to let user select Via
      setIsDirectionPanelOpen(true);
    }
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
          setViaMethod={onViaSelected}
          via={viaMethod}
          // Add these:
          floorA={getFloor(pointA)}
          floorB={getFloor(pointB)}
        />
      </Box>
    </ThemeProvider>
  );
}
