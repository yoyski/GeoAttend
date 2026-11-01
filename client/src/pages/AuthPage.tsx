import { useState, type FormEvent } from 'react';
import { useLocation } from 'react-router-dom';
import { authApi } from '../api/endpoints';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';


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

  const [mode, setMode] = useState<Mode>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState('');
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
    <div className="relative min-h-screen overflow-hidden bg-[var(--bg)]">
      {/* Decorative contour rings */}
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-80"
        style={{
          background: 'radial-gradient(60% 100% at 50% 0%, color-mix(in srgb, var(--pine) 18%, transparent), transparent)',
        }}
        aria-hidden="true"
      />

      <div className="relative z-10 mx-auto flex min-h-screen max-w-[460px] flex-col justify-center px-[18px] py-10">
        {/* Brand */}
        <div className="mb-6 text-center">
          <div className="mx-auto w-fit">
            <span className="grid h-16 w-16 place-items-center rounded-2xl bg-[var(--pine)] shadow-[var(--shadow-lg)]"><Logo /></span>
          </div>
          <h1
            className="mt-3.5 text-[30px] font-bold leading-tight tracking-tight text-[var(--ink)]"
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