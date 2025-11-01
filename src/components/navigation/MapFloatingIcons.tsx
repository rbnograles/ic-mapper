import Box from '@mui/material/Box';
import Fab from '@mui/material/Fab';
import { useControls } from 'react-zoom-pan-pinch';
import RestartAltIcon from '@mui/icons-material/RestartAlt';
import { useTheme, useMediaQuery } from '@mui/material';
import { HiMiniSquare3Stack3D } from 'react-icons/hi2';
import { FiZoomIn, FiZoomOut } from 'react-icons/fi';
import useDrawerStore from '@/store/DrawerStore';
import { Fragment } from 'react/jsx-runtime';
import { FaDirections } from 'react-icons/fa';
import { useThemeMode } from '@/app/providers/ThemeProvider';
import Brightness4Icon from '@mui/icons-material/Brightness4';
import Brightness7Icon from '@mui/icons-material/Brightness7';

function MapFloatingIcons({ transformRef }: { transformRef: any }) {
  const { zoomIn, zoomOut } = useControls();
  const theme = useTheme();
  const { mode, toggleColorMode } = useThemeMode();

  const isMobile = useMediaQuery(theme.breakpoints.down('sm')); 
  const isMidTablet = useMediaQuery(theme.breakpoints.between('sm', 'md'));
  const isTablet = useMediaQuery(theme.breakpoints.between('md', 'xl'));
  
  const setIsFloorMapOpen = useDrawerStore((state) => state.setIsFloorMapOpen);
  const setIsDirectionPanelOpen = useDrawerStore((state) => state.setIsDirectionPanelOpen);

  const handleReset = () => {
    if (!transformRef?.current) return;
    transformRef.current.setTransform(450, 140, 3);
  };

  // ✅ Simplified positioning logic
  const getTopPosition = () => {
    if (isMobile) return '140px'; // Below chips on mobile
    return '16px'; // Top-right on desktop
  };

  const getBottomPosition = () => {
    if (isMobile) return 70; // Above bottom nav
    if (isMidTablet) return 100;
    return 16; // Standard desktop spacing
  };

  return (
    <>
      {/* ✅ TOP GROUP: Night mode + Floor selector - Always top-right */}
      <Box
        sx={{
          position: 'fixed',
          top: getTopPosition(),
          right: isMobile ? 8 : 16,
          display: 'flex',
          flexDirection: 'column',
          gap: 1,
          zIndex: 1300, // ✅ Higher than AppBar to stay on top
        }}
      >
        <Fab
          onClick={toggleColorMode}
          sx={{ 
            bgcolor: theme.palette.secondary.main, 
            width: isMobile ? 50 : 55,
            height: isMobile ? 50 : 55,
            borderRadius: '22px'
          }}
          aria-label="toggle theme"
        >
          {theme.palette.mode === 'dark' ? (
            <Brightness7Icon sx={{ color: 'white', fontSize: 18 }} />
          ) : (
            <Brightness4Icon sx={{ color: 'white', fontSize: 18 }} />
          )}
        </Fab>
        
        <Fab
          onClick={() => setIsFloorMapOpen(true)}
          sx={{ 
            bgcolor: theme.palette.secondary.main,
            width: isMobile ? 50 : 55,
            height: isMobile ? 50 : 55,
            borderRadius: '22px'
          }}
          aria-label="floor selector"
        >
          <HiMiniSquare3Stack3D style={{ color: 'white', fontSize: 18 }} />
        </Fab>
      </Box>

      {/* All other controls - Bottom-right */}
      <Box
        sx={{
          position: 'fixed',
          bottom: getBottomPosition(),
          right: isMobile ? 8 : 16,
          display: 'flex',
          flexDirection: 'column',
          gap: 1,
          zIndex: 1100, // Below top group but above map
        }}
      >
        <Fab
          onClick={() => setIsDirectionPanelOpen(true)}
          sx={{ 
            bgcolor: theme.palette.primary.main,
            width: isMobile ? 50 : 55,
            height: isMobile ? 50 : 55,
            borderRadius: '22px'
          }}
          aria-label="directions"
        >
          <FaDirections style={{ color: 'white', fontSize: 18 }} />
        </Fab>

        {/* ✅ Zoom controls - Only on desktop */}
        {!isMobile && !isMidTablet && !isTablet && (
          <>
            <Fab 
              onClick={() => zoomIn()} 
              sx={{ 
                bgcolor: theme.palette.primary.main,
                width: 55,
                height: 55,
                borderRadius: '22px'
              }}
              aria-label="zoom in"
            >
              <FiZoomIn style={{ color: 'white' }} />
            </Fab>
            
            <Fab 
              onClick={() => zoomOut()} 
              sx={{ 
                bgcolor: theme.palette.secondary.light || '#E0DCF4',
                width: 55,
                height: 55,
                borderRadius: '22px'
              }}
              aria-label="zoom out"
            >
              <FiZoomOut style={{ color: 'white'}} />
            </Fab>
            
            <Fab 
              onClick={handleReset} 
              sx={{ 
                bgcolor: theme.palette.secondary.light || '#E0DCF4',
                width: 55,
                height: 55,
                borderRadius: '22px'
              }}
              aria-label="reset view"
            >
              <RestartAltIcon style={{ color: 'white'}} />
            </Fab>
          </>
        )}
      </Box>
    </>
  );
}

export default MapFloatingIcons;
