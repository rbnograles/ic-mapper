import { IconButton, Tooltip } from '@mui/material';
import Brightness4Icon from '@mui/icons-material/Brightness4';
import Brightness7Icon from '@mui/icons-material/Brightness7';
import { useTheme } from '@mui/material/styles';
import { useThemeMode } from '@/app/providers/ThemeProvider';

export default function ThemeToggleButton() {
  const theme = useTheme();
  const { mode, toggleColorMode } = useThemeMode();

  return (
    <Tooltip title={`Switch to ${mode === 'light' ? 'dark' : 'light'} mode`}>
      <IconButton
        onClick={toggleColorMode}
        size="small"
        sx={{
          bgcolor: 'transparent',
          '&:hover': { bgcolor: 'action.hover' },
        }}
        color="inherit"
        aria-label="toggle color mode"
      >
        {theme.palette.mode === 'dark' ? <Brightness7Icon /> : <Brightness4Icon />}
      </IconButton>
    </Tooltip>
  );
}
