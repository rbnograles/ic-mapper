import FlatwareIcon from '@mui/icons-material/Flatware';
import StorefrontIcon from '@mui/icons-material/Storefront';
import WcIcon from '@mui/icons-material/Wc';
import RoomServiceIcon from '@mui/icons-material/RoomService';
import ElevatorIcon from '@mui/icons-material/Elevator';
import DoorFrontIcon from '@mui/icons-material/DoorFront';
import ParkIcon from '@mui/icons-material/Park';
import { Stack, Chip, ThemeProvider, CssBaseline } from '@mui/material';
import type { JSX } from 'react';
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
  types: string[]; // Pass in the unique types array
};

export const Chips = ({ handleClick, types }: ChipsProps) => {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Stack
        direction="row"
        spacing={1}
        sx={{
          overflowX: 'auto',
          width: '100%',
          padding: 2,
          pb: 2,
          '&::-webkit-scrollbar': { display: 'none' },
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
                  fontSize: 20,
                })
              ) : (
                <FaLocationArrow style={{ color: 'white' }} />
              )
            } // fallback icon
            clickable
            variant="filled"
            sx={{
              backgroundColor: theme.palette.primary.main,
              color: 'white',
              boxShadow: '0 2px 4px rgba(0,0,0,0.3)', // 🌟 shadow added
              transition: 'transform 0.2s ease',
              '&:hover, &:active': {
                transform: 'translateY(-2px)',
                backgroundColor: theme.palette.secondary.main,
                opacity: 1,
              },
              '& .MuiChip-icon': { color: 'white' }, // ensure icon stays white
            }}
          />
        ))}
      </Stack>
    </ThemeProvider>
  );
};
