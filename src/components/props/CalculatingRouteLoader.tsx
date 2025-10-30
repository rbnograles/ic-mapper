// CalculatingRouteIndicatorModernNonBlocking.tsx
import React from 'react';
import { Box, Paper, Typography, IconButton, CircularProgress } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import PauseCircleOutlineIcon from '@mui/icons-material/PauseCircleOutline';

export type CalculatingRouteIndicatorProps = {
  isVisible: boolean;
  title?: string;
  subtitle?: string;
  onCancel?: () => void;
  onAction?: () => void;
  placement?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
};

export default function CalculatingRouteIndicatorModernNonBlocking({
  isVisible,
  title = 'Calculating route',
  subtitle = 'Finding best path…',
  onCancel,
  onAction,
  placement = 'bottom-left',
}: CalculatingRouteIndicatorProps) {
  if (!isVisible) return null;

  const pos: Record<string, React.CSSProperties> = {
    'bottom-right': { right: 16, bottom: 24 },
    'bottom-left': { left: 16, bottom: 24 },
    'top-right': { right: 16, top: 24 },
    'top-left': { left: 16, top: 24 },
  };

  return (
    // Outer wrapper is completely pointer-events: none (cannot block anything)
    <Box
      aria-live="polite"
      sx={{
        position: 'fixed',
        zIndex: 1400,
        pointerEvents: 'none',
        ...pos[placement],
        transition: 'transform 200ms ease, opacity 150ms ease',
      }}
    >
      {/* Paper is visually present but intentionally pointer-events: none so clicks pass through */}
      <Paper
        elevation={6}
        sx={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 1,
          minWidth: 200,
          maxWidth: 340,
          padding: '8px 10px',
          borderRadius: 999,
          boxShadow: '0 6px 20px rgba(16,24,40,0.08)',
          backdropFilter: 'blur(4px)',
          backgroundColor: (theme) =>
            theme.palette.mode === 'light' ? 'rgba(255,255,255,0.85)' : 'rgba(24,24,27,0.7)',
        }}
        role="status"
        aria-label={`${title}: ${subtitle}`}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, paddingLeft: 2 }}>
          <CircularProgress size={28} thickness={4} sx={{ pointerEvents: 'none' }} />
        </Box>

        <Box sx={{ flex: 1, minWidth: 0, paddingRight: 6 }}>
          <Typography noWrap variant="subtitle2" sx={{ fontWeight: 700, lineHeight: 1 }} title={title}>
            {title}
          </Typography>

          <Typography noWrap variant="caption" sx={{ opacity: 0.85 }} title={subtitle}>
            {subtitle}
          </Typography>
        </Box>

        {/* Only the icon buttons are interactive (pointerEvents:auto) */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, position: 'relative', right: 8 }}>
          {onAction && (
            <IconButton
              size="small"
              aria-label="action"
              onClick={(e) => {
                e.stopPropagation();
                onAction();
              }}
              sx={{
                pointerEvents: 'auto',
                backgroundColor: 'transparent',
                '&:hover': { backgroundColor: 'rgba(0,0,0,0.04)' },
              }}
            >
              <PauseCircleOutlineIcon fontSize="small" />
            </IconButton>
          )}

          {onCancel && (
            <IconButton
              size="small"
              aria-label="cancel calculation"
              onClick={(e) => {
                e.stopPropagation();
                onCancel();
              }}
              sx={{
                pointerEvents: 'auto', // <<< only this button can receive clicks
                backgroundColor: 'transparent',
                '&:hover': { backgroundColor: 'rgba(0,0,0,0.04)' },
              }}
            >
              <CloseIcon fontSize="small" />
            </IconButton>
          )}
        </Box>
      </Paper>
    </Box>
  );
}
