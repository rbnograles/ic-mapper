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
  TextField,
  InputAdornment,
  Avatar,
  Divider,
  Modal,
  Fade,
  Backdrop,
  useTheme,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import SearchIcon from '@mui/icons-material/Search';

import { HiBuildingOffice2 } from 'react-icons/hi2';
import { IoLocation } from "react-icons/io5";

import useDrawerStore from '@/store/DrawerStore';
import { IFloorCardSelectorProps } from '@/types/DrawerInterface';

export default function FloorSelection({
  floors,
  selectedKey,
  onSelect,
}: IFloorCardSelectorProps) {
  const theme = useTheme();
  const isFloorMapOpen = useDrawerStore((state) => state.isFloorMapOpen);
  const setIsFloorMapOpen = useDrawerStore((state) => state.setIsFloorMapOpen);
  const [query, setQuery] = React.useState('');

  React.useEffect(() => {
    if (!isFloorMapOpen) setQuery('');
  }, [isFloorMapOpen]);

  const filtered = floors.filter(
    (f) =>
      f.name.toLowerCase().includes(query.trim().toLowerCase()) ||
      f.key.toLowerCase().includes(query.trim().toLowerCase())
  );

  return (
    <Modal
      open={isFloorMapOpen}
      onClose={() => setIsFloorMapOpen(false)}
      closeAfterTransition
      slots={{ backdrop: Backdrop }}
      slotProps={{
        backdrop: {
          timeout: 200,
          sx: {
            backgroundColor: 'rgba(6,10,15,0.45)',
            backdropFilter: 'blur(6px)',
          },
        },
      }}
      sx={{ zIndex: (t) => t.zIndex.modal + 200 }} // ensure above other UI
      aria-labelledby="select-floor-title"
    >
      <Fade in={isFloorMapOpen}>
        <Box
          role="presentation"
          onKeyDown={(e: React.KeyboardEvent) => {
            if (e.key === 'Escape') setIsFloorMapOpen(false);
          }}
          sx={{
            position: 'fixed',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            p: { xs: 1.5, sm: 3 },
            pointerEvents: 'auto',
          }}
        >
          <Card
            elevation={12}
            onClick={(e) => e.stopPropagation()} // IMPORTANT: prevent clicks from bubbling to backdrop
            sx={{
              width: { xs: '100%', sm: 420 },
              maxHeight: { sm: '80vh' },
              borderRadius: 3,
              overflow: 'hidden',
              boxShadow: (t) =>
                `0 10px 30px ${t.palette.mode === 'dark' ? 'rgba(0,0,0,0.6)' : 'rgba(16,24,40,0.12)'}`,
              transformOrigin: 'center',
              // ensure the card captures pointer events
              pointerEvents: 'auto',
            }}
          >
            <CardHeader
              title={
                <Typography id="select-floor-title" variant="h6" sx={{ fontWeight: 700 }}>
                  Select a Floor
                </Typography>
              }
              subheader={
                <Typography variant="caption" color="text.secondary">
                  Tap to switch the map
                </Typography>
              }
              sx={{
                px: 2,
                py: 1,
                borderBottom: (t) => `1px solid ${t.palette.divider}`,
                background: (t) => (t.palette.mode === 'light' ? 'transparent' : 'transparent'),
              }}
              action={
                <IconButton
                  size="small"
                  aria-label="close floors"
                  onClick={() => setIsFloorMapOpen(false)}
                >
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
                            setIsFloorMapOpen(false);
                          }}
                          sx={{
                            px: 2,
                            py: 1.25,
                            transition: 'transform 150ms ease, box-shadow 150ms ease',
                            '&:hover': {
                              transform: 'translateY(-3px)',
                              boxShadow: (t) =>
                                `0 6px 18px ${t.palette.mode === 'dark' ? 'rgba(0,0,0,0.5)' : 'rgba(16,24,40,0.06)'}`,
                            },
                          }}
                        >
                          <Avatar
                            sx={{
                              width: 44,
                              height: 44,
                              mr: 2,
                              bgcolor:
                                selectedKey === floor.key ? 'red' : (t) => t.palette.primary.main,
                              backgroundImage:
                                floor.thumbnail && typeof floor.thumbnail === 'string'
                                  ? `url(${floor.thumbnail})`
                                  : undefined,
                              backgroundSize: 'cover',
                              backgroundPosition: 'center',
                            }}
                          >
                            {(!floor.thumbnail || typeof floor.thumbnail !== 'string') && (
                              <Typography variant="subtitle2" sx={{ color: '#fff' }}>
                                {selectedKey === floor.key ? (
                                  <IoLocation style={{ fontSize: 22, marginTop: 5 }} />
                                ) : (
                                  <HiBuildingOffice2 style={{ fontSize: 22, marginTop: 5 }} />
                                )}
                               
                              </Typography>
                            )}
                          </Avatar>

                          <ListItemText
                            primary={<Typography sx={{ fontWeight: 700 }}>{floor.name}</Typography>}
                            secondary={
                              <Typography variant="caption" color="text.secondary">
                                {floor.location}
                              </Typography>
                            }
                          />

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
    </Modal>
  );
}
