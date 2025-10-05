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

    // use encodeURIComponent to avoid characters breaking keys
    const key = `route-cache-${selectedMap}-${encodeURIComponent(from)}-${encodeURIComponent(to)}`;
    const reverseKey = `route-cache-${selectedMap}-${encodeURIComponent(to)}-${encodeURIComponent(from)}`;

    // detect which key is present
    const cachedKey = localStorage.getItem(key)
      ? key
      : localStorage.getItem(reverseKey)
        ? reverseKey
        : null;

    if (cachedKey) {
      try {
        const parsed = JSON.parse(localStorage.getItem(cachedKey) as string);
        const cachedNodes: string[] = parsed?.nodes ?? [];

        if (Array.isArray(cachedNodes) && cachedNodes.length) {
          // if we read the reverseKey, reverse the nodes so they reflect `from -> to`
          const nodesToUse = cachedKey === reverseKey ? [...cachedNodes].reverse() : cachedNodes;
          setActiveNodeIds(nodesToUse);
          console.log(
            `✅ Using cached route for ${from} ↔ ${to} (from ${cachedKey === key ? 'key' : 'reverseKey'})`
          );
          return;
        }
      } catch (err) {
        console.warn('⚠️ Failed to parse cached route:', err);
      }
    }

    // compute new path
    const path = findPathBetweenPlaces(floorMap as unknown as Graph, from, to);

    if (!path || !path.nodes) {
      console.warn('❌ No route found between', from, 'and', to);
      setActiveNodeIds([]);
      return;
    }

    // canonical route nodes should be in `from -> to` order
    const orderedNodes = path.nodes;

    const routeData = {
      from,
      to,
      floor: floors.find((f) => selectedMap === f.key)?.name ?? selectedMap,
      nodes: orderedNodes,
      timestamp: Date.now(),
    };

    // store both directions: key (from->to) and reverseKey (to->from with reversed nodes)
    try {
      localStorage.setItem(key, JSON.stringify(routeData));

      // prepare reverse entry so future lookups find correct-order nodes
      const reverseRouteData = {
        from: to,
        to: from,
        floor: routeData.floor,
        nodes: [...orderedNodes].reverse(),
        timestamp: Date.now(),
      };
      localStorage.setItem(reverseKey, JSON.stringify(reverseRouteData));
    } catch (err) {
      console.warn('⚠️ Failed to store route in cache:', err);
    }

    setActiveNodeIds(orderedNodes);
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
