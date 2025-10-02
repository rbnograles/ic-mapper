import { useState, useMemo } from 'react';
import { Box, CssBaseline } from '@mui/material';
import { ThemeProvider } from '@mui/material/styles';

import theme from './styles/theme';
import { layoutStyles } from './styles/layoutStyles';
import BottomBar from './components/Navigations/BottomBar';
import AMGroundFloor from './components/Maps/AM.GroundFloor';
import SearchAppBar from './components/Navigations/SearchAppBar';
import MapData from './components/Data/GroupFloor.json';

import { findPathBetweenPlaces } from './components/util/routing';
import type { Graph, PathItem } from './interface/BaseMap';
// import AM3rdFloor from './components/Maps/AM.3rdFloor';

export default function App() {
  // Map Highlight State
  const [highlightId, setHighlightId] = useState<string | null>(null);
  const [highlightName, setHighlightName] = useState<string | null>(null);
  const [selectedType, setSelectedType] = useState<string | null>(null);
  // path information stage
  const [pathItem, setPathItems] = useState<PathItem>({
    name: '',
    id: '',
  });
  const [activeNodeIds, setActiveNodeIds] = useState<string[]>([]);

  // Slider State
  const [expanded, setExpanded] = useState(false);

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

  const handleSliderPathClick = () => {
    setExpanded(true);
  };

  const handleSliderClose = () => {
    setExpanded(false);
  };

  // Map render State
  const maps = useMemo(() => [...MapData.places], []);
  const nodes = useMemo(() => [...MapData.nodes], []);

  const uniqueOptions = useMemo(
    () => maps.filter((item, index, self) => index === self.findIndex((t) => t.name === item.name)),
    [maps]
  );

  const handleRoute = (from: string, to: string) => {
    const path = findPathBetweenPlaces(MapData as unknown as Graph, from, to);
    console.log('Full path result:', path);

    if (!path) {
      setActiveNodeIds([]);
      return;
    }

    // ✅ We only have one "best" path now
    setActiveNodeIds(path.nodes ?? []);
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box sx={layoutStyles.appRoot}>
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

        <Box sx={layoutStyles.mapContainer}>
          <AMGroundFloor
            highlightId={highlightId}
            highlightName={highlightName}
            selectedType={selectedType}
            map={maps}
            onClick={handlePathSelect}
            handleSliderPathClick={handleSliderPathClick}
            activeNodeIds={activeNodeIds}
            nodes={nodes}
          />
          {/* <AM3rdFloor /> */}
        </Box>

        <Box sx={layoutStyles.fixedBottom}>
          <BottomBar
            expanded={expanded}
            handleSliderClose={handleSliderClose}
            pathItem={pathItem}
          />
        </Box>
      </Box>
    </ThemeProvider>
  );
}
