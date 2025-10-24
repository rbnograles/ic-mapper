// components/SearchBar.tsx
import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Box, Autocomplete, CircularProgress, styled, TextField } from '@mui/material';
import theme from '@/styles/theme';
import useDrawerStore from '@/store/DrawerStore';

import SearchIcon from '@mui/icons-material/Search';
import CHIPS_ICONMAP from '@/components/props/ChipsIconMapper';
import VoiceRecorder from '@/components/props/VoiceSearch';
import type { IMapItem } from '@/interface';
import useSearchStore from '@/store/SearchStore';

export interface LazyLoaderProps {
  visiblePlaces: IMapItem[]; // current chunk / visible items
  hasMore: boolean;
  loadMore: () => void; // triggers next chunk
  search: (query: string) => IMapItem[]; // synchronous search returning results
  loading: boolean; // loader state from the hook
  saveToCache: (item: IMapItem) => void; // persist selected item
}

export interface SearchBarProps {
  placeholder?: string;
  value?: IMapItem | string | null;
  onChange?: (val: IMapItem | null) => void;
  lazy: LazyLoaderProps; // pass the hook outputs here
  isMobile?: boolean;
  debounceMs?: number;
}

/* Styled */
const Search = styled('div')(({ theme }) => ({
  position: 'relative',
  borderRadius: 10,
  backgroundColor: theme.palette.common.white,
  boxShadow: '0 2px 6px rgba(0,0,0,0.3)',
  flex: 1,
  display: 'flex',
  alignItems: 'center',
  paddingRight: theme.spacing(1),
  marginBottom: theme.spacing(1),
}));

const SearchIconWrapper = styled('div')(({ theme }) => ({
  padding: theme.spacing(0, 1.2),
  display: 'flex',
  alignItems: 'center',
  color: '#5f6368',
}));

const StyledTextField = styled(TextField)(({ theme }) => ({
  flex: 1,
  '& .MuiOutlinedInput-root': {
    '& fieldset': { border: 'none' },
    '& input': {
      padding: theme.spacing(1, 0, 1, 0),
      fontSize: 16,
    },
  },
}));

const capitalizeWords = (str: string) => str.replace(/\b\w/g, (char) => char.toUpperCase());

