import { useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { setReturnTo } from '../lib/returnTo';
import { useAuth } from './useAuth';

/**
 * For actions that need an account (check in, publish a session).
 * `goToLogin()` remembers the current page, opens /auth, and AuthPage brings the person back after login,
 * including after the email-verification step.
 */
export function useRequireLogin() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const goToLogin = useCallback(
    (back?: unknown) => {
      // Safe to pass straight to onClick: a click event is not a string, so it is ignored.
      const to = typeof back === 'string' ? back : location.pathname + location.search;
      setReturnTo(to);
      navigate('/auth', { state: { from: to } });
    },
    [location.pathname, location.search, navigate],
  );

  return { user, loading, goToLogin };
}