// App.tsx
import { useState, useEffect, useMemo } from 'react';
import {
  Box,
  CssBaseline,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemText
} from '@mui/material';
import { ThemeProvider } from '@mui/material/styles';

import theme from './styles/theme';
import { layoutStyles } from './styles/layoutStyles';
import BottomBar from './components/Navigations/BottomBar';
import SearchAppBar from './components/Navigations/SearchAppBar';
import { loadMapData } from './components/util/core/mapLoader';
import type { PathItem } from './interface';

// floors: [{ key, name, assets? }]
import { floors } from './components/Maps/partials/floors';

// Reuse single map component for all floors
import BaseMap from './components/Maps';

// Route tracker component
import RouteTracker from './components/RouteTracker'; // adjust path if needed

// plain function (not a hook)
import { routeMapHandler } from './components/hooks/useRouteMapHandler';

// react-router
import {
  Routes,
  Route,
  Navigate,
  useParams,
  useNavigate,
  useLocation,
} from 'react-router-dom';

export default function AppRouter() {
  return (
    <Routes>

         {/* explore view */}
        <Route path="/xd" element={<RouteTracker/>} />
        {/* normal floor view */}
        <Route path="/floor/:floorKey" element={<MainLayout />} />

        {/* fallback */}
        <Route path="/" element={<Navigate to={`/floor/${floors[0].key}`} replace />} />
      </Routes>
  );
}

/**
 * MainLayout - contains the original App UI but reads floor/explore from route params.
 *
 * If `exploreRoute` prop is true, this component will start in explore mode.
 */
function MainLayout({ exploreRoute = false }: { exploreRoute?: boolean }) {
  const { floorKey } = useParams<{ floorKey?: string }>();
  const navigate = useNavigate();
  const location = useLocation();

  // 🗺️ Highlight + filter states
  const [highlightId, setHighlightId] = useState<string | null>(null);
  const [highlightName, setHighlightName] = useState<string | null>(null);
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [pathItem, setPathItems] = useState<PathItem>({ name: '', id: '' });
  const [activeNodeIds, setActiveNodeIds] = useState<string[]>([]);

  // 🎚️ Slider
  const [expanded, setExpanded] = useState(false);

  // 🧭 Map Drawer
  const [mapsDrawerOpen, setMapsDrawerOpen] = useState(false);

  // selectedMap is driven by the route param when available, otherwise default to first floor
  const initialFloorKey = floorKey ?? floors[0].key;
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

  // explore mode from route (if path is /explore/*) OR toggled from UI
  const isUrlExplore = location.pathname.startsWith('/explore');
  const [exploreMode, setExploreMode] = useState<boolean>(isUrlExplore || exploreRoute);

  // --- keep selectedMap in sync with route param changes (back/forward support)
  useEffect(() => {
    const newKey = floorKey ?? floors[0].key;
    setSelectedMap(newKey);
    const floor = floors.find((f) => f.key === newKey);
    setSelectedMapName(floor?.name ?? newKey);
  }, [floorKey]);

  // keep exploreMode synced with route
  useEffect(() => {
    setExploreMode(location.pathname.startsWith('/explore'));
  }, [location.pathname]);

  // 🧠 Helpers
  const resetHighlight = () => {
    setHighlightId(null);
    setHighlightName(null);
  };

  const handlePathSelect = (path: PathItem | null) => {
    setHighlightId(path?.id || null);
    setHighlightName(path?.name || null);
    setPathItems(path as PathItem);
    setSelectedType(null);
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedMap]); // selectedMap is synced to route via the effect above

  // 🚏 Pathfinding with caching — plain function that accepts current state
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

  // NAV helpers that use router instead of direct state changes
  const openFloor = (floorKeyToOpen: string) => {
    // navigate to floor route. Keep UI reset behaviors as before.
    navigate(`/floor/${floorKeyToOpen}`);
    setMapsDrawerOpen(false);
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

        {/* 🗺️ Map Container */}
        <Box id="yes" sx={layoutStyles.mapContainer}>
          {loading ? (
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                height: '100%',
              }}
            >
              Loading {selectedMapName} …
            </Box>
          ) : (
            exploreMode ? (
              // Explore route: show RouteTracker
              <RouteTracker
              />
            ) : (
              <BaseMap
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
              />
            )
          )}
        </Box>

        {/* 📌 Bottom Bar */}
        <Box sx={layoutStyles.fixedBottom}>
          <BottomBar
            expanded={expanded}
            handleSliderClose={handleSliderClose}
            pathItem={pathItem}
            onMapsClick={() => setMapsDrawerOpen(true)}
          />
        </Box>

        {/* 🗂️ Map Drawer */}
        <Drawer anchor="left" open={mapsDrawerOpen} onClose={() => setMapsDrawerOpen(false)}>
          <Box sx={{ width: 250, p: 2 }}>
            <List>
              {floors.map((floor: any) => (
                <ListItem key={floor.key} disablePadding>
                  <ListItemButton
                    selected={selectedMap === floor.key}
                    onClick={() => openFloor(floor.key)}
                  >
                    <ListItemText primary={floor.name} />
                  </ListItemButton>
                </ListItem>
              ))}
            </List>
          </Box>
        </Drawer>
      </Box>
    </ThemeProvider>
  );
}
