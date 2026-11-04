import { useState, type FormEvent } from 'react';
import { useLocation } from 'react-router-dom';
import { authApi } from '../api/endpoints';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Browser } from '@capacitor/browser';
import { Capacitor } from '@capacitor/core';

const API_URL = import.meta.env.VITE_API_URL || '/api';

// Helper to handle Google OAuth on both web and mobile
const handleGoogleLogin = async () => {
  const isNative = Capacitor.isNativePlatform();
  const googleUrl = `${API_URL}/auth/google${isNative ? '?mobile=true' : ''}`;

  if (isNative) {
    // On mobile, use Capacitor Browser to open OAuth in-app
    await Browser.open({
      url: googleUrl,
      windowName: '_self'
    });
  } else {
    // On web, use normal redirect
    window.location.href = googleUrl;
  }
};


/* Where to return after logging in. Stored in localStorage so it survives the email-verification step. */
const RETURN_KEY = 'geoattend:returnTo';
const safePath = (p?: string | null) => (p && p.startsWith('/') && !p.startsWith('//') ? p : null);
const getReturnTo = (): string | null => {
  try {
    const raw = localStorage.getItem(RETURN_KEY);
    if (!raw) return null;
    const { p, t } = JSON.parse(raw) as { p?: string; t?: number };
    return t && Date.now() - t < 24 * 3600e3 ? safePath(p) : null; // ignore links older than a day
  } catch {
    return null;
  }
};
const clearReturnTo = () => {
  try {
    localStorage.removeItem(RETURN_KEY);
  } catch {
    /* ignore */
  }
};

type Mode = 'login' | 'register' | 'forgot' | 'verify';

function Logo() {
  return (
    <svg width="38" height="38" viewBox="0 0 56 56" aria-hidden="true">
      <circle cx="28" cy="28" r="25" fill="none" stroke="var(--onp)" strokeWidth="3" strokeDasharray="4 4" />
      <circle cx="28" cy="28" r="13" fill="none" stroke="var(--onp)" strokeWidth="3" />
      <circle cx="28" cy="28" r="5" fill="var(--sig)" />
    </svg>
  );
}

const TITLES: Record<Mode, { title: string; desc: string }> = {
  login: { title: 'Welcome back', desc: 'Log in to see sessions near you.' },
  register: { title: 'Create your account', desc: 'It takes less than a minute.' },
  forgot: { title: 'Reset your password', desc: 'Enter your account email and we will send a reset link.' },
  verify: { title: 'Verify your email', desc: '' },
};

