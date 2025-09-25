import { useState } from 'react';
import {
  BottomNavigation,
  BottomNavigationAction,
  Paper,
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
  const [value, setValue] = useState(0);

  return (
    <>
      <BottomSlider
        isMobile={isMobile}
        expanded={expanded}
        handleSliderClose={handleSliderClose}
        pathItem={pathItem}
      />
      {/* ✅ Bottom navigation bar */}
      <Paper
        sx={{
          position: 'fixed',
          bottom: isMobile ? 0 : 24,
          left: isMobile ? 0 : 24,
          right: isMobile ? 0 : 24,
          borderRadius: isMobile ? '24px 24px 0 0' : 50,
          zIndex: 1200,
        }}
        elevation={4}
      >
        <BottomNavigation
          showLabels
          value={value}
          onChange={(_, newValue) => setValue(newValue)}
          sx={{
            backgroundColor: '#7B48FF',
            borderRadius: isMobile ? '24px 24px 0 0' : 50,
            '& .Mui-selected, & .Mui-selected svg': {
              color: '#fff !important',
            },
            '& .MuiBottomNavigationAction-label.Mui-selected': {
              color: '#fff !important',
            },
          }}
        >
          <BottomNavigationAction label="Explore" icon={<LocationOn />} />
          <BottomNavigationAction label="Maps" icon={<Map />} />
          <BottomNavigationAction label="Recents" icon={<Restore />} />
          <BottomNavigationAction label="Save" icon={<Bookmark />} />
        </BottomNavigation>
      </Paper>
    </>
  );
}
