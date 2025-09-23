
import FlatwareIcon from '@mui/icons-material/Flatware';
import StorefrontIcon from '@mui/icons-material/Storefront';
import WcIcon from '@mui/icons-material/Wc';
import RoomServiceIcon from '@mui/icons-material/RoomService';
import ElevatorIcon from '@mui/icons-material/Elevator';
import EscalatorIcon from '@mui/icons-material/Escalator';
import DoorFront from '@mui/icons-material/DoorFront';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import { Stack, Chip } from '@mui/material';

function Chips({ handleClick }: { handleClick: () => void }) {
  return (
   <Stack
          direction="row"
          spacing={1}
          sx={{
            overflowX: 'auto',
            width: '100%',
            paddingX: 2,
            pb: 1,
            '&::-webkit-scrollbar': { display: 'none' },
          }}
        >
          <Chip
            label="Restaurants"
            onClick={handleClick}
            icon={<FlatwareIcon style={{ color: 'white' }} />}
            clickable
            style={{ backgroundColor: '#8E99C7', color: 'white' }}
          />
          <Chip
            label="Shops"
            onClick={handleClick}
            icon={<StorefrontIcon style={{ color: 'white' }} />}
            clickable
            style={{ backgroundColor: '#8E99C7', color: 'white' }}
          />
          <Chip
            label="Restrooms"
            onClick={handleClick}
            icon={<WcIcon style={{ color: 'white' }} />}
            clickable
            style={{ backgroundColor: '#8E99C7', color: 'white' }}
          />
          <Chip
            label="Concierge"
            onClick={handleClick}
            icon={<RoomServiceIcon style={{ color: 'white' }} />}
            clickable
            style={{ backgroundColor: '#8E99C7', color: 'white' }}
          />
          <Chip
            label="Elevator"
            onClick={handleClick}
            icon={<ElevatorIcon style={{ color: 'white' }} />}
            clickable
            style={{ backgroundColor: '#8E99C7', color: 'white' }}
          />
          <Chip
            label="Escalator"
            onClick={handleClick}
            icon={<EscalatorIcon style={{ color: 'white' }} />}
            clickable
            style={{ backgroundColor: '#8E99C7', color: 'white' }}
          />
          <Chip
            label="Entrance/Exit"
            onClick={handleClick}
            icon={<DoorFront style={{ color: 'white' }} />}
            clickable
            style={{ backgroundColor: '#8E99C7', color: 'white' }}
          />
          <Chip
            label="Services"
            onClick={handleClick}
            icon={<AccountBalanceIcon style={{ color: 'white' }} />}
            clickable
            style={{ backgroundColor: '#8E99C7', color: 'white' }}
          />
        </Stack>
  )
}

export default Chips