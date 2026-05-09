import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import App from './App';
import './index.css';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Cache 5 minutes — données affichées instantanément au 2e chargement
      staleTime: 5 * 60 * 1000,
      // Garde en cache 10 minutes même si le composant est démonté
      gcTime: 10 * 60 * 1000,
      // Retry 2 fois en cas d'erreur réseau
      retry: 2,
      retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 8000),
      // Pas de refetch au focus de fenêtre (évite requêtes inutiles)
      refetchOnWindowFocus: false,
    },
  },
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </StrictMode>
);
