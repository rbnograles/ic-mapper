import { type Dispatch, type JSX, type SetStateAction } from 'react';
import {
  Box,
  Drawer,
  Stack,
  IconButton,
  Typography,
  Divider,
  ThemeProvider,
  Paper,
} from '@mui/material';
import { FaLocationDot } from 'react-icons/fa6';
import { RiArrowUpDownLine } from 'react-icons/ri';
import CloseIcon from '@mui/icons-material/Close';
import DirectionsWalkIcon from '@mui/icons-material/DirectionsWalk';
import theme from '../../styles/theme';
import CachedResults from '../Navigations/CachedResults';

const Direction = ({
  directionOpen,
  setDirectionOpen,
  isMobile,
  renderSearchBar,
  setPointAMethod,
  handlePathSearchBehavior,
  setPointBMethod,
  pointA,
  pointB,
  handleSwapPoints,
  getLocationFromHistory,
}: {
  directionOpen: boolean;
  setDirectionOpen: Dispatch<SetStateAction<boolean>>;
  isMobile: boolean;
  renderSearchBar: (placeholder: string, value: any, onChange: (val: any) => void) => JSX.Element;
  setPointAMethod: React.Dispatch<any>;
  handlePathSearchBehavior: (item: any, type?: 'A' | 'B' | undefined) => void;
  setPointBMethod: React.Dispatch<any>;
  pointA: any;
  pointB: any;
  handleSwapPoints: () => void;
  getLocationFromHistory: (history: any) => void;
}) => {
  return (
    <ThemeProvider theme={theme}>
      <Drawer
        anchor="left"
        open={directionOpen}
        onClose={() => setDirectionOpen(false)}
        PaperProps={{
          sx: {
            width: isMobile ? '100vw' : 400,
            display: 'flex',
            flexDirection: 'column',
            height: '100dvh', // ✅ Prevent overlap when keyboard opens
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
            <IconButton onClick={() => setDirectionOpen(false)}>
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
              {renderSearchBar('Choose starting...', pointA, (val: any) => {
                setPointAMethod(val);
                handlePathSearchBehavior(val, 'A');
              })}

              {renderSearchBar('Choose destination...', pointB, (val: any) => {
                setPointBMethod(val);
                handlePathSearchBehavior(val, 'B');
              })}
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
            setDirectionOpen={setDirectionOpen}
          />
        </Box>
      </Drawer>
    </ThemeProvider>
  );
};

export default Direction;
