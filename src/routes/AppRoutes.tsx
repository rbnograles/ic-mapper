// src/AppRouter.tsx
import { Routes, Route, Navigate } from 'react-router-dom';
import Layout from '@/layouts/layout';
import { IndoorMap } from '@/pages/IndoorMap';
import RouteTracker from '@/pages/ExplorerMap';
import { floors } from '@/pages/IndoorMap/partials/floors';
import { Fragment } from 'react/jsx-runtime';

export default function AppRouter() {
  return (
    <Routes>
      {/* top-level layout that contains the BottomBar */}
      <Route element={<Layout />}>
        {/* pages (the Outlet content) */}
        <Route index path="map" element={<IndoorMap />} />
        <Route path="explore-route" element={<RouteTracker />} />
        <Route path="saved" element={<Fragment>Saved</Fragment>} />
        {/* other pages */}
        <Route path="*" element={<Navigate to={`/map`} replace />} />
      </Route>
    </Routes>
  );
}
