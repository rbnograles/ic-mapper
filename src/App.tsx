import React from 'react';
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
  const [highlightId, setHighlightId] = React.useState<string | null>(null);
  const [highlightName, setHighlightName] = React.useState<string | null>(null);

  const options = React.useMemo(() => [...Map.GroundFloor], []);
  const handleSelect = (item: any) => {
    setHighlightName(item?.name || null);
    setHighlightId(item?.id || null);
  };
  const uniqueOptions = options.filter(
    (item, index, self) => index === self.findIndex((t) => t.name === item.name)
  );
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box sx={{ minHeight: '100vh', pb: 7, bgcolor: '#F5F3F3' }}>
        <Box
          sx={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100%',
            zIndex: 1200,
          }}
        >
          <SearchAppBar options={uniqueOptions} onSelect={handleSelect} />
        </Box>
        {/* Map Body */}
        <Box sx={{ height: 'calc(100vh - 56px)', overflow: 'hidden' }}>
          <AMGroundFloor highlightId={highlightId} highlightName={highlightName} map={options} />
        </Box>
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
