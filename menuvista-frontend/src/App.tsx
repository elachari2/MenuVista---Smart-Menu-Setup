import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { UploadPage } from './pages/UploadPage';
import { StatusPage } from './pages/StatusPage';
import { MenuPreviewPage } from './pages/MenuPreviewPage';

// Client React Query avec configuration par défaut
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

/**
 * Composant racine de l'application MenuVista Frontend.
 */
export const App: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<UploadPage />} />
          <Route path="/jobs/:jobId" element={<StatusPage />} />
          <Route path="/menu-preview/:menuId" element={<MenuPreviewPage />} />
          <Route path="/menu-preview" element={<MenuPreviewPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
};

export default App;
