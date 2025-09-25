import { useState } from 'react';
import {
  BottomNavigation,
  BottomNavigationAction,
  CssBaseline,
  Paper,
  ThemeProvider,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import { LocationOn, Map, Restore, Bookmark } from '@mui/icons-material';
import type { PathItem } from '../../App';
import BottomSlider from '../Drawers/BottomSlider';

export default function BottomBar({
  expanded,
  handleSliderClose,
  pathItem,
}: {
  expanded: boolean;
  handleSliderClose: () => void;
  pathItem: PathItem;
}) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.between('lg', 'xl')); // 👈 tablet range
  const [value, setValue] = useState(0);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <BottomSlider
        isMobile={isMobile}
        expanded={expanded}
        handleSliderClose={handleSliderClose}
        pathItem={pathItem}
      />

      <Paper
        sx={{
          position: 'fixed',
          bottom: isMobile ? 0 : 24,
          left: isMobile ? 0 : isTablet ? 'calc(50% - 250px)' : 24,
          right: isMobile ? 0 : isTablet ? 'calc(50% - 250px)' : 24,
          width: isTablet ? 500 : 'auto', // 👈 narrower on tablet
          borderRadius: isMobile ? '24px 24px 0 0' : 50,
          zIndex: 1200,
        }}
        elevation={6}
      >
        <BottomNavigation
          showLabels
          value={value}
          onChange={(_, newValue) => setValue(newValue)}
          sx={{
            backgroundColor: theme.palette.primary.main, // 👈 softer purple on tablet
            borderRadius: isMobile ? '24px 24px 0 0' : 50,
            '& .Mui-selected, & .Mui-selected svg': {
              color: isTablet ? '#f5f5f5 !important' : '#fff !important',
            },
            '& .MuiBottomNavigationAction-label.Mui-selected': {
              color: isTablet ? '#f5f5f5 !important' : '#fff !important',
            },
          }}
          style={{ padding: 10 }}
        >
          <BottomNavigationAction label="Explore" icon={<LocationOn />} />
          <BottomNavigationAction label="Maps" icon={<Map />} />
          <BottomNavigationAction label="Recents" icon={<Restore />} />
          <BottomNavigationAction label="Save" icon={<Bookmark />} />
        </BottomNavigation>
      </Paper>
    </ThemeProvider>
  );
}
