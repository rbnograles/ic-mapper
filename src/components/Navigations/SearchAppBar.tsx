import {
  AppBar,
  Box,
  Toolbar,
  IconButton,
  Stack,
  Chip,
  TextField,
  Autocomplete,
} from '@mui/material';
import { styled } from '@mui/material/styles';
import MenuIcon from '@mui/icons-material/Menu';
import SearchIcon from '@mui/icons-material/Search';
import FlatwareIcon from '@mui/icons-material/Flatware';
import StorefrontIcon from '@mui/icons-material/Storefront';
import WcIcon from '@mui/icons-material/Wc';
import RoomServiceIcon from '@mui/icons-material/RoomService';
import ElevatorIcon from '@mui/icons-material/Elevator';
import EscalatorIcon from '@mui/icons-material/Escalator';
import DoorFront from '@mui/icons-material/DoorFront';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';

const Search = styled('div')(({ theme }) => ({
  position: 'relative',
  borderRadius: 10,
  backgroundColor: theme.palette.common.white,
  boxShadow: '0 2px 6px rgba(0,0,0,0.2)',
  marginLeft: theme.spacing(2),
  flex: 1,
  display: 'flex',
  alignItems: 'center',
}));

const SearchIconWrapper = styled('div')(({ theme }) => ({
  padding: theme.spacing(0, 2),
  display: 'flex',
  alignItems: 'center',
  color: '#5f6368',
}));

// Optional: reuse for consistent padding/font
const StyledTextField = styled(TextField)(({ theme }) => ({
  flex: 1,
  '& .MuiOutlinedInput-root': {
    paddingRight: theme.spacing(1),
    '& fieldset': { border: 'none' }, // remove outline for cleaner look
    '& input': {
      padding: theme.spacing(1.2, 0, 1.2, 0),
      fontSize: 16,
      color: '#202124',
    },
  },
}));

export default function SearchAppBar({
  options,
  onSelect,
}: {
  options: any[];
  onSelect: (item: any) => void;
}) {
  const handleClick = () => console.info('Chip clicked');

  return (
    <Box sx={{ flexGrow: 1 }}>
      <AppBar
        position="fixed"
        elevation={0}
        sx={{
          backgroundColor: 'transparent',
          boxShadow: 'none',
          paddingTop: 1.5,
        }}
      >
        <Toolbar sx={{ justifyContent: 'space-between', paddingX: 3, marginBottom: 2 }}>
          <IconButton
            size="large"
            edge="start"
            color="default"
            aria-label="menu"
            sx={{ mr: 2, bgcolor: 'white', boxShadow: 1, borderRadius: 2 }}
          >
            <MenuIcon />
          </IconButton>

          {/* Search box with Autocomplete */}
          <Search>
            <SearchIconWrapper>
              <SearchIcon />
            </SearchIconWrapper>
            <Autocomplete
              freeSolo
             
              options={options}
              getOptionLabel={(opt) => opt.name}
              onChange={(_, value) => onSelect(value)}
              sx={{ flex: 1 }}
              renderInput={(params) => (
                <StyledTextField
                  {...params}
                  style={{ padding:10}}
                  placeholder="Search for a place"
                  variant="standard"
                />
              )}
            />
          </Search>
        </Toolbar>

        {/* Chips Section */}
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
      </AppBar>
    </Box>
  );
}
