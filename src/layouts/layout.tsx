import { Outlet } from 'react-router-dom';
import { Box } from '@mui/material';
import BottomNavBar from '@/components/navigation/BottomNavBar';
import { layoutStyles } from '@/styles/layoutStyles';
import { CustomThemeProvider } from '@/app/providers/ThemeProvider';

export default function Layout() {
  return (
    <CustomThemeProvider>
      <Box sx={layoutStyles.appRoot}>
        <Outlet />
        <BottomNavBar />
      </Box>
    </CustomThemeProvider>
  );
}