export default function SearchBar({
  placeholder = 'Search',
  value = null,
  onChange,
  lazy,
  isMobile = false,
  debounceMs = 300,
}: SearchBarProps) {
  const isDirectionPanelOpen = useDrawerStore((s) => s.isDirectionPanelOpen);

  // destructure lazy loader props
  const {
    visiblePlaces: hookVisible,
    hasMore,
    loadMore,
    search,
    loading: hookLoading,
    saveToCache,
  } = lazy;

  // Use search store
  const storeQuery = useSearchStore((state) => state.query);
  const storeDisplayOptions = useSearchStore((state) => state.displayOptions);

  const setStoreQuery = useSearchStore((state) => state.setQuery);
  const setStoreDisplayOptions = useSearchStore((state) => state.setDisplayOptions);

  // local UI state for spinner only
  const [localLoading, setLocalLoading] = useState<boolean>(false);

  const mounted = useRef(true);
  const debounceTimer = useRef<number | null>(null);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      if (debounceTimer.current) window.clearTimeout(debounceTimer.current);
    };
  }, []);

  // Initialize/Sync store display options when hookVisible changes
  useEffect(() => {
    setStoreDisplayOptions(hookVisible);
  }, [hookVisible]);

  // Debounced search — uses storeQuery and writes results to storeDisplayOptions
  useEffect(() => {
    if (debounceTimer.current) window.clearTimeout(debounceTimer.current);

    if (storeQuery.trim()) setLocalLoading(true);

    debounceTimer.current = window.setTimeout(() => {
      if (!mounted.current) return;

      if (!storeQuery.trim()) {
        // restore visible chunk from hook
        setStoreDisplayOptions(hookVisible);
      } else {
        const results = search(storeQuery);
        setStoreDisplayOptions(results);
      }

      setLocalLoading(false);
    }, debounceMs);

    return () => {
      if (debounceTimer.current) window.clearTimeout(debounceTimer.current);
    };
  }, [storeQuery, hookVisible]);

  // infinite-scroll - calls the parent's loadMore
  const handleLoadMore = useCallback(() => {
    if (!hasMore) return;
    loadMore();
  }, [hasMore, loadMore]);

  const listBoxOnScroll = (e: React.UIEvent<HTMLElement>) => {
    const listbox = e.currentTarget;
    if (hasMore && listbox.scrollTop + listbox.clientHeight >= listbox.scrollHeight - 10) {
      handleLoadMore();
    }
  };

  // Normalize selection: string -> IMapItem (try to find match then fallback to minimal item)
  const normalizeSelection = useCallback(
    (val: string | IMapItem | null): IMapItem | null => {
      if (!val) return null;
      if (typeof val !== 'string') return val as IMapItem;

      const q = val.trim().toLowerCase();
      const found =
        storeDisplayOptions.find((p) => (p.name ?? '').trim().toLowerCase() === q) ||
        hookVisible.find((p) => (p.name ?? '').trim().toLowerCase() === q);

      if (found) return found;
      return { id: val, name: val } as IMapItem;
    },
    [storeDisplayOptions, hookVisible]
  );

  // onChange handler for Autocomplete
  const handleChange = (_event: any, val: string | IMapItem | null) => {
    const normalized = normalizeSelection(val);
    onChange?.(normalized);
    // Also update store pointA/pointB if the selected value matches current UI context.
    // Persist to cache via lazy hook
    if (normalized) {
      saveToCache(normalized);
    }
  };

  const handleInputChange = (_: any, val: string) => {
    setStoreQuery(val);
  };

  const handleFocus = () => {
    setStoreQuery(''); // this will reset the query to prevent shared query issue
    setStoreDisplayOptions(hookVisible);
  };

  return (
    <Search>
      <SearchIconWrapper>
        <SearchIcon />
      </SearchIconWrapper>

      <Autocomplete<IMapItem, false, false, true>
        freeSolo
        blurOnSelect
        value={value ?? null}
        options={storeDisplayOptions}
        loading={localLoading || hookLoading}
        filterOptions={(x) => x}
        getOptionLabel={(opt) =>
          typeof opt === 'string'
            ? opt
            : opt?.name
              ? capitalizeWords(String(opt.name).toLowerCase())
              : ''
        }
        onChange={handleChange}
        onInputChange={handleInputChange}
        onFocus={handleFocus}
        ListboxProps={{
          onScroll: listBoxOnScroll,
          style: { maxHeight: 350, overflow: 'auto', scrollbarGutter: 'stable' as any },
        }}
        sx={{ flex: 1 }}
        // this section is responsible for building list items
        renderOption={(props, option: IMapItem, { index }) => {
            // check if the item is last then show fetching icon
          const isLastItem = index === storeDisplayOptions.length - 1;

          return (
            <li
              {...props}
              key={option.id ?? option.name}
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                flexDirection: 'column',
                padding: '8px 12px',
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                {CHIPS_ICONMAP[option.type]?.({
                  color: theme.palette.primary.main,
                  fontSize: 24,
                  marginRight: 5,
                })}
                <Box>
                  <Box sx={{ fontWeight: 500, fontSize: isMobile ? 12 : 14 }}>
                    {capitalizeWords(String(option.name ?? '').toLowerCase())}
                  </Box>
                  <Box
                    sx={{
                      fontSize: isMobile ? 10 : 11,
                      color: 'text.secondary',
                    }}
                  >
                    {option.floor ?? 'Unknown'}
                  </Box>
                </Box>
              </Box>
              {localLoading && isLastItem ? (
                <Box
                  sx={{
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    width: '100%',
                    mt: 1,
                  }}
                >
                  <CircularProgress color="primary" size={20} />
                </Box>
              ) : null}
            </li>
          );
        }}
        // this section is responsible for rendering the search input
        renderInput={(params) => (
          <StyledTextField
            {...params}
            style={{ padding: 10 }}
            placeholder={isDirectionPanelOpen ? `${placeholder}` : placeholder}
            variant="standard"
          />
        )}
      />

      <VoiceRecorder
        onTranscript={(text: string) => {
          // update store query when voice transcript arrives
          setStoreQuery(text);
        }}
        color={theme.palette.secondary.main}
      />
    </Search>
  );
}
