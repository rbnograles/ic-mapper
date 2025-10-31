import  {
  createContext,
  useContext,
  useMemo,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { ThemeProvider, createTheme, CssBaseline, PaletteMode } from "@mui/material";
import { baseTypography, darkPalette, lightPalette } from "./theme";

type ColorMode = "light" | "dark";

interface ThemeModeContextValue {
  mode: ColorMode;
  toggleColorMode: () => void;
}

const ThemeModeContext = createContext<ThemeModeContextValue>({
  mode: "light",
  toggleColorMode: () => {},
});

export const useThemeMode = () => useContext(ThemeModeContext);

export const CustomThemeProvider = ({ children }: { children: ReactNode }) => {
  // ✅ Initialize after mount to avoid SSR mismatch and allow instant updates
  const [mode, setMode] = useState<ColorMode>("light");

  useEffect(() => {
    const saved = localStorage.getItem("themeMode") as ColorMode | null;
    if (saved === "light" || saved === "dark") {
      setMode(saved);
    } else {
      // Fallback to system preference
      const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      setMode(prefersDark ? "dark" : "light");
    }
  }, []);

  const toggleColorMode = () => {
    setMode((prev) => {
      const next = prev === "light" ? "dark" : "light";
      localStorage.setItem("themeMode", next);
      return next;
    });
  };

  const createAppTheme = (mode: PaletteMode) =>
  createTheme({
    palette: mode === 'light' ? lightPalette : darkPalette,
    typography: baseTypography,
    components: {
      // sensible defaults and small tweaks that look good in both modes
      MuiCssBaseline: {
        styleOverrides: {
          body: {
            WebkitFontSmoothing: 'antialiased',
            MozOsxFontSmoothing: 'grayscale',
            transition: 'background-color 250ms ease, color 250ms ease',
          },
        },
      },
      MuiAppBar: {
        styleOverrides: {
          root: {
            // subtle elevation difference for dark mode
          },
        },
      },
      MuiPaper: {
        styleOverrides: {
          root: {
            // unify rounded corners/padding if you like
            borderRadius: 12,
          },
        },
      },
      // add other component overrides here if needed
    },
  });

// then inside the provider component:
const theme = useMemo(() => createAppTheme(mode), [mode]);

  return (
    <ThemeModeContext.Provider value={{ mode, toggleColorMode }}>
      {/* ✅ Using key={mode} forces ThemeProvider subtree re-render */}
      <ThemeProvider theme={theme} key={mode}>
        <CssBaseline />
        {children}
      </ThemeProvider>
    </ThemeModeContext.Provider>
  );
};
