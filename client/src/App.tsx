import { lazy, Suspense, useState, useEffect } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { Layout } from './components/Layout';
import { LoginGate } from './components/LoginGate';
import { SplashScreen } from './components/SplashScreen';
import { useAuth } from './hooks/useAuth';
import { setNativeToken } from './api/client';
import { App as CapacitorApp } from '@capacitor/app';
import { Browser } from '@capacitor/browser';
import { Capacitor } from '@capacitor/core';

// Lazy load all page components
const AccountPage = lazy(() => import('./pages/AccountPage').then(m => ({ default: m.AccountPage })));
const AttendPage = lazy(() => import('./pages/AttendPage').then(m => ({ default: m.AttendPage })));
const AuthPage = lazy(() => import('./pages/AuthPage').then(m => ({ default: m.AuthPage })));
const AuthCallbackPage = lazy(() => import('./pages/AuthCallbackPage').then(m => ({ default: m.AuthCallbackPage })));
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

/** Full-page gate for the sheet editor, which has no app layout around it. */
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

/**
 * Gate for pages that only have content for a logged-in person (their sessions, a session they manage, their account).
 * Logged-out visitors still see the app around it, with a "log in" card in place of the page.
 */
function Gated({ children, title, desc, icon }: { children: React.ReactNode; title: string; desc: string; icon?: string }) {
  const { user, loading } = useAuth();
  if (loading) return <p className="py-10 text-center text-sm text-[var(--mut)]">Loading...</p>;
  if (!user) return <LoginGate title={title} desc={desc} icon={icon} />;
  return <>{children}</>;
}

export default function App() {
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    // Hide splash after 2.9 seconds (2.4s visible + 0.5s fade)
    const timer = setTimeout(() => setShowSplash(false), 2900);
    return () => clearTimeout(timer);
  }, []);

  // Handle deep links (Google OAuth callback on mobile): geoattend://auth/callback?token=xxx
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;

    const handlePromise = CapacitorApp.addListener('appUrlOpen', (data) => {
      try {
        const url = new URL(data.url);
        if (url.hostname !== 'auth' || url.pathname !== '/callback') return;

        const token = url.searchParams.get('token');
        if (!token) return;

        // The app is on https://localhost while the API is on another domain, so a cookie would never
        // reach the API. Keep the token in storage; the API client sends it as a Bearer header.
        setNativeToken(token);

        // Close the in-app browser if it is still open (no-op on Android, harmless)
        Browser.close().catch(() => {});

        // Full reload so the auth check runs again with the new token
        window.location.replace('/attend');
      } catch (err) {
        console.error('Invalid deep link:', err);
      }
    });

    return () => {
      handlePromise.then((handle) => handle.remove());
    };
  }, []);

  return (
    <>
      {showSplash && <SplashScreen />}
      <Suspense fallback={<LoadingFallback />}>
        <Routes>
          {/* Public routes - no authentication required */}
          <Route path="/auth" element={<AuthPage />} />
          <Route path="/auth/callback" element={<AuthCallbackPage />} />
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

          {/* App pages: anyone can look around. Only the actions (check in, publish) and personal pages ask for a login. */}
          <Route element={<Layout />}>
            <Route index element={<Navigate to="/attend" replace />} />
            <Route path="/attend" element={<AttendPage />} />
            {/* Open to everyone: the form works, and Publish asks you to log in (your answers are kept). */}
            <Route path="/create" element={<CreatePage />} />
            <Route
              path="/mine"
              element={
                <Gated title="Log in to see your sessions" desc="Sessions you create show up here, with their check-ins." icon="ti-list-details">
                  <MinePage />
                </Gated>
              }
            />
            <Route
              path="/manage/:id"
              element={
                <Gated title="Log in to manage this session" desc="Only the person who created a session can manage it." icon="ti-settings">
                  <ManagePage />
                </Gated>
              }
            />
            <Route
              path="/account"
              element={
                <Gated title="Log in to see your account" desc="Your profile, photo and password live here." icon="ti-user-circle">
                  <AccountPage />
                </Gated>
              }
            />
            <Route path="*" element={<p className="mt-4">Page not found.</p>} />
          </Route>
        </Routes>
      </Suspense>
    </>
  );
}