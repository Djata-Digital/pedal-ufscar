import { Toaster } from 'sonner';

import { AuthProvider } from './contexts/AuthContext';
import { AppRoutes } from './routes/AppRoutes';

export default function App() {
  return (
    <AuthProvider>
      <AppRoutes />

      <Toaster
        position="top-right"
        richColors
        closeButton
      />
    </AuthProvider>
  );
}