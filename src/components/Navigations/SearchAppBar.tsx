import { AppBar, Box, Toolbar, TextField, Autocomplete } from '@mui/material';
import { styled } from '@mui/material/styles';
import SearchIcon from '@mui/icons-material/Search';
import Chips from './Chips';
import LocationPinIcon from '@mui/icons-material/LocationPin';
import uniqueTypes from '../Data/unique_types.json';

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
  handleChipClick,
}: {
  options: any[];
  onSelect: (item: any) => void;
  handleChipClick: (type: string) => void;
}) {
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
        <Toolbar sx={{ justifyContent: 'space-between' }}>
          {/* Search box with Autocomplete */}
          <Search>
            <SearchIconWrapper>
              <SearchIcon />
            </SearchIconWrapper>
            <Autocomplete
              freeSolo
              blurOnSelect
              options={options}
              getOptionLabel={(opt) => (opt?.name ? capitalizeWords(opt.name.toLowerCase()) : '')}
              onChange={(_, value) => onSelect(value)}
              sx={{ flex: 1 }}
              renderOption={(props, option) => (
                <li
                  {...props}
                  key={option.id}
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start', // align top so name+type stack nicely
                    flexDirection: 'column',
                    padding: '8px 12px',
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                    <LocationPinIcon sx={{ mr: 1, color: 'red' }} />
                    <Box>
                      <Box sx={{ fontWeight: 500, fontSize: 16 }}>
                        {capitalizeWords(option.name.toLowerCase())}
                      </Box>
                      <Box sx={{ fontSize: 13, color: 'text.secondary' }}>
                        {option.type ?? 'Unknown'}
                      </Box>
                    </Box>
                  </Box>
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
        <Chips handleClick={handleChipClick} types={uniqueTypes.types} />
      </AppBar>
    </Box>
  );
}
