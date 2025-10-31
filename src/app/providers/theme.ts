import { PaletteMode } from '@mui/material';

export const baseTypography = {
  fontFamily: 'Poppins, Roboto, Helvetica, Arial, sans-serif',
  // add more shared typography here if desired
};

export const defaultMapColorsLight = {
  white: "white",
  pathWhite: 'white',
  pathCartWhite: 'white',
  whiteInner: 'white',
  '#D9D9D9': "#D9D9D9",
  'E3DAD0': '#E3DAD0',
  'black': 'black',
  '#121212': '#121212'
} as const;

export const defaultMapColorsDark = {
  // choose colors that read well on dark backgrounds
  white: "#18243E",
  pathWhite: '#263660',
  pathCartWhite: 'yellow',
  '#E3DAD0': '#13283C',
  'black': 'white',
  '#121212': 'white',
  '#FF0000': 'white',
  whiteInner: '#26303F',
} as const;

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
    default: '#26303F',
    paper: '#0F1112',
  },
  primary: {
    main: '#7B48FF',
    contrastText: '#ffffff',
  },
  secondary: {
    main: '#0F1112',
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
