import { useState, useMemo } from 'react';
import { Box } from '@mui/material';
import BottomBar from './components/Navigations/BottomBar';
import AMGroundFloor from './components/Maps/AM.GroundFloor';
import SearchAppBar from './components/Navigations/SearchAppBar';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import Map from './components/Data/GroupFloor.json';

const theme = createTheme({
  typography: {
    fontFamily: 'Poppins, Roboto, Helvetica, Arial, sans-serif',
  },
});

export default function App() {
  const [highlightId, setHighlightId] = useState<string | null>(null);
  const [highlightName, setHighlightName] = useState<string | null>(null);

  // ✅ New: track which TYPE is selected
  const [selectedType, setSelectedType] = useState<string | null>(null);

  const options = useMemo(() => [...Map.GroundFloor], []);

  const handleSelect = (path: any) => {
    setHighlightName(path?.name || null);
    setHighlightId(path?.id || null);
    setSelectedType(null); // clear type filter when a specific path is selected
  };

  const handleClickPath = (path: any) => {
    setHighlightName(path?.name || null);
    setHighlightId(path?.id || null);
    setSelectedType(null); // clear type filter when a specific path is clicked
  };

  const handleChipClick = (type: string) => {
    // clicking same chip toggles it off
    setSelectedType((prev) => (prev === type ? null : type));
    setHighlightId(null); // clear specific highlight when filtering by type
    setHighlightName(null);
  };

  const uniqueOptions = options.filter(
    (item, index, self) => index === self.findIndex((t) => t.name === item.name)
  );

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box sx={{ minHeight: '100vh', pb: 7, bgcolor: '#F5F3F3' }}>
        {/* Search Bar */}
        <Box
          sx={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100%',
            zIndex: 1200,
          }}
        >
          <SearchAppBar
            options={uniqueOptions}
            onSelect={handleSelect}
            handleChipClick={handleChipClick}
          />
        </Box>

        {/* Map Body */}
        <Box sx={{ height: 'calc(100vh - 120px)', overflow: 'hidden', mt: 7 }}>
          <AMGroundFloor
            highlightId={highlightId}
            highlightName={highlightName}
            selectedType={selectedType} // ✅ send down
            map={options}
            onClick={handleClickPath}
          />
        </Box>

        {/* Chips for filtering by type */}
        <Box
          sx={{
            position: 'fixed',
            bottom: 56, // leave space for BottomBar
            left: 0,
            width: '100%',
            zIndex: 1200,
            bgcolor: 'transparent',
          }}
        ></Box>

        {/* Bottom Navigation */}
        <Box
          sx={{
            position: 'fixed',
            bottom: 0,
            left: 0,
            width: '100%',
            zIndex: 1200,
            bgcolor: 'transparent',
          }}
        >
          <BottomBar />
        </Box>
      </Box>
    </ThemeProvider>
  );
}
