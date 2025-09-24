import { useState } from 'react';
import {
  BottomNavigation,
  BottomNavigationAction,
  Paper,
  Box,
  Slide,
  useMediaQuery,
  useTheme,
  Typography,
} from '@mui/material';
import { LocationOn, Map, Restore, Bookmark } from '@mui/icons-material';
import type { PathItem } from '../../App';

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
      {/* ✅ Details panel when expanded */}
      {/* TODO: Change the up into left sidebar when tablet or pc */}
      <Slide direction={isMobile ? 'up' : 'up'} in={expanded} mountOnEnter unmountOnExit>
        <Paper
          sx={{
            position: 'fixed',
            bottom: isMobile ? 0 : 24,
            left: isMobile ? 0 : 24,
            right: isMobile ? 0 : 24,
            height: isMobile ? '50vh' : 300,
            borderRadius: isMobile ? '24px 24px 0 0' : 4,
            p: 2,
            backgroundColor: '#fff',
            boxShadow: 6,
            zIndex: 1201,
          }}
        >
          {/* Drag Handle */}
          <Box display="flex" justifyContent="center" mb={2}>
            <Box
              onClick={handleSliderClose}
              sx={{
                width: 40,
                height: 4,
                borderRadius: 2,
                bgcolor: 'grey.400',
                cursor: 'pointer',
              }}
            />
          </Box>

          {/* Scrollable Content */}
          <Box sx={{ overflowY: 'auto', height: '100%', px: 1 }}>
            {pathItem ? (
              <>
                {/* Store Name */}
                <Typography variant="h6" fontWeight="bold" mb={1} textAlign="center">
                  {pathItem.name}
                </Typography>

                {/* Store Image */}
                {pathItem.img && (
                  <Box
                    component="img"
                    src={pathItem.img}
                    alt={pathItem.name}
                    sx={{
                      width: '100%',
                      maxHeight: 160,
                      objectFit: 'cover',
                      borderRadius: 2,
                      mb: 2,
                    }}
                  />
                )}

                {/* Store Type */}
                {pathItem.type && (
                  <Typography variant="subtitle2" color="text.secondary" textAlign="center" mb={1}>
                    {pathItem.type}
                  </Typography>
                )}

                {/* Description */}
                {pathItem.description && (
                  <Typography variant="body2" textAlign="justify">
                    {pathItem.description}
                  </Typography>
                )}
              </>
            ) : (
              <Typography variant="body2" color="text.secondary" textAlign="center">
                No information available.
              </Typography>
            )}
          </Box>
        </Paper>
      </Slide>

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
