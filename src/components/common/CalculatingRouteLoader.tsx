// CalculatingRouteIndicatorModernNonBlocking.tsx
import React from 'react';
import { Box, Paper, Typography, IconButton, CircularProgress } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { keyframes } from '@mui/material/styles';

export type CalculatingRouteIndicatorProps = {
  isVisible: boolean;
  title?: string;
  subtitle?: string;
  onCancel?: () => void;
};

const fadeIn = keyframes`
  from {
    opacity: 0;
    transform: scale(0.98);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
`;

const shimmer = keyframes`
  0% {
    background-position: -200% center;
  }
  100% {
    background-position: 200% center;
  }
`;

export default function CalculatingRouteIndicatorModernNonBlocking({
  isVisible,
  title = 'Calculating route',
  subtitle = 'Finding the best path for you…',
  onCancel,
}: CalculatingRouteIndicatorProps) {
 if (!isVisible) return null;

  return (
    <>
      {/* Backdrop overlay with blur */}
      <Box
        sx={{
          position: 'fixed',
          inset: 0,
          zIndex: 1400,
          backgroundColor: 'rgba(0, 0, 0, 0.4)',
          animation: `${fadeIn} 0.2s ease-out`,
          pointerEvents: onCancel ? 'auto' : 'none',
          backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)',
          transform: 'translateZ(0)',
          willChange: 'opacity, transform',
        }}
        onClick={onCancel}
      />

      {/* Full-viewport flex container to center the loader reliably */}
      <Box
        aria-live="polite"
        sx={{
          position: 'fixed',
          inset: 0, // top:0; left:0; right:0; bottom:0
          zIndex: 1401,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          pointerEvents: 'none', // keep non-blocking unless buttons exist
          animation: `${fadeIn} 0.28s ease-out`,
          // avoid relying on transforms of ancestors
          transform: 'translateZ(0)',
          willChange: 'opacity, transform',
        }}
      >
        <Paper
          elevation={0}
          sx={{
            position: 'relative',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 2.5,
            minWidth: 320,
            maxWidth: 400,
            padding: '32px 40px',
            borderRadius: '24px',
            background: (theme) =>
              theme.palette.mode === 'light'
                ? 'linear-gradient(145deg, rgba(255,255,255,0.95) 0%, rgba(255,255,255,0.85) 100%)'
                : 'linear-gradient(145deg, rgba(30,30,35,0.95) 0%, rgba(20,20,25,0.85) 100%)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            border: (theme) =>
              theme.palette.mode === 'light'
                ? '1px solid rgba(255,255,255,0.8)'
                : '1px solid rgba(255,255,255,0.1)',
            boxShadow: (theme) =>
              theme.palette.mode === 'light'
                ? '0 20px 60px rgba(0,0,0,0.15), 0 0 1px rgba(0,0,0,0.05), inset 0 1px 0 rgba(255,255,255,0.8)'
                : '0 20px 60px rgba(0,0,0,0.5), 0 0 1px rgba(255,255,255,0.1), inset 0 1px 0 rgba(255,255,255,0.1)',
            overflow: 'hidden',
            // animated top shimmer line
            '&::before': {
              content: '""',
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: '2px',
              background: (theme) =>
                `linear-gradient(90deg, 
                  transparent, 
                  ${theme.palette.primary.main}40, 
                  ${theme.palette.primary.main}, 
                  ${theme.palette.primary.main}40, 
                  transparent)`,
              backgroundSize: '200% 100%',
              animation: `${shimmer} 2s linear infinite`,
            },
            // ensure animation is smooth and doesn't cause layout jumps
            transformOrigin: 'center center',
            willChange: 'transform, opacity',
            // treat pointer events for internal interactive elements only
            pointerEvents: 'auto',
          }}
          role="status"
          aria-label={`${title}: ${subtitle}`}
        >
          {/* Close button */}
          {onCancel && (
            <IconButton
              size="small"
              aria-label="cancel calculation"
              onClick={(e) => {
                e.stopPropagation();
                onCancel();
              }}
              sx={{
                position: 'absolute',
                top: 12,
                right: 12,
                pointerEvents: 'auto',
                backgroundColor: (theme) =>
                  theme.palette.mode === 'light' ? 'rgba(0,0,0,0.04)' : 'rgba(255,255,255,0.08)',
                '&:hover': {
                  backgroundColor: (theme) =>
                    theme.palette.mode === 'light' ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.12)',
                },
                transition: 'all 0.2s',
              }}
            >
              <CloseIcon fontSize="small" />
            </IconButton>
          )}

          {/* Spinner with glowing effect */}
          <Box
            sx={{
              position: 'relative',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {/* Glow effect */}
            <Box
              sx={{
                position: 'absolute',
                width: 80,
                height: 80,
                borderRadius: '50%',
                background: (theme) =>
                  `radial-gradient(circle, ${theme.palette.primary.main}20 0%, transparent 70%)`,
                animation: 'pulse 2s ease-in-out infinite',
                '@keyframes pulse': {
                  '0%, 100%': {
                    opacity: 0.6,
                    transform: 'scale(1)',
                  },
                  '50%': {
                    opacity: 1,
                    transform: 'scale(1.1)',
                  },
                },
              }}
            />

            <CircularProgress
              size={56}
              thickness={3.5}
              sx={{
                color: (theme) => theme.palette.primary.main,
                filter: 'drop-shadow(0 0 8px currentColor)',
              }}
            />
          </Box>

          {/* Text content */}
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 0.5,
              textAlign: 'center',
            }}
          >
            <Typography
              variant="h6"
              sx={{
                fontWeight: 700,
                background: (theme) =>
                  theme.palette.mode === 'light'
                    ? 'linear-gradient(135deg, #1a1a1a 0%, #4a4a4a 100%)'
                    : 'linear-gradient(135deg, #ffffff 0%, #b0b0b0 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}
            >
              {title}
            </Typography>

            <Typography
              variant="body2"
              sx={{
                color: (theme) =>
                  theme.palette.mode === 'light' ? 'rgba(0,0,0,0.6)' : 'rgba(255,255,255,0.6)',
                fontWeight: 500,
              }}
            >
              {subtitle}
            </Typography>
          </Box>

          {/* Loading dots animation */}
          <Box
            sx={{
              display: 'flex',
              gap: 0.75,
              alignItems: 'center',
            }}
          >
            {[0, 1, 2].map((i) => (
              <Box
                key={i}
                sx={{
                  width: 6,
                  height: 6,
                  borderRadius: '50%',
                  backgroundColor: (theme) => theme.palette.primary.main,
                  opacity: 0.4,
                  animation: 'bounce-loader 1.4s ease-in-out infinite',
                  animationDelay: `${i * 0.16}s`,
                  '@keyframes bounce-loader': {
                    '0%, 80%, 100%': {
                      opacity: 0.4,
                      transform: 'scale(0.8)',
                    },
                    '40%': {
                      opacity: 1,
                      transform: 'scale(1.2)',
                    },
                  },
                }}
              />
            ))}
          </Box>
        </Paper>
      </Box>
    </>
  );
}
