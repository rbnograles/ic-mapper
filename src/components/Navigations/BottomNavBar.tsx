import { LocationOn, Bookmark } from '@mui/icons-material';
import {
  useMediaQuery,
  CssBaseline,
  Paper,
  BottomNavigation,
  BottomNavigationAction,
  useTheme,
  ThemeProvider,
} from '@mui/material';
import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import LocationInformation from '@/components/Drawers/LocationInformation';
import { FaMap } from 'react-icons/fa';
import useDrawerStore from '@/store/DrawerStore';

export default function BottomNavBar() {
  const theme = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.between('md', 'lg'));
  const isDesktop = useMediaQuery(theme.breakpoints.up('md'));

  // value: 0=Explore, 1=Maps, 2=Save
  const [value, setValue] = useState<number>(() => {
    // initial mapping based on current location pathname
    if (location.pathname.startsWith('/explore')) return 0;
    if (location.pathname.startsWith('/map')) return 1;
    if (location.pathname.startsWith('/saved')) return 2;
    // add other route checks as needed
    return 1;
  });

  // keep selected tab in sync when route changes externally (back/forward)
  useEffect(() => {
    if (location.pathname.startsWith('/explore')) setValue(0);
    else if (location.pathname.startsWith('/map')) setValue(1);
    else if (location.pathname.startsWith('/saved')) setValue(2);
    else setValue(1);
  }, [location.pathname]);

  const handleChange = (_: any, newValue: number) => {
    setValue(newValue);

    if (newValue === 0) {
      // go to explore route
      navigate('/explore-route');
    } else if (newValue === 1) {
      // open maps drawer (keeps you on the same route)
      navigate('/map');
    } else if (newValue === 2) {
      // example: navigate to saved page
      navigate('/saved');
    }
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <LocationInformation
        isMobile={isMobile}
      />

      <Paper
        sx={{
          position: 'fixed',
          bottom: isMobile ? 0 : 24,
          left: isMobile ? 0 : isTablet || isDesktop ? 'calc(50% - 250px)' : 24,
          right: isMobile ? 0 : isTablet || isDesktop ? 'calc(50% - 250px)' : 24,
          width: isTablet || isDesktop ? 550 : 'auto',
          borderRadius: isMobile ? '24px 24px 0 0' : 50,
          zIndex: 1200,
        }}
        elevation={6}
      >
        <BottomNavigation
          showLabels
          value={value}
          onChange={handleChange}
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
        >
          <BottomNavigationAction label="Explore" icon={<LocationOn />} />
          <BottomNavigationAction label="Maps" icon={<FaMap style={{ fontSize: 22 }} />} />
          <BottomNavigationAction label="Save" icon={<Bookmark />} />
        </BottomNavigation>
      </Paper>
    </ThemeProvider>
  );
}
