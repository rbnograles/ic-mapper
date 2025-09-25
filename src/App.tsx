import { useState, useMemo } from 'react';
import { Box, CssBaseline } from '@mui/material';
import { ThemeProvider } from '@mui/material/styles';

import theme from './styles/theme';
import { layoutStyles } from './styles/layoutStyles';
import BottomBar from './components/Navigations/BottomBar';
import AMGroundFloor from './components/Maps/AM.GroundFloor';
import SearchAppBar from './components/Navigations/SearchAppBar';
import MapData from './components/Data/GroupFloor.json';
import EdgePath from './components/Data/routingEdges.json';
export interface PathItem {
  id: string;
  name: string;
  type?: string;
  img?: string;
  description?: string;
}
export interface EdgePathTypes {
  id: string;
  d: string;
}

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
  const [activePathIds, setActivePathIds] = useState<string[]>([]);

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

  const setActivePathsViaSearch = (a: any, b: any) => {
    if (!a || !b) return;

    // Make sure nearPaths arrays exist
    const nearA = Array.isArray(a.nearPaths) ? a.nearPaths : [];
    const nearB = Array.isArray(b.nearPaths) ? b.nearPaths : [];
    console.log(nearA);
    console.log(nearB);
    // Only keep IDs that are present in BOTH nearPaths arrays
    const activeIds = nearA.filter((id: string) => nearB.includes(id));
    console.log(activeIds);
    // Set those shared path IDs as active
    setActivePathIds(activeIds);
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
  const options = useMemo(() => [...MapData.GroundFloor], []);

  const uniqueOptions = useMemo(
    () =>
      options.filter((item, index, self) => index === self.findIndex((t) => t.name === item.name)),
    [options]
  );

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box sx={layoutStyles.appRoot}>
        <Box sx={layoutStyles.fixedTop}>
          <SearchAppBar
            options={uniqueOptions}
            onSelect={handlePathSelect}
            handleChipClick={handleChipClick}
            setActivePathsViaSearch={setActivePathsViaSearch}
            handlePathSearchBehavior={handlePathSearchBehavior}
          />
        </Box>

        <Box sx={layoutStyles.mapContainer}>
          <AMGroundFloor
            highlightId={highlightId}
            highlightName={highlightName}
            selectedType={selectedType}
            map={options}
            onClick={handlePathSelect}
            handleSliderPathClick={handleSliderPathClick}
            activePathIds={activePathIds}
            edgePath={EdgePath.edges as unknown as EdgePathTypes}
          />
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
