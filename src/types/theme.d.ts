import '@mui/material/styles';

declare module '@mui/material/styles' {
  interface Palette {
    neutral: Palette['primary'];
    tertiary: Palette['primary'];
  }

  interface PaletteOptions {
    neutral?: PaletteOptions['primary'];
    tertiary?: PaletteOptions['primary'];
  }
}

declare module '@mui/material/Button' {
  interface ButtonPropsColorOverrides {
    neutral: true;
    tertiary: true;
  }
}
