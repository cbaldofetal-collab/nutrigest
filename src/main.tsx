import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'sonner';
import App from './App.tsx';
import './index.css';

// Safe token refresh setup with error handling - delay to prevent blocking app startup
setTimeout(() => {
  try {
    import('./services/api').then(({ setupTokenRefresh }) => {
      setupTokenRefresh();
      console.log('✅ Token refresh setup completed');
    }).catch(error => {
      console.warn('Failed to setup token refresh:', error);
    });
  } catch (error) {
    console.warn('Failed to setup token refresh:', error);
  }
}, 1000); // Delay by 1 second to allow app to mount first

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 5 * 60 * 1000, // 5 minutos
      gcTime: 10 * 60 * 1000, // 10 minutos
    },
  },
});

// Safe app initialization with error boundary
function initializeApp() {
  try {
    const root = ReactDOM.createRoot(document.getElementById('root')!);
    root.render(
      <React.StrictMode>
        <QueryClientProvider client={queryClient}>
          <BrowserRouter basename="/">
            <App />
            <Toaster
              position="top-right"
              expand={false}
              richColors
              closeButton
              duration={4000}
            />
          </BrowserRouter>
        </QueryClientProvider>
      </React.StrictMode>
    );
    console.log('✅ React app initialized successfully');
  } catch (error) {
    console.error('❌ Failed to initialize React app:', error);
    // Show a simple error message
    document.getElementById('root')!.innerHTML = `
      <div style="padding: 20px; font-family: Arial, sans-serif;">
        <h1 style="color: red;">Erro ao carregar aplicação</h1>
        <p>Por favor, recarregue a página ou tente novamente mais tarde.</p>
        <details>
          <summary>Detalhes do erro</summary>
          <pre style="background: #f5f5f5; padding: 10px; overflow: auto;">${error}</pre>
        </details>
      </div>
    `;
  }
}

// Initialize the app
initializeApp();
