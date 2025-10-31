import '@mui/material/styles';

declare module '@mui/material/styles' {
  interface Palette {
    neutral: Palette['primary'];
    tertiary: Palette['primary'];
  }

  interface Palette {
    maps?: Record<string, string>;
  }
  interface PaletteOptions {
    maps?: Record<string, string>;
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
