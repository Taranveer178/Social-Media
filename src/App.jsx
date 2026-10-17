import { AuthProvider } from './contexts/AuthProvider';
import { useAuth } from './contexts/useAuth';
import { DataProvider } from './contexts/DataProvider';
import { RouterProvider } from './contexts/RouterProvider';
import { ThemeProvider } from './contexts/ThemeProvider';
import { MainAppLayout } from './components/layout/MainAppLayout';
import { AuthView } from './views/AuthView';

function SessionGate() {
  const { user, isLoading, authError } = useAuth();

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 text-violet-600 dark:bg-slate-900" role="status">
        <span className="animate-spin"><span className="sr-only">Loading session...</span>◌</span>
      </div>
    );
  }

  return user ? <DataProvider><MainAppLayout /></DataProvider> : <AuthView initialError={authError} />;
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <RouterProvider>
          <SessionGate />
        </RouterProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
