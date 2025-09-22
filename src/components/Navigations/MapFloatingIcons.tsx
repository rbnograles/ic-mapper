import Box from '@mui/material/Box';
import Fab from '@mui/material/Fab';
import AddIcon from '@mui/icons-material/Add';
import {  useControls } from 'react-zoom-pan-pinch';
import { Remove } from '@mui/icons-material';
import RestartAltIcon from '@mui/icons-material/RestartAlt';

function MapFloatingIcons() {
    const { zoomIn, zoomOut, resetTransform } = useControls();

  return (
    <Box sx={{ '& > :not(style)': { m: 1 }, position: 'fixed', bottom: 100, right: 16, display: 'flex', flexDirection: 'column', alignItems: 'center', zIndex: 1300, gap: -15 }}>
      <Fab aria-label="add" onClick={() => zoomIn()} style={{backgroundColor: '#7B48FF'}}>
        <AddIcon style={{ color:" white"}} />
      </Fab>
      <Fab  aria-label="edit" onClick={() => zoomOut()} style={{backgroundColor: '#E0DCF4'}}>
        <Remove />
      </Fab>
       <Fab  aria-label="edit" onClick={() => resetTransform()} style={{backgroundColor: '#E0DCF4'}}>
        <RestartAltIcon  />
      </Fab>
    </Box>
  )
}

export default MapFloatingIcons