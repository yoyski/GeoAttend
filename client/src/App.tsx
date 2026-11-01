import { lazy, Suspense, useState, useEffect } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { Layout } from './components/Layout';
import { SplashScreen } from './components/SplashScreen';
import { useAuth } from './hooks/useAuth';

// Lazy load all page components
const AccountPage = lazy(() => import('./pages/AccountPage').then(m => ({ default: m.AccountPage })));
const AttendPage = lazy(() => import('./pages/AttendPage').then(m => ({ default: m.AttendPage })));
const AuthPage = lazy(() => import('./pages/AuthPage').then(m => ({ default: m.AuthPage })));
const CreatePage = lazy(() => import('./pages/CreatePage').then(m => ({ default: m.CreatePage })));
const ManagePage = lazy(() => import('./pages/ManagePage').then(m => ({ default: m.ManagePage })));
const MinePage = lazy(() => import('./pages/MinePage').then(m => ({ default: m.MinePage })));
const SessionPage = lazy(() => import('./pages/SessionPage').then(m => ({ default: m.SessionPage })));
const SheetPage = lazy(() => import('./pages/SheetPage').then(m => ({ default: m.SheetPage })));

// Loading fallback component
function LoadingFallback() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-[var(--pine)] border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]" role="status">
          <span className="sr-only">Loading...</span>
        </div>
        <p className="mt-3 text-sm text-[var(--mut)]">Loading...</p>
      </div>
    </div>
  );
}

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) {
    return <LoadingFallback />;
  }

  if (!user) {
    return (
      <Suspense fallback={<LoadingFallback />}>
        <AuthPage />
      </Suspense>
    );
  }

  return <>{children}</>;
}

export default function App() {
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    // Hide splash after 2.9 seconds (2.4s visible + 0.5s fade)
    const timer = setTimeout(() => setShowSplash(false), 2900);
    return () => clearTimeout(timer);
  }, []);

  return (
    <>
      {showSplash && <SplashScreen />}
      <Suspense fallback={<LoadingFallback />}>
        <Routes>
          {/* Public routes - no authentication required */}
          <Route path="/auth" element={<AuthPage />} />
          <Route path="/s/:id" element={<SessionPage />} />

          {/* Sheet editor: full-width page with no sidebar or top bar, like the prototype */}
          <Route
            path="/manage/:id/sheet"
            element={
              <ProtectedRoute>
                <SheetPage />
              </ProtectedRoute>
            }
          />
          {/* Attendee sheet view: read-only, full-width */}
          <Route
            path="/s/:id/sheet"
            element={
              <ProtectedRoute>
                <SheetPage />
              </ProtectedRoute>
            }
          />

          <Route
            element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="/attend" replace />} />
            <Route path="/attend" element={<AttendPage />} />
            <Route path="/create" element={<CreatePage />} />
            <Route path="/mine" element={<MinePage />} />
            <Route path="/manage/:id" element={<ManagePage />} />
            <Route path="/account" element={<AccountPage />} />
            <Route path="*" element={<p className="mt-4">Page not found.</p>} />
          </Route>
        </Routes>
      </Suspense>
    </>
  );
}