import React, { useEffect, useRef, useState } from 'react';
import {
  Box,
  Typography,
  IconButton,
  Divider,
  Stack,
  SwipeableDrawer,
  useTheme,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
// State Manager
import useMapStore from '@/store/MapStore';
import useDrawerStore from '@/store/DrawerStore';

function LocationInformation({ isMobile }: { isMobile: boolean }) {
  const theme = useTheme();
  // Use Map Store
  const map = useMapStore((state) => state.map);
  // Use Drawer Store
  const isSheetOpen = useDrawerStore((state) => state.isExpanded);
  const setIsSheetOpen = useDrawerStore((state) => state.setIsExpanded);

  const [expanded, setExpanded] = useState(!isMobile);

  // Drag / touch state
  const startYRef = useRef<number | null>(null);
  const lastYRef = useRef<number | null>(null);
  const draggingRef = useRef(false);

  // Config
  const PEEK_HEIGHT = 110; // px shown on initial peek (adjust to show name)
  const EXPANDED_HEIGHT = '75vh'; // expanded size on mobile
  const TRANSITION_MS = 220;
  const DRAG_THRESHOLD = 40; // px - how far to drag to toggle

  // when the global sheet open flag toggles open -> reset to peek
  useEffect(() => {
    if (isSheetOpen) {
      setExpanded(false); // true for desktop, false (peek) for mobile
    } else {
      // when sheet is closed, reset collapsed state
      setExpanded(false);
    }
  }, [isSheetOpen, isMobile]);

  // Touch / mouse handlers attached to the drag handle area
  const onTouchStart = (e: React.TouchEvent) => {
    if (!isMobile) return;
    const y = e.touches[0].clientY;
    startYRef.current = y;
    lastYRef.current = y;
    draggingRef.current = true;
  };

  const onTouchMove = (e: React.TouchEvent) => {
    if (!isMobile) return;
    if (!draggingRef.current) return;
    lastYRef.current = e.touches[0].clientY;
  };

  const onTouchEnd = () => {
    if (!isMobile) return;
    if (!draggingRef.current) return;
    const start = startYRef.current ?? 0;
    const end = lastYRef.current ?? start;
    const delta = start - end; // positive when dragging up
    draggingRef.current = false;
    startYRef.current = null;
    lastYRef.current = null;

    if (!expanded && delta > DRAG_THRESHOLD) {
      // dragged up enough -> expand
      setExpanded(true);
    } else if (expanded && delta < -DRAG_THRESHOLD) {
      // dragged down enough -> collapse
      setExpanded(false);
    }
  };

  // Mouse equivalents for desktop / emulation (optional)
  const onMouseDown = (e: React.MouseEvent) => {
    if (!isMobile) return;
    startYRef.current = e.clientY;
    lastYRef.current = e.clientY;
    draggingRef.current = true;
  };

  const onMouseMove = (e: React.MouseEvent) => {
    if (!isMobile) return;
    if (!draggingRef.current) return;
    lastYRef.current = e.clientY;
  };

  const onMouseUp = () => {
    if (!isMobile) return;
    if (!draggingRef.current) return;
    const start = startYRef.current ?? 0;
    const end = lastYRef.current ?? start;
    const delta = start - end;
    draggingRef.current = false;
    startYRef.current = null;
    lastYRef.current = null;

    if (!expanded && delta > DRAG_THRESHOLD) setExpanded(true);
    else if (expanded && delta < -DRAG_THRESHOLD) setExpanded(false);
  };

  // toggle on handle click
  const toggleExpanded = () => setExpanded((s) => !s);

  // close sheet
  const handleClose = () => {
    setIsSheetOpen(false);
    setExpanded(false);
  };

  // computed paper style
  const paperSx = {
    borderRadius: '16px 16px 0 0',
    height: isMobile ? (expanded ? EXPANDED_HEIGHT : `${PEEK_HEIGHT}px`) : '75vh',
    width: isMobile ? '100%' : 380,
    backgroundColor: theme.palette.background.default,
    boxShadow: 8,
    display: 'flex',
    flexDirection: 'column' as const,
    overflow: 'hidden',
    transition: `height ${TRANSITION_MS}ms cubic-bezier(.2,.8,.2,1)`,
    touchAction: 'none' as const, // let us handle touch
  };

  return (
    <SwipeableDrawer
      anchor="bottom"
      open={isSheetOpen}
      onOpen={() => {
        // keep peek on open
      }}
      onClose={handleClose}
      disableSwipeToOpen={false}
      // only show backdrop when fully expanded — allow map interaction when peek
      hideBackdrop={!expanded}
      ModalProps={{
        keepMounted: true,
        disableEnforceFocus: true,
        // when expanded, use a semi-transparent backdrop to block map interaction
        ...(expanded
          ? {
              BackdropProps: {
                sx: {
                  backgroundColor: 'rgba(0,0,0,0.18)',
                },
              },
            }
          : {
              // when not expanded, ensure no backdrop styles (no blocking)
              BackdropProps: {
                sx: {
                  backgroundColor: 'transparent',
                  pointerEvents: 'none',
                },
              },
            }),
      }}
      PaperProps={{
        sx: paperSx,
      }}
      sx={{
        pointerEvents: expanded ? 'auto' : 'none',
        '& .MuiDrawer-paper': {
          pointerEvents: 'auto',
          zIndex: (theme as any).zIndex?.drawer + 300,
        },
      }}
    >
      {/* --- Drag Handle area (always visible on mobile peek) --- */}
      {isMobile && (
        <Box
          sx={{
            px: 2,
            py: 0.75,
            cursor: 'grab',
            flexShrink: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: expanded ? 'transparent' : 'transparent',
            userSelect: 'none',
          }}
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
          onMouseDown={onMouseDown}
          onMouseMove={onMouseMove}
          onMouseUp={onMouseUp}
          onClick={(e) => {
            e.stopPropagation();
            toggleExpanded();
          }}
        >
          <Box
            sx={{
              width: 40,
              height: 6,
              borderRadius: 3,
              bgcolor: 'grey.400',
              mb: 0.25,
            }}
          />
        </Box>
      )}

      {/* --- Top Row: Name + close button (when expanded) or just name on peek --- */}
      <Box
        sx={{
          px: 2,
          py: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 1,
          flexShrink: 0,
        }}
      >
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography
            variant="h6"
            fontWeight="bold"
            noWrap
            textAlign={isMobile ? 'center' : 'left'}
          >
            {map?.name ?? 'No name'}
          </Typography>
          <Typography
            variant="subtitle2"
            noWrap
            textAlign={isMobile ? 'center' : 'left'}
          >
            {map.floor}
          </Typography>
          {isMobile && !expanded && map?.type && (
            <Typography variant="caption" color="text.secondary" noWrap textAlign="center">
              {map.type}
            </Typography>
          )}
        </Box>

        {(!isMobile || expanded) && (
          <IconButton onClick={handleClose} size="small" aria-label="close location" sx={{ ml: 1 }}>
            <CloseIcon />
          </IconButton>
        )}
      </Box>

      {/* content (shown only when expanded) */}
      {!isMobile || expanded ? (
        <Box
          sx={{
            flexGrow: 1,
            overflowY: 'auto',
            px: 2,
            pb: 4,
            minHeight: 0,
          }}
        >
          {map ? (
            <>
              {map.type && (
                <Typography variant="subtitle2" color="text.secondary" textAlign="left" mb={1}>
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

          {map?.schedule && map.schedule.length > 0 && (
            <>
              <Divider sx={{ my: 2 }} />
              <Typography variant="subtitle1" fontWeight="bold" color="primary" mb={1}>
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
      ) : (
        <Box sx={{ height: 8 }} />
      )}
    </SwipeableDrawer>
  );
}

export default LocationInformation;
