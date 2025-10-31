// ThemeProvider.tsx
import React, { createContext, useContext, useMemo, useState, useEffect, ReactNode } from "react";
import { ThemeProvider, createTheme, CssBaseline, PaletteMode } from "@mui/material";
import {
  baseTypography,
  darkPalette,
  lightPalette,
  defaultMapColorsLight,
  defaultMapColorsDark,
} from "./theme";

type ColorMode = "light" | "dark";

interface ThemeModeContextValue {
  mode: ColorMode;
  toggleColorMode: () => void;
  // runtime map color mutators
  setMapColor: (key: string, color: string) => void;
  clearMapOverride: (key: string) => void;
  resetMapOverrides: () => void;
  // expose effective map colors for e.g. UI previews
  effectiveMapColors: Record<string, string>;
}

const ThemeModeContext = createContext<ThemeModeContextValue | undefined>(undefined);

export const useThemeMode = () => {
  const ctx = useContext(ThemeModeContext);
  if (!ctx) throw new Error("useThemeMode must be used inside CustomThemeProvider");
  return ctx;
};

const MAP_OVERRIDES_LS_KEY = "mapColorOverrides_v1";
const THEME_MODE_LS_KEY = "themeMode_v1";

export const CustomThemeProvider = ({ children }: { children: ReactNode }) => {
  const [mode, setMode] = useState<ColorMode>("light");

  // user overrides persisted (only overrides are stored)
  const [overrides, setOverrides] = useState<Record<string, string>>({});

  // load persisted mode and overrides on mount
  useEffect(() => {
    const savedMode = localStorage.getItem(THEME_MODE_LS_KEY) as ColorMode | null;
    if (savedMode === "light" || savedMode === "dark") setMode(savedMode);
    else {
      const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      setMode(prefersDark ? "dark" : "light");
    }

    try {
      const raw = localStorage.getItem(MAP_OVERRIDES_LS_KEY);
      if (raw) setOverrides(JSON.parse(raw));
    } catch {
      setOverrides({});
    }
  }, []);

  // persist overrides whenever they change
  useEffect(() => {
    try {
      localStorage.setItem(MAP_OVERRIDES_LS_KEY, JSON.stringify(overrides));
    } catch {
      // ignore localStorage failures
    }
  }, [overrides]);

  const toggleColorMode = () => {
    setMode((prev) => {
      const next = prev === "light" ? "dark" : "light";
      localStorage.setItem(THEME_MODE_LS_KEY, next);
      return next;
    });
  };

  const setMapColor = (key: string, color: string) => {
    setOverrides((prev) => ({ ...prev, [key]: color }));
  };

  const clearMapOverride = (key: string) => {
    setOverrides((prev) => {
      const { [key]: _removed, ...rest } = prev;
      return rest;
    });
  };

  const resetMapOverrides = () => setOverrides({});

  // choose defaults depending on mode
  const defaultsForMode = mode === "light" ? defaultMapColorsLight : defaultMapColorsDark;

  // merged effective colors: mode defaults + user overrides
  const effectiveMapColors = useMemo(
    () => ({ ...defaultsForMode, ...overrides }),
    [defaultsForMode, overrides]
  );

  const createAppTheme = (mode: PaletteMode, maps: Record<string, string>) =>
    createTheme({
      palette: mode === "light" ? { ...lightPalette, maps } : { ...darkPalette, maps },
      typography: baseTypography,
      components: {
        MuiCssBaseline: {
          styleOverrides: {
            body: {
              WebkitFontSmoothing: "antialiased",
              MozOsxFontSmoothing: "grayscale",
              transition: "background-color 250ms ease, color 250ms ease",
            },
          },
        },
      },
    });

  const theme = useMemo(() => createAppTheme(mode, effectiveMapColors), [mode, effectiveMapColors]);

  return (
    <ThemeModeContext.Provider
      value={{
        mode,
        toggleColorMode,
        setMapColor,
        clearMapOverride,
        resetMapOverrides,
        effectiveMapColors,
      }}
    >
      <ThemeProvider theme={theme} key={mode}>
        <CssBaseline />
        {children}
      </ThemeProvider>
    </ThemeModeContext.Provider>
  );
};
