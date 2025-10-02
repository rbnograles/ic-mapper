import { Paper, Box, Slide, Typography, IconButton } from '@mui/material';
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
    <>
      <Slide direction={isMobile ? 'up' : 'right'} in={expanded} mountOnEnter unmountOnExit>
        <Paper
          elevation={20}
          sx={{
            position: 'fixed',
            bottom: isMobile ? 0 : 0,
            left: isMobile ? 0 : 0,
            width: isMobile ? '100%' : 360,
            height: isMobile ? '40vh' : 'calc(100vh - 300px)',
            borderRadius: isMobile ? '24px 24px 0 0' : '10px 10px 0 0',
            p: 2,
            backgroundColor: '#ECECEC',
            boxShadow: 8,
            zIndex: 1201,
          }}
        >
          {/* Close / Drag Handle */}
          {isMobile ? (
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
          ) : (
            <Box display="flex" justifyContent="flex-end">
              <IconButton onClick={handleSliderClose} size="small">
                <CloseIcon />
              </IconButton>
            </Box>
          )}

          {/* Scrollable Content */}
          <Box sx={{ overflowY: 'auto', height: '100%', px: 1 }}>
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
    </>
  );
}

export default BottomSlider;
