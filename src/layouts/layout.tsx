import { Outlet } from 'react-router-dom';
import { Box } from '@mui/material';
import BottomNavBar from '@/components/navigation/BottomNavBar';
import { layoutStyles } from '@/styles/layoutStyles';
import ThemeToggleButton from '@/components/props/ThemeToggle';
import { CustomThemeProvider } from '@/app/providers/ThemeProvider';

export default function Layout() {
  return (
    <CustomThemeProvider>
      <Box sx={layoutStyles.appRoot}>
        {/* <Box
          sx={{
            position: 'fixed',
            top: 12,
            right: 12,
            zIndex: (theme) => theme.zIndex.tooltip + 1,
            borderRadius: 1,
            p: 0.5,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            bgcolor: 'transparent',
          }}
        >
          <ThemeToggleButton />
        </Box> */}

        <Outlet />

        <BottomNavBar />
      </Box>
    </CustomThemeProvider>
  );
}
