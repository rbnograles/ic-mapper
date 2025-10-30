import { Outlet } from 'react-router-dom';
import { ThemeProvider, CssBaseline, Drawer, Box } from '@mui/material';
import theme from '@/styles/theme';
import BottomNavBar from '@/components/navigation/BottomNavBar';
import { layoutStyles } from '@/styles/layoutStyles';
import { IMapItem } from '@/types';

export default function Layout() {
  const placeItem: IMapItem = {
    entranceNodes: [],
    path: '',
    centroid: [],
    floor: '',
    baseFill: '',
    centerY: 0,
    id: '',
    name: '',
    type: '',
  };
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box sx={layoutStyles.appRoot}>
        {/* top-level fixed content (AppBar, Search) can go here if you want */}
        <Outlet />
        {/* persistent bottom bar (always visible) */}
        <BottomNavBar
          expanded={false} // wire in real state if you have slider
          handleSliderClose={() => {}}
          pathItem={placeItem}
        />
      </Box>
    </ThemeProvider>
  );
}
