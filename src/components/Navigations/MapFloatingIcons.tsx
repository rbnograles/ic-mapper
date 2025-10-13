import Box from '@mui/material/Box';
import Fab from '@mui/material/Fab';
import { useControls } from 'react-zoom-pan-pinch';
import RestartAltIcon from '@mui/icons-material/RestartAlt';
import { useTheme, useMediaQuery } from '@mui/material';
import { HiMiniSquare3Stack3D } from 'react-icons/hi2';
import { FiZoomIn, FiZoomOut } from 'react-icons/fi';

function MapFloatingIcons({
  transformRef,
  onFloorChangeClick,
}: {
  transformRef: any;
  onFloorChangeClick: () => void;
}) {
  const { zoomIn, zoomOut } = useControls();
  // ✅ MUI breakpoints
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm')); // <600px
  const isTablet = useMediaQuery(theme.breakpoints.between('md', 'xl')); // 600–900px

  const handleReset = () => {
    if (!transformRef?.current) return;

    let scale = 3; // ✅ default for desktop
    let x = 0;
    let y = 0;

    if (isMobile) {
      // 📱 Mobile
      scale = 1.5;
      x = 5;
      y = 190;
    } else if (isTablet) {
      // 💻 Tablet
      scale = 2;
      x = 400; // tweak until centered for tablet
      y = 120;
    } else {
      // 🖥️ Desktop
      scale = 3;
      x = 550; // tweak until centered for desktop
      y = 140;
    }

    transformRef.current.setTransform(x, y, scale);
  };

  return (
    <Box
      sx={{
        '& > :not(style)': {
          m: 1,
          // ✅ Default (desktop/tablet size)
          width: 36,
          height: 36,
          minHeight: 36,
          // ✅ Smaller size for mobile
          '@media (max-width:600px)': {
            width: 40,
            height: 40,
            minHeight: 40,
          },
        },
        position: 'fixed',
        bottom: isMobile ? 60 : isTablet ? 90 : 100,
        right: 16,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        zIndex: 1300,
      }}
    >
      <Fab
        aria-label="add"
        onClick={() => onFloorChangeClick()}
        sx={{ bgcolor: theme.palette.secondary.main }}
      >
        <HiMiniSquare3Stack3D style={{ color: 'white' }} />
      </Fab>
      <Fab aria-label="add" onClick={() => zoomIn()} sx={{ bgcolor: '#7B48FF' }}>
        <FiZoomIn style={{ color: 'white' }} />
      </Fab>
      <Fab aria-label="zoom-out" onClick={() => zoomOut()} sx={{ bgcolor: '#E0DCF4' }}>
        <FiZoomOut />
      </Fab>
      <Fab aria-label="reset" onClick={() => handleReset()} sx={{ bgcolor: '#E0DCF4' }}>
        <RestartAltIcon />
      </Fab>
    </Box>
  );
}

export default MapFloatingIcons;
