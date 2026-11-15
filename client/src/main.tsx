import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import App from './App';
import { AuthProvider } from './hooks/useAuth';
import { LocationProvider } from './hooks/useLocation';
import '@tabler/icons-webfont/dist/tabler-icons.min.css';
import './index.css';

// Create a client with optimized defaults for session-based caching
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: Infinity, // Data never goes stale during app session
      gcTime: Infinity, // Cache persists forever (until app closes)
      retry: 1, // Only retry once to avoid hammering free tier server
      refetchOnWindowFocus: false, // Don't refetch when window regains focus
      refetchOnReconnect: true, // Refetch on reconnect (network came back)
      refetchOnMount: false, // Don't refetch when component mounts if data exists
    },
  },
});

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <AuthProvider>
          <LocationProvider>
            <App />
          </LocationProvider>
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  </React.StrictMode>,
);