import { Box, Typography, IconButton, Divider, Stack, SwipeableDrawer } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import type { PathItem } from '../../interface/BaseMap';

function BottomSlider({
  isMobile,
  expanded,
  handleSliderClose,
  pathItem,
}: {
  isMobile: boolean;
  expanded: boolean;
  handleSliderClose: () => void;
  pathItem: PathItem;
}) {
  return (
    <SwipeableDrawer
      anchor={isMobile ? 'bottom' : 'left'}
      open={expanded}
      onClose={handleSliderClose}
      onOpen={() => {}}
      disableSwipeToOpen={false}
      PaperProps={{
        sx: {
          borderRadius: isMobile ? '24px 24px 0 0' : '10px 0 0 10px',
          height: isMobile ? '75vh' : '100vh',
          width: isMobile ? '100%' : 380,
          p: 2,
          backgroundColor: 'white',
          boxShadow: 8,
          display: 'flex',
          flexDirection: 'column',
        },
      }}
    >
      {/* Drag handle */}
      {isMobile && (
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
      )}

      {/* Close button for desktop */}
      {!isMobile && (
        <Box display="flex" justifyContent="flex-end">
          <IconButton onClick={handleSliderClose} size="small">
            <CloseIcon />
          </IconButton>
        </Box>
      )}

      {/* Header */}
      <Box sx={{ flexShrink: 0 }}>
        {pathItem ? (
          <>
            <Typography variant="h6" fontWeight="bold" mb={1} textAlign="center">
              {pathItem.name}
            </Typography>

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

            {pathItem.type && (
              <Typography variant="subtitle2" color="text.secondary" textAlign="center" mb={1}>
                {pathItem.type}
              </Typography>
            )}

            {pathItem.description && (
              <Typography variant="body2" textAlign="justify" mb={2}>
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

      {/* Scrollable Schedule Section */}
      {pathItem?.schedule && pathItem.schedule.length > 0 && (
        <Box
          sx={{
            overflowY: 'auto',
            flexGrow: 1,
            pr: 1,
          }}
        >
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

          <Stack spacing={1.5} pb={2}>
            {pathItem.schedule.map((s, i) => (
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
        </Box>
      )}
    </SwipeableDrawer>
  );
}

export default BottomSlider;
