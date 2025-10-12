import FlatwareIcon from '@mui/icons-material/Flatware';
import StorefrontIcon from '@mui/icons-material/Storefront';
import WcIcon from '@mui/icons-material/Wc';
import RoomServiceIcon from '@mui/icons-material/RoomService';
import ElevatorIcon from '@mui/icons-material/Elevator';
import DoorFrontIcon from '@mui/icons-material/DoorFront';
import ParkIcon from '@mui/icons-material/Park';
import { Stack, Chip, ThemeProvider, CssBaseline, useMediaQuery, Box } from '@mui/material';
import { useRef, type JSX } from 'react';
import { FaBus, FaRunning } from 'react-icons/fa';
import {
  FaHandHoldingHand,
  FaLocationArrow,
  FaMasksTheater,
  FaPeopleArrows,
  FaStairs,
} from 'react-icons/fa6';
import { BsBank2 } from 'react-icons/bs';
import { MdHotel } from 'react-icons/md';
import { FaSignsPost } from 'react-icons/fa6';
import { MdEmojiEvents } from 'react-icons/md';

import theme from '../../styles/theme';
import { GrEscalator } from 'react-icons/gr';

export const iconMap: Record<string, (style?: React.CSSProperties) => JSX.Element> = {
  'Food & Beverage': (style = {}) => (
    <FlatwareIcon style={{ color: 'white', fontSize: 15, ...style }} />
  ),
  Retail: (style = {}) => <StorefrontIcon style={{ color: 'white', ...style }} />,
  Restroom: (style = {}) => <WcIcon style={{ color: 'white', ...style }} />,
  Services: (style = {}) => (
    <FaHandHoldingHand style={{ color: 'white', fontSize: 15, ...style }} />
  ),
  Concierge: (style = {}) => <RoomServiceIcon style={{ color: 'white', ...style }} />,
  Elevator: (style = {}) => <ElevatorIcon style={{ color: 'white', ...style }} />,
  Escalator: (style = {}) => <GrEscalator style={{ color: 'white', ...style }} />,
  'Entrance/Exit': (style = {}) => <DoorFrontIcon style={{ color: 'white', ...style }} />,
  Park: (style = {}) => <ParkIcon style={{ color: 'white', ...style }} />,
  'Transport Terminal': (style = {}) => <FaBus style={{ color: 'white', ...style }} />,
  Stairs: (style = {}) => <FaStairs style={{ color: 'white', ...style }} />,
  Bank: (style = {}) => <BsBank2 style={{ color: 'white', ...style }} />,
  Entertainment: (style = {}) => <FaMasksTheater style={{ color: 'white', ...style }} />,
  'Fire Exit': (style = {}) => <FaRunning style={{ color: 'white', ...style }} />,
  Hotel: (style = {}) => <MdHotel style={{ color: 'white', ...style }} />,
  Landmark: (style = {}) => <FaSignsPost style={{ color: 'white', ...style }} />,
  'Activity Center': (style = {}) => <MdEmojiEvents style={{ color: 'white', ...style }} />,
  "Jehovah's Witnesses Carts": (style = {}) => (
    <FaPeopleArrows style={{ color: 'white', ...style }} />
  ),
};

type ChipsProps = {
  handleClick: (type: string) => void;
  types: string[];
};

export const Chips = ({ handleClick, types }: ChipsProps) => {
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const scrollRef = useRef<HTMLDivElement | null>(null);

  // Wheel handler: convert vertical wheel -> horizontal scroll for desktop
  const handleWheel = (e: React.WheelEvent) => {
    // only on non-mobile
    if (isMobile) return;
    const el = scrollRef.current;
    if (!el) return;

    // If user holds shift we want native behavior, so don't intercept when shiftKey
    if (e.shiftKey) return;

    // Convert vertical scrolling into horizontal
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

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      {/* wrapper gives us pointer/touch handling and wheel capture */}
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
          // allow horizontal scrolling
          overflowX: 'auto',
          WebkitOverflowScrolling: 'touch',
          msOverflowStyle: 'none', // IE/Edge
          // optional visual while dragging
          '& .dragging': {},
          // padding so chips don't touch edges
          px: 1,
          py:1.5,
          // 🌟 Hide scrollbar for all browsers
          '&::-webkit-scrollbar': { display: 'none' }, // Chrome, Safari, Opera
        }}
      >
        <Stack
          direction="row"
          spacing={1}
          sx={{
            display: 'flex',
            flexWrap: 'nowrap',
            // each chip should not shrink
            '& .MuiChip-root': {
              flex: '0 0 auto',
              whiteSpace: 'nowrap',
            },
          }}
        >
          {types.map((type) => (
            <Chip
              key={type}
              label={type}
              onClick={() => handleClick(type)}
              icon={
                iconMap[type] ? (
                  iconMap[type]({
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
              }}
            />
          ))}
        </Stack>
      </Box>
    </ThemeProvider>
  );
};

export default Chips;
