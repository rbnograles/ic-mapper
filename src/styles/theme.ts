import { createTheme } from '@mui/material/styles';

const theme = createTheme({
  typography: {
    fontFamily: 'Poppins, Roboto, Helvetica, Arial, sans-serif',
  },
  palette: {
    background: {
      default: '#F5F3F3',
    },
    primary: {
      main: '#283B6A', // you can reuse your existing brand colors
    },
    secondary: {
      main: '#F02430',
    },
  },
});

export default theme;
