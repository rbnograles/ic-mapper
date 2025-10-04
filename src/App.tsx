// App.tsx
import { useState, useMemo, Fragment } from 'react';
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
import AMGroundFloor from './components/Maps/AM.GroundFloor';
//import AM3rdFloor from './components/Maps/AM.3rdFloor';
import SearchAppBar from './components/Navigations/SearchAppBar';
import MapData from './components/Data/AyalaMalls/GroundFloor/GroundFloor.json';
import NodeData from './components/Data/AyalaMalls/GroundFloor/GroundFloorNodes.json';

import { findPathBetweenPlaces } from './components/util/routing';
import type { Graph, PathItem } from './interface/BaseMap';

export default function App() {
  // Map Highlight State
  const [highlightId, setHighlightId] = useState<string | null>(null);
  const [highlightName, setHighlightName] = useState<string | null>(null);
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [pathItem, setPathItems] = useState<PathItem>({ name: '', id: '' });
  const [activeNodeIds, setActiveNodeIds] = useState<string[]>([]);

  // Slider State
  const [expanded, setExpanded] = useState(false);

  // Drawer State for Maps
  const [mapsDrawerOpen, setMapsDrawerOpen] = useState(false);
  const [selectedMap, setSelectedMap] = useState<'ground' | 'third'>('ground');

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

  // Maps data
  const maps = useMemo(() => [...MapData.places], []);
  const nodes = useMemo(() => [...NodeData.nodes], []);
  const entrances = useMemo(() => [...NodeData.entrances], []);

  const uniqueOptions = useMemo(
    () =>
      maps
        .filter((item) => item.name !== 'NotClickable')
        .filter((item, index, self) => index === self.findIndex((t) => t.name === item.name)),
    [maps]
  );

  const handleRoute = (from: string, to: string) => {
    // re-construct the groundfloor map
    const groundFloorMap = { nodes: nodes, entrances: entrances, places: maps };

    const path = findPathBetweenPlaces(groundFloorMap as unknown as Graph, from, to);
    console.log(path);
    if (!path) {
      setActiveNodeIds([]);
      return;
    }
    setActiveNodeIds(path.nodes ?? []);
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box sx={layoutStyles.appRoot}>
        {/* 🔍 Top Search */}
        <Box sx={layoutStyles.fixedTop}>
          <SearchAppBar
            options={uniqueOptions}
            onSelect={handlePathSelect}
            handleChipClick={handleChipClick}
            handlePathSearchBehavior={handlePathSearchBehavior}
            handleRoute={handleRoute}
            pathItem={pathItem}
          />
        </Box>

        {/* 🗺️ Map Container */}
        <Box sx={layoutStyles.mapContainer}>
          {selectedMap === 'ground' && (
            <AMGroundFloor
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
          )}
          {selectedMap === 'third' && (
            <Fragment>Map 3</Fragment>
            // <AM3rdFloor
            //   highlightId={highlightId}
            //   highlightName={highlightName}
            //   selectedType={selectedType}
            //   map={maps}
            //   onClick={handlePathSelect}
            //   handleSliderPathClick={handleSliderPathClick}
            //   activeNodeIds={activeNodeIds}
            //   nodes={nodes}
            // />
          )}
        </Box>

        {/* 📌 Bottom Bar */}
        <Box sx={layoutStyles.fixedBottom}>
          <BottomBar
            expanded={expanded}
            handleSliderClose={handleSliderClose}
            pathItem={pathItem}
            onMapsClick={() => setMapsDrawerOpen(true)} // 👈 trigger drawer
          />
        </Box>

        {/* 📂 Drawer for Maps */}
        <Drawer anchor="left" open={mapsDrawerOpen} onClose={() => setMapsDrawerOpen(false)}>
          <Box sx={{ width: 250, p: 2 }}>
            <List>
              <ListItem disablePadding>
                <ListItemButton
                  selected={selectedMap === 'ground'}
                  onClick={() => {
                    setSelectedMap('ground');
                    setMapsDrawerOpen(false);
                  }}
                >
                  <ListItemText primary="Ground Floor" />
                </ListItemButton>
              </ListItem>
              <ListItem disablePadding>
                <ListItemButton
                  selected={selectedMap === 'third'}
                  onClick={() => {
                    setSelectedMap('third');
                    setMapsDrawerOpen(false);
                  }}
                >
                  <ListItemText primary="3rd Floor" />
                </ListItemButton>
              </ListItem>
            </List>
          </Box>
        </Drawer>
      </Box>
    </ThemeProvider>
  );
}
