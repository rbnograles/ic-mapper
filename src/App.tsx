// App.tsx
import { useState, useEffect } from 'react';
import {
  Box,
  CssBaseline,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
} from '@mui/material';
import { ThemeProvider } from '@mui/material/styles';

import theme from './styles/theme';
import { layoutStyles } from './styles/layoutStyles';
import BottomBar from './components/Navigations/BottomBar';
import SearchAppBar from './components/Navigations/SearchAppBar';
import { findPathBetweenPlaces } from './components/util/core/routing';
import { loadMapData } from './components/util/core/mapLoader';
import type { Graph, PathItem } from './interface/BaseMap';

// import other floor components here
import { floors } from './components/Maps/partials/floors'; // floor array: { key, name, component }

export default function App() {
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
  const [selectedMap, setSelectedMap] = useState(floors[0].key);

  // 🧱 Data states
  const [maps, setMaps] = useState<any[]>([]);
  const [nodes, setNodes] = useState<any[]>([]);
  const [entrances, setEntrances] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

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
        setLoading(false);
      })
      .catch((err) => {
        console.error('Error loading map data:', err);
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [selectedMap]);

  // 🚏 Pathfinding with caching
  const handleRoute = (from: string, to: string) => {
    if (!from || !to) return;

    const floorMap = { nodes, entrances, places: maps };

    const key = `route-cache-${selectedMap}-${from}-${to}`;
    const reverseKey = `route-cache-${selectedMap}-${to}-${from}`;

    const cached = localStorage.getItem(key) || localStorage.getItem(reverseKey);
    if (cached) {
      try {
        const { nodes: cachedNodes } = JSON.parse(cached);
        if (Array.isArray(cachedNodes) && cachedNodes.length) {
          setActiveNodeIds(cachedNodes);
          console.log(`✅ Using cached route for ${from} ↔ ${to}`);
          return;
        }
      } catch (err) {
        console.warn('⚠️ Failed to parse cached route:', err);
      }
    }

    const path = findPathBetweenPlaces(floorMap as unknown as Graph, from, to);

    if (!path || !path.nodes) {
      console.warn('❌ No route found between', from, 'and', to);
      setActiveNodeIds([]);
      return;
    }

    const routeData = {
      from,
      to,
      floor: floors.map((f) => {
        if (selectedMap === f.key) {
          return f.name;
        }
      }),
      nodes: path.nodes,
      timestamp: Date.now(),
    };

    localStorage.setItem(key, JSON.stringify(routeData));
    setActiveNodeIds(path.nodes);
  };

  const getLocationFromHistory = (history: any) => {
    if (history.type === 'Route') {
      setActiveNodeIds(history.raw.nodes);
      return;
    }

    handlePathSelect(history);
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
        <Box sx={layoutStyles.mapContainer}>
          {loading ? (
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                height: '100%',
              }}
            >
              Loading {selectedMap} map…
            </Box>
          ) : (
            <>
              {floors.map((floor: any) =>
                selectedMap === floor.key ? (
                  <floor.component
                    key={floor.key}
                    highlightId={highlightId}
                    highlightName={highlightName}
                    selectedType={selectedType}
                    map={maps}
                    onClick={handlePathSelect}
                    handleSliderPathClick={handleSliderPathClick}
                    activeNodeIds={activeNodeIds}
                    nodes={nodes}
                    entrances={entrances}
                  />
                ) : null
              )}
            </>
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
                    onClick={() => {
                      setSelectedMap(floor.key);
                      setMapsDrawerOpen(false);
                    }}
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
