import { useRef, useEffect, useState } from 'react';
import {
  Stack,
  Chip,
  ThemeProvider,
  CssBaseline,
  useMediaQuery,
  Box,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
} from '@mui/material';

// icons
import { FaLocationArrow } from 'react-icons/fa';

import { HiDotsHorizontal } from 'react-icons/hi';

import theme from '@/styles/theme';

import useMapStore from '@/store/MapStore';
import CHIPS_ICONMAP from '@/components/common/ChipsIconMapper';

export const Chips = ({ types }: { types: string[] }) => {
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const scrollRef = useRef<HTMLDivElement | null>(null);

  // Use Map Store
  const setSelectedType = useMapStore((state) => state.setSelectedType);
  const resetMap = useMapStore((state) => state.resetMap);

  // Overflow / measurement state
  const [containerWidth, setContainerWidth] = useState<number>(0);
  const [visibleCount, setVisibleCount] = useState<number>(types.length);
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);

  // Wheel handler: convert vertical wheel -> horizontal scroll for desktop
  const handleWheel = (e: React.WheelEvent) => {
    if (isMobile) return;
    const el = scrollRef.current;
    if (!el) return;
    if (e.shiftKey) return;
    if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
      el.scrollLeft += e.deltaY;
      e.preventDefault();
    }
  };

  // Drag-to-scroll implementation for desktop (mouse)
  const isDown = useRef(false);
  const startX = useRef(0);
  const scrollLeft = useRef(0);

  const onMouseDown = (e: React.MouseEvent) => {
    if (isMobile) return;
    const el = scrollRef.current;
    if (!el) return;
    isDown.current = true;
    el.classList.add('dragging');
    startX.current = e.pageX - el.offsetLeft;
    scrollLeft.current = el.scrollLeft;
  };

  const onMouseMove = (e: React.MouseEvent) => {
    if (isMobile) return;
    if (!isDown.current) return;
    const el = scrollRef.current;
    if (!el) return;
    const x = e.pageX - el.offsetLeft;
    const walk = (x - startX.current) * 1.2; // scroll speed
    el.scrollLeft = scrollLeft.current - walk;
    e.preventDefault();
  };

  const onMouseUpOrLeave = () => {
    if (isMobile) return;
    const el = scrollRef.current;
    if (!el) return;
    isDown.current = false;
    el.classList.remove('dragging');
  };

  // measure the container width reactively
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const calc = () => {
      setContainerWidth(el.clientWidth);
    };
    calc();

    const ro = new ResizeObserver(() => {
      calc();
    });
    ro.observe(el);

    // also track window resize (for some cases)
    window.addEventListener('resize', calc);
    return () => {
      ro.disconnect();
      window.removeEventListener('resize', calc);
    };
  }, []);

  // compute visible count based on container width and average chip width
  useEffect(() => {
    if (!containerWidth) {
      setVisibleCount(types.length);
      return;
    }

    // Average chip width heuristic (includes margin/padding)
    const AVERAGE_CHIP_WIDTH = isMobile ? 120 : 140; // tweak if needed
    // reserve one slot for overflow chip if necessary
    const possible = Math.floor(containerWidth / AVERAGE_CHIP_WIDTH);

    if (possible <= 0) {
      setVisibleCount(1);
    } else if (possible >= types.length) {
      setVisibleCount(types.length);
    } else {
      // leave one slot for overflow chip if there are hidden items
      const fits = Math.max(1, possible - 1);
      setVisibleCount(fits);
    }
  }, [containerWidth, isMobile, types.length]);

  // overflow menu handlers
  const handleOverflowOpen = (e: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(e.currentTarget);
  };
  const handleOverflowClose = () => setAnchorEl(null);
  const isOverflowOpen = Boolean(anchorEl);

  const visible = types.slice(0, visibleCount);
  const hidden = types.slice(visibleCount);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box
        ref={scrollRef}
        onWheel={handleWheel}
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={onMouseUpOrLeave}
        onMouseLeave={onMouseUpOrLeave}
        sx={{
          display: 'flex',
          width: '100%',
          overflowX: 'auto',
          WebkitOverflowScrolling: 'touch',
          msOverflowStyle: 'none',
          px: 1,
          py: 1.5,
          '&::-webkit-scrollbar': { display: 'none' },
        }}
      >
        <Stack
          direction="row"
          spacing={1}
          sx={{
            display: 'flex',
            flexWrap: 'nowrap',
            '& .MuiChip-root': {
              flex: '0 0 auto',
              whiteSpace: 'nowrap',
            },
          }}
        >
          {visible.map((type) => (
            <Chip
              key={type}
              label={type}
              onClick={() => {
                resetMap();
                setSelectedType(type);
              }}
              icon={
                CHIPS_ICONMAP[type] ? (
                  CHIPS_ICONMAP[type]({
                    color: 'white',
                    fontSize: 16,
                  })
                ) : (
                  <FaLocationArrow style={{ color: 'white' }} />
                )
              }
              clickable
              variant="filled"
              sx={{
                backgroundColor: theme.palette.primary.main,
                color: 'white',
                boxShadow: '0 2px 4px rgba(0,0,0,0.12)',
                transition: 'transform 0.15s ease',
                '&:hover, &:active': {
                  transform: 'translateY(-2px)',
                  backgroundColor: theme.palette.secondary.main,
                },
                maxWidth: 220,
                textOverflow: 'ellipsis',
                overflow: 'hidden',
              }}
            />
          ))}

          {hidden.length > 0 && (
            <>
              <Chip
                label={`+${hidden.length}`}
                icon={<HiDotsHorizontal style={{ fontSize: 22, color: 'white', marginLeft: 16 }} />}
                onClick={handleOverflowOpen}
                clickable
                variant="filled"
                sx={{
                  backgroundColor: theme.palette.primary.main,
                  color: 'white',
                  '&:hover': { backgroundColor: theme.palette.secondary.main },
                }}
              />

              <Menu
                anchorEl={anchorEl}
                open={isOverflowOpen}
                onClose={handleOverflowClose}
                PaperProps={{ sx: { maxHeight: 320 } }}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                transformOrigin={{ vertical: 'top', horizontal: 'right' }}
              >
                {hidden.map((type) => (
                  <MenuItem
                    key={type}
                    onClick={() => {
                      setSelectedType(type);
                      handleOverflowClose();
                    }}
                    sx={{ gap: 1 }}
                  >
                    <ListItemIcon sx={{ minWidth: 36 }}>
                      {CHIPS_ICONMAP[type] ? (
                        CHIPS_ICONMAP[type]({
                          color: theme.palette.primary.main,
                          fontSize: 18,
                        })
                      ) : (
                        <FaLocationArrow style={{ color: theme.palette.primary.main }} />
                      )}
                    </ListItemIcon>
                    <ListItemText primary={type} />
                  </MenuItem>
                ))}
              </Menu>
            </>
          )}
        </Stack>
      </Box>
    </ThemeProvider>
  );
};

export default Chips;
