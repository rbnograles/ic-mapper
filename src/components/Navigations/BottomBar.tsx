import * as React from 'react';
import BottomNavigation from '@mui/material/BottomNavigation';
import BottomNavigationAction from '@mui/material/BottomNavigationAction';
import RestoreIcon from '@mui/icons-material/Restore';
import FavoriteIcon from '@mui/icons-material/Favorite';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import { Paper } from '@mui/material';

export default function BottomBar() {
  const [value, setValue] = React.useState(0);

  return (
    <Paper
      sx={{
        position: 'fixed',
        bottom: 24,
        left: 24,
        right: 24,
        borderRadius: 50
      }}
      elevation={4}
    >
      <BottomNavigation
        showLabels
        value={value}
        onChange={(event, newValue) => setValue(newValue)}
        sx={{
          backgroundColor: '#7B48FF',
          borderRadius: 50,
          // 👇 force icon + label to white when selected
          '& .Mui-selected, & .Mui-selected svg': {
            color: '#fff !important'
          },
          '& .MuiBottomNavigationAction-label.Mui-selected': {
            color: '#fff !important'
          }
        }}
      >
        <BottomNavigationAction label="Recents" icon={<RestoreIcon />} />
        <BottomNavigationAction label="Favorites" icon={<FavoriteIcon />} />
        <BottomNavigationAction label="Nearby" icon={<LocationOnIcon />} />
      </BottomNavigation>
    </Paper>
  );
}
