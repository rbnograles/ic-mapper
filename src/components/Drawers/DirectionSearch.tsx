import {
  Box,
  Drawer,
  Stack,
  IconButton,
  Typography,
  Divider,
  ThemeProvider,
  Paper,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormHelperText,
} from '@mui/material';

import theme from '@/styles/theme';

import { FaLocationDot } from 'react-icons/fa6';
import { RiArrowUpDownLine } from 'react-icons/ri';
import CloseIcon from '@mui/icons-material/Close';
import DirectionsWalkIcon from '@mui/icons-material/DirectionsWalk';
import ElevatorIcon from '@mui/icons-material/Elevator';
import EscalatorWarningIcon from '@mui/icons-material/EscalatorWarning';
// Components
import CachedResults from '@/components/Navigations/CachedResults';
// Intefaces
import { IDirectionSearch } from '@/interface/DrawerInterface';
import SearchBar from '../props/SearchInput';
import { useLazyMapData } from '@/hooks/useLazyMapData';
import useDrawerStore from '@/store/DrawerStore';
import useSearchStore from '@/store/SearchStore';
import { ViaOption } from '@/interface';

interface DirectionProps extends IDirectionSearch {
  setViaMethod?: (m: ViaOption) => void;
  via?: ViaOption;
  floorA: string | null;
  floorB: string | null;
}

const Direction = ({
  isMobile,
  setPointAMethod,
  handlePathSearchBehavior,
  setPointBMethod,
  handleSwapPoints,
  getLocationFromHistory,
  setViaMethod,
  via,
  floorA,
  floorB,
}: DirectionProps) => {
  // Drawer store
  const setIsDirectionPanelOpen = useDrawerStore((state) => state.setIsDirectionPanelOpen);
  const isDirectionPanelOpen = useDrawerStore((state) => state.isDirectionPanelOpen);

  // Search store
  const pointA = useSearchStore((state) => state.pointA);
  const pointB = useSearchStore((state) => state.pointB);

  // Lazy search data
  const { visiblePlaces, hasMore, loadMore, search, loading, saveToCache } = useLazyMapData(
    'all',
    20
  );

  // whether we should show the Via selector:
  const showViaSelector = Boolean(floorA && floorB && floorA !== floorB);

  const handleViaChange = (value: ViaOption) => {
    if (typeof setViaMethod === 'function') setViaMethod(value);
  };

  return (
    <ThemeProvider theme={theme}>
      <Drawer
        anchor="left"
        open={isDirectionPanelOpen}
        onClose={() => setIsDirectionPanelOpen(false)}
        PaperProps={{
          sx: {
            width: isMobile ? '100vw' : 430,
            display: 'flex',
            flexDirection: 'column',
            height: '100dvh',
          },
        }}
      >
        {/* Top search area */}
        <Paper
          elevation={2}
          sx={{
            flexShrink: 0,
            p: 2,
            borderBottom: '1px solid #e0e0e0',
            bgcolor: 'background.paper',
          }}
        >
          {/* Header */}
          <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
            <Stack direction="row" alignItems="center" spacing={1}>
              <DirectionsWalkIcon color="primary" />
              <Typography variant="subtitle1" fontWeight="bold" fontSize={24}>
                Walking
              </Typography>
            </Stack>
            <IconButton onClick={() => setIsDirectionPanelOpen(false)}>
              <CloseIcon />
            </IconButton>
          </Stack>

          <Divider />

          {/* Input Fields */}
          <Stack direction="row" spacing={1.5} alignItems="flex-start" sx={{ pt: 2 }}>
            {/* Timeline icons */}
            <Stack spacing={1.5} alignItems="center" style={{ marginTop: 16 }}>
              <Box sx={{ width: 16, height: 16, border: '2px solid black', borderRadius: '50%' }} />
              <Stack spacing={0.8} alignItems="center">
                {[...Array(3)].map((_, i) => (
                  <Box
                    key={i}
                    sx={{ width: 4, height: 4, bgcolor: 'black', borderRadius: '50%' }}
                  />
                ))}
              </Stack>
              <FaLocationDot style={{ color: '#f44336', fontSize: 20 }} />
            </Stack>

            {/* Search fields + swap button */}
            <Stack spacing={1.5} flex={1}>
              <SearchBar
                placeholder="Choose starting..."
                value={pointA}
                onChange={(val) => {
                  setPointAMethod(val);
                  handlePathSearchBehavior(val, 'A');
                }}
                lazy={{
                  visiblePlaces,
                  hasMore,
                  loadMore,
                  search,
                  loading,
                  saveToCache,
                }}
              />
              <SearchBar
                placeholder="Choose destination..."
                value={pointB}
                onChange={(val) => {
                  setPointBMethod(val);
                  handlePathSearchBehavior(val, 'B');
                }}
                lazy={{
                  visiblePlaces,
                  hasMore,
                  loadMore,
                  search,
                  loading,
                  saveToCache,
                }}
              />

              {/* VIA selector - only shows when floors differ */}
              {showViaSelector && (
                <FormControl fullWidth size="small" sx={{ mt: 0.5 }}>
                  <InputLabel id="via-select-label">Via</InputLabel>
                  <Select
                    labelId="via-select-label"
                    value={via ?? ''}
                    label="Via"
                    onChange={(e) => handleViaChange(e.target.value as ViaOption)}
                    renderValue={(selected) => {
                      if (!selected) return 'Choose route';
                      if (selected === 'Stairs') return 'Stairs';
                      if (selected === 'Elevator') return 'Elevator';
                      if (selected === 'Escalator') return 'Escalator';
                      return String(selected);
                    }}
                  >
                    <MenuItem value="Stairs">
                      <Stack direction="row" alignItems="center" spacing={1}>
                        <DirectionsWalkIcon />
                        <Typography>Stairs</Typography>
                        <FormHelperText sx={{ ml: 1 }}>{`From ${floorA} → ${floorB}`}</FormHelperText>
                      </Stack>
                    </MenuItem>
                    <MenuItem value="Elevator">
                      <Stack direction="row" alignItems="center" spacing={1}>
                        <ElevatorIcon />
                        <Typography>Elevator</Typography>
                      </Stack>
                    </MenuItem>
                    <MenuItem value="Escalator">
                      <Stack direction="row" alignItems="center" spacing={1}>
                        <EscalatorWarningIcon />
                        <Typography>Escalator</Typography>
                      </Stack>
                    </MenuItem>
                  </Select>
                  <FormHelperText>
                    Origin floor: {floorA} — Destination floor: {floorB}
                  </FormHelperText>
                </FormControl>
              )}
            </Stack>

            <IconButton style={{ marginTop: 40 }} onClick={handleSwapPoints}>
              <RiArrowUpDownLine style={{ fontSize: 24, color: theme.palette.primary.main }} />
            </IconButton>
          </Stack>
        </Paper>

        {/* Cached Results (Scrollable area) */}
        <Box
          id="cached-results-container"
          sx={{
            flexGrow: 1,
            overflowY: 'auto',
            bgcolor: 'background.default',
            p: 1.5,
            transition: 'height 0.2s ease',
          }}
        >
          <CachedResults
            getLocationFromHistory={getLocationFromHistory}
            setDirectionOpen={setIsDirectionPanelOpen}
          />
        </Box>
      </Drawer>
    </ThemeProvider>
  );
};

export default Direction;