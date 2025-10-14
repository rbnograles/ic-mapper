// App.tsx
import { useState, useEffect, useMemo } from 'react';
import {
  Box,
  CssBaseline,
  Typography,
} from '@mui/material';
import { ThemeProvider } from '@mui/material/styles';
import { useParams } from 'react-router-dom';
import theme from '@/styles/theme';
import { layoutStyles } from '@/styles/layoutStyles';
import BottomBar from '@/components/Navigations/BottomNavBar';
import SearchAppBar from '@/components/Navigations/SearchAppBar';
import { loadMapData } from '@/utils/mapLoader';
import type { PathItem } from '@/interface';

// floors: [{ key, name, assets? }]
import { floors } from '@/pages/IndoorMap/partials/floors';

// Reuse single map component for all floors
import MapBuilder from '@/components/Maps';

// plain function
import { routeMapHandler } from '@/hooks/useRouteMapHandler';

import FloorCardSelector from '@/components/Drawers/FloorSelection';

export function IndoorMap() {

  // 🗺️ Highlight + filter states
  const [highlightId, setHighlightId] = useState<string | null>(null);
  const [highlightName, setHighlightName] = useState<string | null>(null);
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [pathItem, setPathItems] = useState<PathItem>({ name: '', id: '' });
  const [activeNodeIds, setActiveNodeIds] = useState<string[]>([]);

  // Slider
  const [expanded, setExpanded] = useState(false);

  // Map Drawer
  const [floorDrawerOpen, setFloorDrawerOpen] = useState(false);

  // use paramFloorKey as the route-provided floor key
  const { floorKey: paramFloorKey } = useParams<{ floorKey?: string }>();
  const initialFloorKey = paramFloorKey ?? floors[0].key;

  const [selectedMap, setSelectedMap] = useState<string>(initialFloorKey);

  // readable name for display (keep in state so we can show "Loading x..." while loading)
  const initialFloorName = floors.find((f) => f.key === initialFloorKey)?.name ?? floors[0].name;
  const [selectedMapName, setSelectedMapName] = useState<string>(initialFloorName);

  // 🧱 Data states
  const [maps, setMaps] = useState<any[]>([]);
  const [nodes, setNodes] = useState<any[]>([]);
  const [entrances, setEntrances] = useState<any[]>([]);
  const [buidingMarks, setbuidingMarks] = useState<any[]>([]);
  const [roadMarks, setRoadMarks] = useState<any[]>([]);
  const [boundaries, setboundaries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const newKey = paramFloorKey ?? floors[0].key;
    setSelectedMap('ground'); // change to new key
    const floor = floors.find((f) => f.key === newKey);
    setSelectedMapName(floor?.name ?? newKey);
  }, [paramFloorKey]);

  // Helpers
  const resetHighlight = () => {
    setHighlightId(null);
    setHighlightName(null);
  };

  const handlePathSelect = (path: PathItem | null) => {
    setHighlightId(path?.id || null);
    setHighlightName(path?.name || null);
    setPathItems(path as PathItem);
    setSelectedType(null);
    setActiveNodeIds([]);
  };

  const handlePathSearchBehavior = (path: PathItem | null) => {
    setPathItems(path as PathItem);
  };

  const handleChipClick = (type: string) => {
    setSelectedType((prev) => (prev === type ? null : type));
    resetHighlight();
  };

  const handleSliderPathClick = () => setExpanded(true);
  const handleSliderClose = () => setExpanded(false);

  // 🧭 Load map + node data dynamically when floor changes
  useEffect(() => {
    let isMounted = true;
    setLoading(true);

    loadMapData(selectedMap)
      .then((data) => {
        if (!isMounted) return;
        setMaps(data.places);
        setNodes(data.nodes);
        setEntrances(data.entrances);
        setbuidingMarks(data.buidingMarks ?? []);
        setRoadMarks(data.roadMarks ?? []);
        setboundaries(data.boundaries ?? []);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Error loading map data:', err);
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
   // selectedMap is synced to route via the effect above
  }, [selectedMap]); 

  // Pathfinding with caching — plain function that accepts current state
  const handleRoute = (from: string, to: string) => {
    return routeMapHandler(
      from,
      to,
      nodes,
      entrances,
      maps,
      selectedMap,
      setActiveNodeIds,
      setHighlightId
    );
  };

  const getLocationFromHistory = (history: any) => {
    if (history.type === 'Route') {
      setActiveNodeIds(history.raw.nodes);
      return;
    }

    handlePathSelect(history);
  };

  // Find current floor object once (memoized)
  const selectedFloor = useMemo(() => floors.find((f) => f.key === selectedMap), [selectedMap]);

  // state change for floor rendering
  // if page refreshed it will go to ground floor
  // we can use cache once requirement to retain floor comes
  const openFloor = (floorKeyToOpen: string) => {
    setSelectedMap(floorKeyToOpen);
    setFloorDrawerOpen(false);
    setExpanded(false);
    setHighlightId(null);
    setHighlightName(null);
    setActiveNodeIds([]);
    setPathItems({ id: '', name: '' });
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box sx={layoutStyles.appRoot}>
        {/* 🔍 Search Bar */}
        <Box sx={layoutStyles.fixedTop}>
          <SearchAppBar
            onSelect={handlePathSelect}
            handleChipClick={handleChipClick}
            handlePathSearchBehavior={handlePathSearchBehavior}
            handleRoute={handleRoute}
            pathItem={pathItem}
            getLocationFromHistory={getLocationFromHistory}
          />
        </Box>

        {/* Map Container */}
        {/* Container size pagination problem below */}
        <div style={{ ...layoutStyles.mapContainer }}>
          {loading ? (
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
              highlightId={highlightId}
              highlightName={highlightName}
              selectedType={selectedType}
              map={maps}
              onClick={handlePathSelect}
              handleSliderPathClick={handleSliderPathClick}
              activeNodeIds={activeNodeIds}
              nodes={nodes}
              entrances={entrances}
              boundaries={boundaries}
              buidingMarks={buidingMarks}
              roadMarks={roadMarks}
              floorKey={selectedMap}
              assets={selectedFloor?.assets}
              onFloorChangeClick={() => setFloorDrawerOpen(true)}
            />
          )}
        </div>

        {/* 📌 Bottom Bar */}
        <Box sx={layoutStyles.fixedBottom}>
          <BottomBar
            expanded={expanded}
            handleSliderClose={handleSliderClose}
            pathItem={pathItem}
          />
        </Box>

        {/* 🗂️ Floor Drawer */}
        <FloorCardSelector
          open={floorDrawerOpen}
          onClose={() => setFloorDrawerOpen(false)}
          floors={floors}
          onSelect={openFloor}
        />
      </Box>
    </ThemeProvider>
  );
}
