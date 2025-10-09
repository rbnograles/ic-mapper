import { createTheme } from '@mui/material/styles';

const theme = createTheme({
  typography: {
    fontFamily: 'Poppins, Roboto, Helvetica, Arial, sans-serif',
  },
  palette: {
    background: {
      default: '#efedf5',
    },
    primary: {
      main: '#7B48FF',
    },
    secondary: {
      main: '#371a55ff',
    },
  },
});

export default theme;
