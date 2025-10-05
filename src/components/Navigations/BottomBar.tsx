import { LocationOn, Restore, Bookmark } from '@mui/icons-material';
import {
  useMediaQuery,
  CssBaseline,
  Paper,
  BottomNavigation,
  BottomNavigationAction,
  useTheme,
  ThemeProvider,
} from '@mui/material';
import { useState } from 'react';
import type { PathItem } from '../../interface/BaseMap';
import BottomSlider from '../Drawers/BottomSlider';
import { FaMap } from 'react-icons/fa';

// BottomBar.tsx
export default function BottomBar({
  expanded,
  handleSliderClose,
  pathItem,
  onMapsClick, // 👈 new prop
}: {
  expanded: boolean;
  handleSliderClose: () => void;
  pathItem: PathItem;
  onMapsClick: () => void;
}) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.between('lg', 'xl'));
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
          width: isTablet ? 500 : 'auto',
          borderRadius: isMobile ? '24px 24px 0 0' : 50,
          zIndex: 1200,
        }}
        elevation={6}
      >
        <BottomNavigation
          showLabels
          value={value}
          onChange={(_, newValue) => {
            setValue(newValue);
            if (newValue === 1) {
              onMapsClick(); // 👈 open drawer when "Maps" tab clicked
            }
          }}
          sx={{
            backgroundColor: theme.palette.primary.main,
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
          <BottomNavigationAction label="Maps" icon={<FaMap style={{ fontSize: 22 }} />} />
          <BottomNavigationAction label="Recents" icon={<Restore />} />
          <BottomNavigationAction label="Save" icon={<Bookmark />} />
        </BottomNavigation>
      </Paper>
    </ThemeProvider>
  );
}
