import { Box, Typography, IconButton, Divider, Stack, SwipeableDrawer } from '@mui/material';
// Icons
import CloseIcon from '@mui/icons-material/Close';
// State Manager
import useMapStore from '@/store/MapStore';
import useDrawerStore from '@/store/DrawerStore';

function LocationInformation({ isMobile }: { isMobile: boolean }) {
  // Using Map Store
  // Main State
  const map = useMapStore((state) => state.map);
  // Use Drawer Store
  const isExpanded = useDrawerStore((state) => state.isExpanded);
  const setIsExpanded = useDrawerStore((state) => state.setIsExpanded);

  return (
    <SwipeableDrawer
      anchor={isMobile ? 'bottom' : 'left'}
      open={isExpanded}
      onClose={() => setIsExpanded(false)}
      onOpen={() => {}}
      disableSwipeToOpen={false}
      hideBackdrop
      ModalProps={{
        keepMounted: true,
        disableEnforceFocus: true,
        BackdropProps: { invisible: true },
      }}
      PaperProps={{
        sx: {
          borderRadius: isMobile ? '24px 24px 0 0' : '10px 0 0 10px',
          height: isMobile ? '75vh' : '100vh',
          width: isMobile ? '100%' : 380,
          backgroundColor: 'white',
          boxShadow: 8,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden', // ✅ prevent outer scroll, we'll handle inside
        },
      }}
      sx={{
        pointerEvents: 'none',
        '& .MuiDrawer-paper': { pointerEvents: 'auto' },
      }}
    >
      {/* --- Drag Handle --- */}
      {isMobile && (
        <Box display="flex" justifyContent="center" pt={1} pb={1.5} flexShrink={0}>
          <Box
            onClick={() => setIsExpanded(false)}
            sx={{
              width: 40,
              height: 4,
              borderRadius: 2,
              bgcolor: 'grey.400',
              cursor: 'pointer',
            }}
          />
        </Box>
      )}

      {/* --- Close button (desktop only) --- */}
      {!isMobile && (
        <Box display="flex" justifyContent="flex-end" p={1} flexShrink={0}>
          <IconButton onClick={() => setIsExpanded(false)} size="small">
            <CloseIcon />
          </IconButton>
        </Box>
      )}

      {/* --- Scrollable Content Section --- */}
      <Box
        sx={{
          flexGrow: 1,
          overflowY: 'auto',
          px: 2,
          pb: 4, // ✅ ensures last item visible
          minHeight: 0, // ✅ critical for flex scroll behavior
        }}
      >
        {/* --- Header / Main Info --- */}
        <Box sx={{ flexShrink: 0 }}>
          {map ? (
            <>
              <Typography variant="h6" fontWeight="bold" mb={1} textAlign="center">
                {map.name}
              </Typography>

              {map.type && (
                <Typography variant="subtitle2" color="text.secondary" textAlign="center" mb={1}>
                  {map.type}
                </Typography>
              )}

              {map.description && (
                <Typography variant="body2" textAlign="justify" mb={2}>
                  {map.description}
                </Typography>
              )}
            </>
          ) : (
            <Typography variant="body2" color="text.secondary" textAlign="center">
              No information available.
            </Typography>
          )}
        </Box>

        {/* --- Scrollable Schedule Section --- */}
        {map?.schedule && map.schedule.length > 0 && (
          <>
            <Divider sx={{ my: 2 }} />
            <Typography
              variant="subtitle1"
              fontWeight="bold"
              textAlign="center"
              mb={1}
              color="primary"
            >
              Schedule
            </Typography>

            <Stack spacing={1.5} pb={isMobile ? 0 : 10}>
              {map.schedule.map((s, i) => (
                <Box
                  key={i}
                  sx={{
                    border: '1px solid #ddd',
                    borderRadius: 2,
                    p: 1.5,
                    bgcolor: '#fafafa',
                  }}
                >
                  <Typography variant="subtitle2" fontWeight="bold" color="text.primary">
                    {s.time}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {s.date}
                  </Typography>
                  <Typography variant="body2" mt={0.5}>
                    <strong>Volunteers:</strong> {s.volunteers.join(', ')}
                  </Typography>
                  <Typography variant="body2">
                    <strong>Guide:</strong> {s.guide}
                  </Typography>
                  <Typography variant="body2">
                    <strong>Congregation:</strong> {s.congregation}
                  </Typography>
                </Box>
              ))}
            </Stack>
          </>
        )}
      </Box>
    </SwipeableDrawer>
  );
}

export default LocationInformation;
