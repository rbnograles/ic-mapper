import { useState } from 'react';
import {
  AppBar,
  Box,
  Toolbar,
  TextField,
  Autocomplete,
  useMediaQuery,
  CssBaseline,
  IconButton,
} from '@mui/material';
import { styled, ThemeProvider, useTheme } from '@mui/material/styles';
import SearchIcon from '@mui/icons-material/Search';
import LocationPinIcon from '@mui/icons-material/LocationPin';
import uniqueTypes from '../Data/unique_types.json';
import { FaDirections } from 'react-icons/fa';
import Direction from '../Drawers/Direction';
import Chips from './Chips';
import type { PathItem } from '../../interface/BaseMap';

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
  pathItem: PathItem;
}) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const pathItem: PathItem = {
    name: '',
    id: '',
  };
  const [directionOpen, setDirectionOpen] = useState(false);
  const [pointA, setPointA] = useState<PathItem>(pathItem);
  const [pointB, setPointB] = useState<PathItem>(pathItem);

  const setPointAMethod = (val: any) => {
    setPointA(val);
    if (pointB.name !== '' && val) {
      handleRoute(val.name, pointB.name);
      setDirectionOpen(false);
    }
  };

  const setPointBMethod = (val: any) => {
    setPointB(val);
    if (pointA.name !== '' && val) {
      handleRoute(pointA.name, val.name);
      setDirectionOpen(false);
    }
  };

  // ✅ Swap A and B without overrides
  const handleSwapPoints = () => {
    if (!pointA && !pointB) return;
    const temp = pointA;
    const newA = pointB;
    const newB = temp;

    setPointA(newA);
    setPointB(newB);

    if (newA && newB) {
      handleRoute(newA.name, newB.name);
    }
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
            placeholder={directionOpen ? `${placeholder}` : placeholder}
            variant="standard"
          />
        )}
      />

      {/* ✅ Direction button INSIDE the search bar */}
      {!directionOpen && (
        <IconButton onClick={() => setDirectionOpen(true)} sx={{ ml: 1 }}>
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
        <Direction
          directionOpen={directionOpen}
          setDirectionOpen={setDirectionOpen}
          isMobile={isMobile}
          renderSearchBar={renderSearchBar}
          handlePathSearchBehavior={handlePathSearchBehavior}
          setPointBMethod={setPointBMethod}
          setPointAMethod={setPointAMethod}
          pointA={pointA}
          pointB={pointB}
          handleSwapPoints={handleSwapPoints}
        />
      </Box>
    </ThemeProvider>
  );
}
