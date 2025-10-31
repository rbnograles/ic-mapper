import { PaletteMode } from '@mui/material';
export const baseTypography = {
  fontFamily: 'Poppins, Roboto, Helvetica, Arial, sans-serif',
  // add more shared typography here if desired
};

export const lightPalette = {
  mode: 'light' as PaletteMode,
  background: {
    default: '#efedf5',
    paper: '#ffffff',
  },
  primary: {
    main: '#7B48FF',
    contrastText: '#ffffff',
  },
  secondary: {
    main: '#371a55',
    contrastText: '#ffffff',
  },
  tertiary: {
    main: '#F02430',
    contrastText: '#ffffff',
  },
  neutral: {
    main: '#64748B',
    contrastText: '#ffffff',
  },
  text: {
    primary: '#0d0d0d',
    secondary: '#555555',
  },
  divider: 'rgba(0,0,0,0.08)',
  action: {
    hover: 'rgba(0,0,0,0.04)',
    selected: 'rgba(0,0,0,0.06)',
  },
  activeNode: {
    default: 'FFC107',
    highilight: '#4CAF50',
  },
};

export const darkPalette = {
  mode: 'dark' as PaletteMode,
  background: {
    default: '#172542',
    paper: '#000D2A',
  },
  primary: {
    main: '#7B48FF',
    contrastText: '#ffffff',
  },
  secondary: {
    main: '#B39DDB',
    contrastText: '#0b1020',
  },
  tertiary: {
    main: '#F02430',
    contrastText: '#ffffff',
  },
  neutral: {
    main: '#94A3B8',
    contrastText: '#0b1020',
  },
  text: {
    primary: '#ffffff',
    secondary: '#cfd8dc',
  },
  divider: 'rgba(255,255,255,0.08)',
  action: {
    hover: 'rgba(255,255,255,0.06)',
    selected: 'rgba(255,255,255,0.08)',
  },
};
