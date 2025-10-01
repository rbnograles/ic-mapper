import { useState } from 'react';
import {
  AppBar,
  Box,
  Toolbar,
  TextField,
  Autocomplete,
  Drawer,
  useMediaQuery,
  CssBaseline,
  Stack,
  IconButton,
  Typography,
  Divider,
} from '@mui/material';
import { styled, ThemeProvider, useTheme } from '@mui/material/styles';
import SearchIcon from '@mui/icons-material/Search';
import LocationPinIcon from '@mui/icons-material/LocationPin';
import Chips from './Chips';
import { FaLocationDot } from 'react-icons/fa6';
import uniqueTypes from '../Data/unique_types.json';
import CloseIcon from '@mui/icons-material/Close';
import DirectionsWalkIcon from '@mui/icons-material/DirectionsWalk';
import { FaDirections } from 'react-icons/fa';

const Search = styled('div')(({ theme }) => ({
  position: 'relative',
  borderRadius: 10,
  backgroundColor: theme.palette.common.white,
  boxShadow: '0 1px 4px rgba(0,0,0,0.3)',
  flex: 1,
  display: 'flex',
  alignItems: 'center',
  paddingRight: theme.spacing(1),
  marginBottom: theme.spacing(1),
}));

const SearchIconWrapper = styled('div')(({ theme }) => ({
  padding: theme.spacing(0, 2),
  display: 'flex',
  alignItems: 'center',
  color: '#5f6368',
}));

const StyledTextField = styled(TextField)(({ theme }) => ({
  flex: 1,
  '& .MuiOutlinedInput-root': {
    '& fieldset': { border: 'none' },
    '& input': {
      padding: theme.spacing(1.2, 0, 1.2, 0),
      fontSize: 16,
    },
  },
}));

const capitalizeWords = (str: string) => str.replace(/\b\w/g, (char) => char.toUpperCase());

export default function SearchAppBar({
  options,
  onSelect,
  handleChipClick,
  handlePathSearchBehavior,
  handleRoute,
}: {
  options: any[];
  onSelect: (item: any, type?: 'A' | 'B') => void;
  handleChipClick: (type: string) => void;
  handlePathSearchBehavior: (item: any, type?: 'A' | 'B') => void;
  handleRoute: (from: string, to: string) => void;
}) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const [directionOpen, setDirectionOpen] = useState(false);
  const [pointA, setPointA] = useState<any>(null);
  const [pointB, setPointB] = useState<any>(null);

  const setPointBMethod = (val: any) => {
    setPointB(val);
    handleRoute(pointA.name, val.name);
    if (pointA) setDirectionOpen(false);
  };

  const renderSearchBar = (placeholder: string, value: any, onChange: (val: any) => void) => (
    <Search
      sx={{
        boxShadow: directionOpen ? 'none' : '0 2px 6px rgba(0,0,0,0.2)',
        border: directionOpen ? '1px solid #ccc' : 'none',
      }}
    >
      <SearchIconWrapper>
        <SearchIcon />
      </SearchIconWrapper>

      <Autocomplete
        freeSolo
        blurOnSelect
        value={value}
        options={options}
        getOptionLabel={(opt) => (opt?.name ? capitalizeWords(opt.name.toLowerCase()) : '')}
        onChange={(_, val) => onChange(val)}
        sx={{ flex: 1 }}
        // ✅ Use slotProps.popper to control dropdown width (no PopperProps needed)
        slotProps={{
          popper: {
            modifiers: [
              {
                name: 'width',
                enabled: true,
                phase: 'beforeWrite',
                requires: ['computeStyles'],
                fn: ({ state }) => {
                  state.styles.popper.width = `${state.rects.reference.width}px`;
                },
              },
            ],
          },
        }}
        renderOption={(props, option) => (
          <li
            {...props}
            key={option.id}
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              flexDirection: 'column',
              padding: '8px 12px',
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
              <LocationPinIcon sx={{ mr: 1, color: theme.palette.secondary.main }} />
              <Box>
                <Box sx={{ fontWeight: 500, fontSize: isMobile ? 14 : 16 }}>
                  {capitalizeWords(option.name.toLowerCase())}
                </Box>
                <Box sx={{ fontSize: isMobile ? 12 : 13, color: 'text.secondary' }}>
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
            placeholder={directionOpen ? `Direction: ${placeholder}` : placeholder}
            variant="standard"
          />
        )}
      />

      {/* ✅ Direction button INSIDE the search bar */}
      {!directionOpen && (
        <IconButton
          onClick={() => setDirectionOpen(true)}
          sx={{
            ml: 1,
          }}
        >
          <FaDirections style={{ fontSize: 28, color: theme.palette.secondary.main }} />
        </IconButton>
      )}
    </Search>
  );

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
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
          <Toolbar
            sx={{
              justifyContent: 'space-between',
              width: isMobile ? '100vw' : '45vw',
              alignItems: 'center',
              gap: 2,
            }}
          >
            {renderSearchBar('Search for a place', pointA, (val) => {
              setPointA(val);
              onSelect(val, 'A');
            })}
          </Toolbar>

          <Chips handleClick={handleChipClick} types={uniqueTypes.types} />
        </AppBar>

        {/* === Drawer for directions === */}
        <Drawer
          anchor="left"
          open={directionOpen}
          onClose={() => setDirectionOpen(false)}
          PaperProps={{
            sx: { width: isMobile ? '100vw' : 400, p: 2 },
          }}
        >
          <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
            <Stack direction="row" alignItems="center" spacing={1}>
              <DirectionsWalkIcon color="primary" />
              <Typography variant="subtitle1" fontWeight="bold" fontSize={24}>
                Walking
              </Typography>
            </Stack>
            <IconButton onClick={() => setDirectionOpen(false)}>
              <CloseIcon />
            </IconButton>
          </Stack>
          <Divider />
          <Stack direction="row" spacing={1.5} alignItems="flex-start" sx={{ pt: 2 }}>
            <Stack spacing={1.5} alignItems="center" style={{ marginTop: 18 }}>
              <Box
                sx={{
                  width: 16,
                  height: 16,
                  border: '2px solid black',
                  borderRadius: '50%',
                }}
              />
              <Stack spacing={0.8} alignItems="center">
                {[...Array(3)].map((_, i) => (
                  <Box
                    key={i}
                    sx={{
                      width: 4,
                      height: 4,
                      bgcolor: 'black',
                      borderRadius: '50%',
                    }}
                  />
                ))}
              </Stack>
              <FaLocationDot style={{ color: '#f44336', fontSize: 20 }} />
            </Stack>

            <Stack spacing={1.5} flex={1}>
              {renderSearchBar('Choose starting point', pointA, (val) => {
                setPointA(val);
                handlePathSearchBehavior(val, 'A');
              })}
              {renderSearchBar('Choose destination', pointB, (val) => {
                setPointBMethod(val);
                handlePathSearchBehavior(val, 'B');
              })}
            </Stack>
          </Stack>
        </Drawer>
      </Box>
    </ThemeProvider>
  );
}
