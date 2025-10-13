// src/layouts/Layout.tsx
import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { ThemeProvider, CssBaseline, Drawer, Box } from '@mui/material';
import theme from '@/styles/theme';
import BottomBar from '@/components/Navigations/BottomNavBar';
import { layoutStyles } from '@/styles/layoutStyles';

export default function Layout() {

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box sx={layoutStyles.appRoot}>
        {/* top-level fixed content (AppBar, Search) can go here if you want */}
        {/* main page content (routes render here) */}
        <Box sx={layoutStyles.mapContainer}>
          <Outlet />
        </Box>

        {/* persistent bottom bar (always visible) */}
        <BottomBar
          expanded={false} // wire in real state if you have slider
          handleSliderClose={() => {}}
          pathItem={{ id: '', name: '' }}
        />
      </Box>
    </ThemeProvider>
  );
}
