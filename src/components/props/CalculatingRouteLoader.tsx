// components/CalculatingRouteIndicator.tsx
import React from 'react';
import { Box, CircularProgress, Typography } from '@mui/material';
import { useTheme } from '@mui/material/styles';

interface CalculatingRouteIndicatorProps {
  isVisible: boolean;
  title?: string;
  subtitle?: string;
  zIndex?: number;
}

export const CalculatingRouteIndicator: React.FC<CalculatingRouteIndicatorProps> = ({
  isVisible,
  title = 'Calculating Route',
  subtitle = 'Finding the best path...',
  zIndex = 1500,
}) => {
  const theme = useTheme();

  if (!isVisible) return null;

  return (
    <Box
      sx={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        backgroundColor: 'rgba(255, 255, 255, 0.98)',
        backdropFilter: 'blur(12px)',
        color: theme.palette.primary.main,
        padding: '24px 40px',
        borderRadius: '25px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 2.5,
        zIndex,
        boxShadow: '0 12px 48px rgba(25, 118, 210, 0.15), 0 0 0 1px rgba(25, 118, 210, 0.1)',
        minWidth: '240px',
        animation: 'fadeInScale 0.3s ease-out',
        '@keyframes fadeInScale': {
          from: {
            opacity: 0,
            transform: 'translate(-50%, -50%) scale(0.9)',
          },
          to: {
            opacity: 1,
            transform: 'translate(-50%, -50%) scale(1)',
          },
        },
      }}
    >
      {/* Pulse effect container */}
      <Box
        sx={{
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {/* Background pulse circles */}
        <Box
          sx={{
            position: 'absolute',
            width: '50px',
            height: '50px',
            borderRadius: '50%',
            backgroundColor: theme.palette.primary.main,
            opacity: 0.1,
            animation: 'pulse 2s ease-in-out infinite',
            '@keyframes pulse': {
              '0%, 100%': {
                transform: 'scale(1)',
                opacity: 0.1,
              },
              '50%': {
                transform: 'scale(1.2)',
                opacity: 0.05,
              },
            },
          }}
        />
        <Box
          sx={{
            position: 'absolute',
            width: '40px',
            height: '40px',
            borderRadius: '50%',
            backgroundColor: theme.palette.primary.main,
            opacity: 0.15,
            animation: 'pulse 2s ease-in-out infinite 0.5s',
          }}
        />

        {/* Spinner */}
        <CircularProgress
          size={33}
          thickness={4}
          sx={{
            color: theme.palette.primary.main,
            position: 'relative',
            zIndex: 1,
          }}
        />
      </Box>

      {/* Text content */}
      <Box sx={{ textAlign: 'center' }}>
        <Typography
          variant="h6"
          sx={{
            fontWeight: 700,
            color: theme.palette.text.primary,
            letterSpacing: '0.3px',
            marginBottom: 0.5,
          }}
        >
          {title}
        </Typography>
        <Typography
          variant="body2"
          sx={{
            color: theme.palette.text.secondary,
            fontSize: '0.875rem',
          }}
        >
          {subtitle}
        </Typography>
      </Box>
    </Box>
  );
};

export default CalculatingRouteIndicator;