export function AuthPage() {
  const location = useLocation();
  // Back to where the person came from: a share link (/s/:id), a protected page, or the stored link after email verification.
  const stateFrom = (location.state as { from?: string } | null)?.from;
  const own = location.pathname === '/auth' ? null : location.pathname + location.search;
  const from = stateFrom || getReturnTo() || own || '/attend';
  const comingFromShareLink = from.startsWith('/s/');

  // Check for OAuth error in URL
  const searchParams = new URLSearchParams(location.search);
  const oauthError = searchParams.get('error');

  const [mode, setMode] = useState<Mode>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState(oauthError === 'oauth_failed' ? 'Google sign-in failed. Please try again.' : '');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const go = (m: Mode) => {
    setMode(m);
    setError('');
    setMessage('');
  };

  const run = async (e: FormEvent, fn: () => Promise<void>, fail: string) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);
    try {
      await fn();
    } catch (err) {
      setError(err instanceof Error ? err.message : fail);
    } finally {
      setLoading(false);
    }
  };

  const onLogin = (e: FormEvent) =>
    run(e, async () => {
      await authApi.login(email, password);
      clearReturnTo();
      // Full navigation so the app reloads with the new session cookie and the check-in page sees you as logged in.
      window.location.assign(from);
    }, 'Login failed');
  const onRegister = (e: FormEvent) =>
    run(e, async () => { await authApi.register(name, email, password); setPassword(''); setMode('verify'); }, 'Registration failed');
  const onForgot = (e: FormEvent) =>
    run(e, async () => { await authApi.forgot(email); setMessage('If an account exists for that email, a reset link is on its way.'); }, 'Request failed');

  const toggleBtns = mode === 'login' || mode === 'register';
  const pwType = showPw ? 'text' : 'password';
  const t = TITLES[mode];

  const Alerts = () => (
    <>
      {error && (
        <p className="rounded-xl px-3 py-2 text-[13px] font-semibold" role="alert" style={{ background: 'var(--errt)', color: 'var(--err)' }}>
          {error}
        </p>
      )}
      {message && (
        <p className="rounded-xl px-3 py-2 text-[13px] font-semibold" role="status" style={{ background: 'var(--tint)', color: 'var(--pine)' }}>
          {message}
        </p>
      )}
    </>
  );

  return (
    <div className="relative min-h-[100dvh] overflow-x-hidden bg-[var(--bg)]">
      {/* Decorative contour rings */}
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-60 sm:h-80"
        style={{
          background: 'radial-gradient(60% 100% at 50% 0%, color-mix(in srgb, var(--pine) 18%, transparent), transparent)',
        }}
        aria-hidden="true"
      />

      {/* Centered column. Short screens (landscape phones, keyboard open) scroll instead of clipping. */}
      <div className="relative z-10 mx-auto flex min-h-[100dvh] w-full max-w-[460px] flex-col justify-center px-[max(1rem,env(safe-area-inset-left))] py-6 sm:max-w-[480px] sm:px-[18px] sm:py-10 [@media(max-height:520px)]:justify-start">
        {/* Brand */}
        <div className="mb-5 text-center sm:mb-6">
          <div className="mx-auto w-fit">
            <span className="grid h-14 w-14 place-items-center rounded-2xl bg-[var(--pine)] shadow-[var(--shadow-lg)] sm:h-16 sm:w-16"><Logo /></span>
          </div>
          <h1
            className="mt-3 text-[26px] font-bold leading-tight tracking-tight text-[var(--ink)] sm:mt-3.5 sm:text-[30px]"
          >
            GeoAttend
          </h1>
          <p className="mt-1 text-[13px] text-[var(--mut)]">Check in only where it counts.</p>
        </div>

        <Card>
          <CardHeader>
            {toggleBtns && (
              <div className="mb-3 grid grid-cols-2 gap-2" role="radiogroup" aria-label="Authentication mode">
                <Button
                  type="button"
                  size="sm"
                  role="radio"
                  aria-checked={mode === 'login'}
                  variant={mode === 'login' ? 'default' : 'outline'}
                  onClick={() => go('login')}
                >
                  Log in
                </Button>
                <Button
                  type="button"
                  size="sm"
                  role="radio"
                  aria-checked={mode === 'register'}
                  variant={mode === 'register' ? 'default' : 'outline'}
                  onClick={() => go('register')}
                >
                  Register
                </Button>
              </div>
            )}
            <CardTitle>{t.title}</CardTitle>
            {comingFromShareLink && mode !== 'verify' && mode !== 'forgot' && (
              <p className="mt-1 flex items-start gap-2 rounded-xl bg-[var(--tint)] px-3 py-2 text-[13px] font-medium text-[var(--pine)]">
                <i className="ti ti-map-pin-check mt-0.5" aria-hidden="true" />
                You are checking in to a session. Log in or create an account and you will go straight back to it.
              </p>
            )}
            {mode === 'verify' ? (
              <CardDescription>
                We sent a link to <strong className="text-[var(--ink)]">{email}</strong>. Open it to activate your account, then log in
                {comingFromShareLink ? ' and you will return to your session.' : '.'}
              </CardDescription>
            ) : (
              <CardDescription>{t.desc}</CardDescription>
            )}
          </CardHeader>

          {/* Login */}
          {mode === 'login' && (
            <form onSubmit={onLogin}>
              <CardContent className="space-y-4">
                {/* Google Sign In Button */}
                <Button
                  type="button"
                  variant="outline"
                  className="w-full flex items-center justify-center gap-2"
                  onClick={handleGoogleLogin}
                >
                  <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
                    <path
                      fill="#4285F4"
                      d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z"
                    />
                    <path
                      fill="#34A853"
                      d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332C2.438 15.983 5.482 18 9 18z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M3.964 10.707c-.18-.54-.282-1.117-.282-1.707 0-.593.102-1.17.282-1.709V4.958H.957C.347 6.173 0 7.548 0 9c0 1.452.348 2.827.957 4.042l3.007-2.335z"
                    />
                    <path
                      fill="#EA4335"
                      d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0 5.482 0 2.438 2.017.957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z"
                    />
                  </svg>
                  Sign in with Google
                </Button>

                {/* Divider */}
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t border-[var(--line)]" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-[var(--card)] px-2 text-center text-[11px] text-[var(--mut)] sm:text-xs">Or continue with email</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" required />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password">Password</Label>
                    <button
                      type="button"
                      onClick={() => setShowPw((v) => !v)}
                      className="text-xs font-semibold text-[var(--pine)] hover:underline"
                    >
                      {showPw ? 'Hide' : 'Show'}
                    </button>
                  </div>
                  <Input id="password" type={pwType} value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" required />
                </div>
                <Alerts />
              </CardContent>
              <CardFooter className="flex-col gap-2">
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? 'Logging in...' : 'Log in'}
                </Button>
                <Button type="button" variant="link" size="sm" onClick={() => go('forgot')}>
                  Forgot password?
                </Button>
              </CardFooter>
            </form>
          )}

          {/* Register */}
          {mode === 'register' && (
            <form onSubmit={onRegister}>
              <CardContent className="space-y-4">
                {/* Google Sign In Button */}
                <Button
                  type="button"
                  variant="outline"
                  className="w-full flex items-center justify-center gap-2"
                  onClick={handleGoogleLogin}
                >
                  <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
                    <path
                      fill="#4285F4"
                      d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z"
                    />
                    <path
                      fill="#34A853"
                      d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332C2.438 15.983 5.482 18 9 18z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M3.964 10.707c-.18-.54-.282-1.117-.282-1.707 0-.593.102-1.17.282-1.709V4.958H.957C.347 6.173 0 7.548 0 9c0 1.452.348 2.827.957 4.042l3.007-2.335z"
                    />
                    <path
                      fill="#EA4335"
                      d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0 5.482 0 2.438 2.017.957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z"
                    />
                  </svg>
                  Sign up with Google
                </Button>

                {/* Divider */}
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t border-[var(--line)]" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-[var(--card)] px-2 text-center text-[11px] text-[var(--mut)] sm:text-xs">Or register with email</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="name">Full name</Label>
                  <Input id="name" type="text" value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="reg-email">Email</Label>
                  <Input id="reg-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" required />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="reg-password">Password</Label>
                    <button
                      type="button"
                      onClick={() => setShowPw((v) => !v)}
                      className="text-xs font-semibold text-[var(--pine)] hover:underline"
                    >
                      {showPw ? 'Hide' : 'Show'}
                    </button>
                  </div>
                  <Input id="reg-password" type={pwType} value={password} onChange={(e) => setPassword(e.target.value)} minLength={8} autoComplete="new-password" required />
                  <p className="text-[13px] text-[var(--mut)]">At least 8 characters. We will email a link to verify your address.</p>
                </div>
                <Alerts />
              </CardContent>
              <CardFooter>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? 'Creating account...' : 'Create account'}
                </Button>
              </CardFooter>
            </form>
          )}

          {/* Forgot */}
          {mode === 'forgot' && (
            <form onSubmit={onForgot}>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="forgot-email">Email</Label>
                  <Input id="forgot-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" required />
                </div>
                <Alerts />
              </CardContent>
              <CardFooter className="flex-col gap-2">
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? 'Sending...' : 'Send reset link'}
                </Button>
                <Button type="button" variant="link" size="sm" onClick={() => go('login')}>
                  <i className="ti ti-arrow-left mr-1.5" aria-hidden="true" />
                  Back to log in
                </Button>
              </CardFooter>
            </form>
          )}

          {/* Verify */}
          {mode === 'verify' && (
            <CardFooter className="flex-col gap-2">
              <Button type="button" className="w-full" onClick={() => go('login')}>
                Back to log in
              </Button>
              <Button type="button" variant="link" size="sm" onClick={() => go('register')}>
                <i className="ti ti-arrow-left mr-1.5" aria-hidden="true" />
                Use a different email
              </Button>
            </CardFooter>
          )}
        </Card>
      </div>
    </div>
  );
}