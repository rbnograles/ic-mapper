import React from 'react';
import {
  Box,
  Card,
  CardHeader,
  CardContent,
  IconButton,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Typography,
  Fade,
  ClickAwayListener,
  useTheme,
  InputAdornment,
  TextField,
  Avatar,
  Divider,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import SearchIcon from '@mui/icons-material/Search';
import { HiBuildingOffice2 } from "react-icons/hi2";

export type Floor = {
  key: string;
  name: string;
  location: string;
  // optional thumbnail url or react node
  thumbnail?: string | React.ReactNode;
};

export type FloorCardSelectorProps = {
  open: boolean;
  onClose: () => void;
  floors: Floor[];
  selectedKey?: string | null;
  onSelect: (key: string) => void;
  // optional: place the card as a bottom-sheet on mobile and center on desktop
  mobileBottomSheet?: boolean;
};

export default function FloorCardSelector({
  open,
  onClose,
  floors,
  selectedKey,
  onSelect,
  mobileBottomSheet = true,
}: FloorCardSelectorProps) {
  const theme = useTheme();
  const [query, setQuery] = React.useState('');

  React.useEffect(() => {
    if (!open) setQuery('');
  }, [open]);

  if (!open) return null;

  const filtered = floors.filter((f) =>
    f.name.toLowerCase().includes(query.trim().toLowerCase()) || f.key.toLowerCase().includes(query.trim().toLowerCase())
  );

  return (
    <ClickAwayListener onClickAway={onClose}>
      <Fade in={open} appear>
        <Box
          role="presentation"
          onKeyDown={(e: React.KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
          }}
          sx={{
            position: 'fixed',
            inset: 0,
            zIndex: 1400,
            backgroundColor: 'rgba(6,10,15,0.45)',
            display: 'flex',
            alignItems: { xs: mobileBottomSheet ? 'flex-end' : 'center', sm: 'center' },
            justifyContent: 'center',
            p: { xs: 1.5, sm: 3 },
            backdropFilter: 'blur(6px)',
          }}
        >
          <Card
            elevation={12}
            sx={{
              width: { xs: '100%', sm: 420 },
              maxHeight: { xs: '70vh', sm: '80vh' },
              borderRadius: { xs: mobileBottomSheet ? '14px 14px 0 0' : 3, sm: 3 },
              overflow: 'hidden',
              boxShadow: (t) => `0 10px 30px ${t.palette.mode === 'dark' ? 'rgba(0,0,0,0.6)' : 'rgba(16,24,40,0.12)'}`,
              transformOrigin: 'center',
            }}
          >
            <CardHeader
              title={<Typography variant="h6" sx={{ fontWeight: 700 }}>Select a Floor</Typography>}
              subheader={<Typography variant="caption" color="text.secondary">Tap to switch the map</Typography>}
              sx={{
                px: 2,
                py: 1,
                borderBottom: (t) => `1px solid ${t.palette.divider}`,
                background: (t) => (t.palette.mode === 'light' ? 'transparent' : 'transparent'),
              }}
              action={
                <IconButton size="small" aria-label="close floors" onClick={onClose}>
                  <CloseIcon />
                </IconButton>
              }
            />

            {/* Search */}
            <Box sx={{ px: 2, pt: 1 }}>
              <TextField
                fullWidth
                placeholder="Search floors..."
                size="small"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon fontSize="small" />
                    </InputAdornment>
                  ),
                }}
              />
            </Box>

            <CardContent sx={{ p: 0 }}>
              <List
                dense
                sx={{
                  maxHeight: { xs: 'calc(70vh - 120px)', sm: 'calc(80vh - 120px)' },
                  overflowY: 'auto',
                }}
              >
                {filtered.length === 0 ? (
                  <Box sx={{ p: 3, textAlign: 'center' }}>
                    <Typography color="text.secondary">No floors found</Typography>
                  </Box>
                ) : (
                  filtered.map((floor) => (
                    <React.Fragment key={floor.key}>
                      <ListItem disablePadding>
                        <ListItemButton
                          selected={selectedKey === floor.key}
                          onClick={() => {
                            onSelect(floor.key);
                            onClose();
                          }}
                          sx={{
                            px: 2,
                            py: 1.25,
                            transition: 'transform 150ms ease, box-shadow 150ms ease',
                            '&:hover': { transform: 'translateY(-3px)', boxShadow: (t) => `0 6px 18px ${t.palette.mode === 'dark' ? 'rgba(0,0,0,0.5)' : 'rgba(16,24,40,0.06)'}` },
                          }}
                        >
                          <Avatar
                            sx={{
                              width: 44,
                              height: 44,
                              mr: 2,
                              bgcolor: (t) => t.palette.primary.main,
                              backgroundImage: floor.thumbnail && typeof floor.thumbnail === 'string' ? `url(${floor.thumbnail})` : undefined,
                              backgroundSize: 'cover',
                              backgroundPosition: 'center',
                            }}
                          >
                            {(!floor.thumbnail || typeof floor.thumbnail !== 'string') && (
                              <Typography variant="subtitle2" sx={{ color: '#fff' }}>
                               <HiBuildingOffice2 style={{ fontSize: 18}}/>
                              </Typography>
                            )}
                          </Avatar>

                          <ListItemText
                            primary={
                              <Typography sx={{ fontWeight: 700 }}>{floor.name}</Typography>
                            }
                            secondary={
                              <Typography variant="caption" color="text.secondary">
                                {floor.location}
                              </Typography>
                            }
                          />

                          {/* subtle selected indicator */}
                          {selectedKey === floor.key && (
                            <Box
                              sx={{
                                ml: 1,
                                width: 10,
                                height: 10,
                                borderRadius: '50%',
                                background: `linear-gradient(135deg, ${theme.palette.secondary.main}, ${theme.palette.primary.main})`,
                              }}
                              aria-hidden
                            />
                          )}
                        </ListItemButton>
                      </ListItem>
                      <Divider component="li" />
                    </React.Fragment>
                  ))
                )}
              </List>
            </CardContent>
          </Card>
        </Box>
      </Fade>
    </ClickAwayListener>
  );
}
