import { useEffect, useState } from 'react';
import { Box, Typography, List, ListItem, ListItemText, Divider } from '@mui/material';
import { History } from '@mui/icons-material';
import theme from '@/styles/theme';

interface Place {
  id: string;
  name: string;
  type?: string;
  floor?: string;
  [key: string]: any;
}

export default function CachedResults({
  getLocationFromHistory,
  setDirectionOpen,
}: {
  getLocationFromHistory?: (history: any) => void;
  setDirectionOpen: React.Dispatch<React.SetStateAction<boolean>>;
}) {
  const [allCachedPlaces, setAllCachedPlaces] = useState<Place[]>([]);

  useEffect(() => {
    const allCacheKeys = Object.keys(localStorage).filter(
      (key) => key.startsWith('map-cache-') || key.startsWith('route-cache-')
    );

    const allPlaces: Place[] = [];

    for (const key of allCacheKeys) {
      try {
        const data = JSON.parse(localStorage.getItem(key) || '{}');

        // Map cache: array of maps
        if (Array.isArray(data)) {
          allPlaces.push(...data);
        }
        // Route cache: object with from/to
        else if (data.from && data.to) {
          allPlaces.push({
            id: `route-${data.timestamp || Date.now()}`, // unique ID
            name: `${data.from} → ${data.to}`, // show as "From → To"
            type: 'Route',
            floor: data.floor,
            raw: data, // optional: keep original object
          });
        }
        // Map cache stored as object { key: [maps...] }
        else {
          Object.values(data).forEach((arr: any) => {
            if (Array.isArray(arr)) allPlaces.push(...arr);
          });
        }
      } catch (err) {
        console.error(`Error parsing cache for ${key}:`, err);
      }
    }

    // Remove duplicates by ID
    const unique = allPlaces.reduce<Place[]>((acc, place) => {
      if (!acc.find((p) => p.id === place.id)) acc.push(place);
      return acc;
    }, []);

    setAllCachedPlaces(unique);
  }, []);

  const handleClearAll = () => {
    const keys = Object.keys(localStorage).filter(
      (key) => key.startsWith('map-cache-') || key.startsWith('route-cache-')
    );
    keys.forEach((key) => localStorage.removeItem(key));
    setAllCachedPlaces([]);
  };

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        p: 2,
        pt: 1,
      }}
    >
      {/* Header */}
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          mb: 1,
          flexShrink: 0,
        }}
      >
        <Typography variant="subtitle1" fontWeight={600}>
          Recent Visits
        </Typography>
        {allCachedPlaces.length > 0 && (
          <Typography
            variant="body2"
            color="primary"
            onClick={handleClearAll}
            sx={{
              cursor: 'pointer',
              userSelect: 'none',
              '&:hover': { textDecoration: 'underline' },
            }}
          >
            Clear All
          </Typography>
        )}
      </Box>

      {/* Scrollable list */}
      <Box sx={{ overflowY: 'auto', flexGrow: 1, pr: 1 }}>
        {allCachedPlaces.length === 0 ? (
          <Typography color="text.secondary" sx={{ mt: 1 }}>
            No recent search ...
          </Typography>
        ) : (
          <List disablePadding>
            {allCachedPlaces.map((place) => (
              <Box key={place.id}>
                <ListItem
                  dense
                  disablePadding
                  sx={{
                    py: 1.2,
                    alignItems: 'flex-start',
                    '&:hover': {
                      backgroundColor: 'rgba(0,0,0,0.05)',
                      cursor: 'pointer',
                    },
                  }}
                  onClick={() => {
                    getLocationFromHistory?.(place);
                    setDirectionOpen(false);
                  }} // ✅ Click to locate
                >
                  <History
                    sx={{
                      color: theme.palette.primary.main,
                      fontSize: 22,
                      mr: 1.5,
                      mt: 1.8,
                      flexShrink: 0,
                    }}
                  />
                  <ListItemText
                    primary={
                      <Typography fontWeight={600} sx={{ fontSize: 14 }}>
                        {place.name}
                      </Typography>
                    }
                    secondary={
                      <Typography variant="body2" color="text.secondary" sx={{ fontSize: 13 }}>
                        {place.type
                          ? `${place.type} • Floor: ${place.floor ?? 'N/A'}`
                          : `Floor: ${place.floor ?? 'N/A'}`}
                      </Typography>
                    }
                  />
                </ListItem>
                <Divider />
              </Box>
            ))}
          </List>
        )}
      </Box>
    </Box>
  );
}
