import FlatwareIcon from '@mui/icons-material/Flatware';
import StorefrontIcon from '@mui/icons-material/Storefront';
import WcIcon from '@mui/icons-material/Wc';
import RoomServiceIcon from '@mui/icons-material/RoomService';
import ElevatorIcon from '@mui/icons-material/Elevator';
import EscalatorIcon from '@mui/icons-material/Escalator';
import DoorFrontIcon from '@mui/icons-material/DoorFront';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import ParkIcon from '@mui/icons-material/Park';
import { Stack, Chip } from '@mui/material';
import type { JSX } from 'react';

const iconMap: Record<string, JSX.Element> = {
  'Food & Beverage': <FlatwareIcon style={{ color: 'white' }} />,
  Retail: <StorefrontIcon style={{ color: 'white' }} />,
  Restroom: <WcIcon style={{ color: 'white' }} />,
  Services: <AccountBalanceIcon style={{ color: 'white' }} />,
  Concierge: <RoomServiceIcon style={{ color: 'white' }} />,
  Elevator: <ElevatorIcon style={{ color: 'white' }} />,
  Escalator: <EscalatorIcon style={{ color: 'white' }} />,
  'Entrance/Exit': <DoorFrontIcon style={{ color: 'white' }} />,
  Park: <ParkIcon style={{ color: 'white' }} />,
  // Add more types here as needed
};

type ChipsProps = {
  handleClick: (type: string) => void;
  types: string[]; // Pass in the unique types array
};

export default function Chips({ handleClick, types }: ChipsProps) {
  return (
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
          icon={iconMap[type] ?? <StorefrontIcon style={{ color: 'white' }} />} // fallback icon
          clickable
          variant="filled"
          sx={{
            backgroundColor: '#7B48FF',
            color: 'white',
            boxShadow: '0 2px 4px rgba(0,0,0,0.3)', // 🌟 shadow added
            transition: 'transform 0.2s ease',
            '&:hover, &:active': {
              transform: 'translateY(-2px)',
              backgroundColor: '#2d0264ff',
              opacity: 1,
            },
            '& .MuiChip-icon': { color: 'white' }, // ensure icon stays white
          }}
        />
      ))}
    </Stack>
  );
}
