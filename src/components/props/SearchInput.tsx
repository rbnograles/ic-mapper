import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Box, Autocomplete, CircularProgress, styled, TextField, useTheme } from '@mui/material';
import useDrawerStore from '@/store/DrawerStore';

import SearchIcon from '@mui/icons-material/Search';
import CHIPS_ICONMAP from '@/components/common/ChipsIconMapper';
import VoiceRecorder from '@/components/props/VoiceSearch';
import type { IMapItem } from '@/types';
import useSearchStore from '@/store/SearchStore';

export interface LazyLoaderProps {
  visiblePlaces: IMapItem[];
  hasMore: boolean;
  loadMore: () => void;
  search: (query: string) => IMapItem[];
  loading: boolean;
  saveToCache: (item: IMapItem) => void;
}

export interface SearchInputProps {
  placeholder?: string;
  value?: IMapItem | string | null;
  onChange?: (val: IMapItem | null) => void;
  lazy: LazyLoaderProps;
  isMobile?: boolean;
  debounceMs?: number;
}

/* Styled */
const Search = styled('div')(({ theme }) => ({
  position: 'relative',
  borderRadius: 10,
  backgroundColor: theme.palette.background.paper,
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

export default function SearchInput({
  placeholder = 'Search',
  value = null,
  onChange,
  lazy,
  isMobile = false,
  debounceMs = 300,
}: SearchInputProps) {
  const theme = useTheme();
  
  const isDirectionPanelOpen = useDrawerStore((s) => s.isDirectionPanelOpen);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [open, setOpen] = useState(false);

  const {
    visiblePlaces: hookVisible,
    hasMore,
    loadMore,
    search,
    loading: hookLoading,
    saveToCache,
  } = lazy;

  const storeQuery = useSearchStore((state) => state.query);
  const storeDisplayOptions = useSearchStore((state) => state.displayOptions);

  const setStoreQuery = useSearchStore((state) => state.setQuery);
  const setStoreDisplayOptions = useSearchStore((state) => state.setDisplayOptions);

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

  useEffect(() => {
    setStoreDisplayOptions(hookVisible);
  }, [hookVisible]);

  useEffect(() => {
    if (debounceTimer.current) window.clearTimeout(debounceTimer.current);

    if (storeQuery.trim()) setLocalLoading(true);

    debounceTimer.current = window.setTimeout(() => {
      if (!mounted.current) return;

      if (!storeQuery.trim()) {
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

  const handleChange = (_event: any, val: string | IMapItem | null) => {
    const normalized = normalizeSelection(val);
    
    // CRITICAL: Close dropdown and blur input immediately on iOS
    setOpen(false);
    if (inputRef.current) {
      inputRef.current.blur();
    }
    
    // Force blur on any active element (for iOS keyboard dismissal)
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }

    // On mobile, delay the onChange callback to let keyboard fully dismiss
    const delay = isMobile ? 300 : 0;
    setTimeout(() => {
      onChange?.(normalized);
      if (normalized) {
        saveToCache(normalized);
      }
    }, delay);
  };

  const handleInputChange = (_: any, val: string) => {
    setStoreQuery(val);
  };

  const handleFocus = () => {
    setStoreQuery('');
    setStoreDisplayOptions(hookVisible);
    setOpen(true);
  };

  const handleBlur = () => {
    // Small delay to allow selection to register first
    setTimeout(() => {
      setOpen(false);
    }, 150);
  };

  return (
    <Search>
      <SearchIconWrapper>
        <SearchIcon />
      </SearchIconWrapper>

      <Autocomplete<IMapItem, false, false, true>
        freeSolo
        blurOnSelect
        open={open}
        onOpen={() => setOpen(true)}
        onClose={() => setOpen(false)}
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
        onBlur={handleBlur}
        ListboxProps={{
          onScroll: listBoxOnScroll,
          style: { maxHeight: 350, overflow: 'auto', scrollbarGutter: 'stable' as any },
        }}
        sx={{ flex: 1 }}
        renderOption={(props, option: IMapItem, { index }) => {
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
              {!localLoading && isLastItem ? (
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
        renderInput={(params) => (
          <StyledTextField
            {...params}
            inputRef={inputRef}
            style={{ padding: 10 }}
            placeholder={isDirectionPanelOpen ? `${placeholder}` : placeholder}
            variant="standard"
          />
        )}
      />

      <VoiceRecorder
        onTranscript={(text: string) => {
          setStoreQuery(text);
        }}
        color={theme.palette.secondary.main}
      />
    </Search>
  );
}