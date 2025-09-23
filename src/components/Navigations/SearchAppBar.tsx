import { AppBar, Box, Toolbar, TextField, Autocomplete } from '@mui/material';
import { styled } from '@mui/material/styles';
import SearchIcon from '@mui/icons-material/Search';
import Chips from './Chips';
import LocationPinIcon from '@mui/icons-material/LocationPin';

const Search = styled('div')(({ theme }) => ({
  position: 'relative',
  borderRadius: 10,
  backgroundColor: theme.palette.common.white,
  boxShadow: '0 2px 6px rgba(0,0,0,0.2)',
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

const capitalizeWords = (str: string) => str.replace(/\b\w/g, (char) => char.toUpperCase());

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
        <Toolbar sx={{ justifyContent: 'space-between', marginBottom: 2 }}>
          {/* Search box with Autocomplete */}
          <Search>
            <SearchIconWrapper>
              <SearchIcon />
            </SearchIconWrapper>
            <Autocomplete
              freeSolo
              options={options}
              getOptionLabel={(opt) => (opt?.name ? capitalizeWords(opt.name.toLowerCase()) : '')}
              onChange={(_, value) => onSelect(value)}
              sx={{ flex: 1 }}
              renderOption={(props, option) => (
                <li {...props} key={option.id} style={{ display: 'flex', alignItems: 'center' }}>
                  <LocationPinIcon style={{ marginRight: 8, color: '#1976d2' }} />
                  {capitalizeWords(option.name.toLowerCase())}
                </li>
              )}
              renderInput={(params) => (
                <StyledTextField
                  {...params}
                  style={{ padding: 10 }}
                  placeholder="Search for a place"
                  variant="standard"
                />
              )}
            />
          </Search>
        </Toolbar>

        {/* Chips Section */}
        <Chips handleClick={handleClick} />
      </AppBar>
    </Box>
  );
}
