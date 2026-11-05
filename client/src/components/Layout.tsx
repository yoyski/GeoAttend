import { Link, NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useRequireLogin } from '../hooks/useRequireLogin';
import { Button } from './ui/button';
import { ThemeToggle } from './ThemeToggle';
import { Avatar } from './Avatar';

function AppHeader() {
  const auth = useAuth() as any;
  const { goToLogin } = useRequireLogin();
  const loggedIn = !!auth?.user;
  const name: string | undefined = auth?.user?.name ?? auth?.me?.name ?? auth?.profile?.name;
  const avatar: string | null | undefined = auth?.user?.avatar ?? auth?.me?.avatar ?? auth?.profile?.avatar;

  return (
    <header className="mb-6 flex items-center justify-between">
      <div className="flex items-center gap-2.5 text-[17px] font-bold tracking-tight text-[var(--ink)]">
        <span className="grid h-9 w-9 place-items-center rounded-xl bg-black text-white shadow-[var(--shadow-md)] ring-1 ring-[var(--line)]">
          <svg width="22" height="22" viewBox="0 0 56 56" aria-hidden="true">
            <circle cx="28" cy="28" r="22" fill="none" stroke="currentColor" strokeWidth="4" strokeDasharray="5 5" />
            <circle cx="28" cy="28" r="11" fill="none" stroke="currentColor" strokeWidth="4" />
            <circle cx="28" cy="28" r="4.5" fill="currentColor" />
          </svg>
        </span>
        GeoAttend
      </div>
      <div className="flex items-center gap-2.5">
        <ThemeToggle />
        {auth?.loading ? (
          <span className="h-9 w-9" aria-hidden="true" />
        ) : loggedIn ? (
          <Link
            to="/account"
            aria-label="Open account"
            className="ring-2 ring-[var(--card)] transition hover:brightness-95 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[color-mix(in_srgb,var(--pine)_30%,transparent)] rounded-full"
          >
            <Avatar name={name} src={avatar} className="h-9 w-9 text-xs" />
          </Link>
        ) : (
          <Button type="button" size="sm" onClick={() => goToLogin()}>
            <i className="ti ti-login mr-1.5 text-[16px]" aria-hidden="true" />
            Log in
          </Button>
        )}
      </div>
    </header>
  );
}

const navLinks = [
  { path: '/attend', label: 'Attend', icon: 'ti-circle-check' },
  { path: '/create', label: 'Create', icon: 'ti-circle-plus' },
  { path: '/mine', label: 'My sessions', icon: 'ti-list-details' },
  { path: '/account', label: 'Account', icon: 'ti-user-circle' },
] as const;

const linkClass = ({ isActive }: { isActive: boolean }) =>
  [
    'flex flex-1 max-w-[120px] flex-col items-center gap-0.5 rounded-2xl px-2 py-1.5 text-center text-[11px] font-semibold transition-all',
    'focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[color-mix(in_srgb,var(--pine)_25%,transparent)]',
    'md:w-full md:max-w-none md:flex-none md:py-2.5',
    isActive
      ? 'bg-[var(--tint)] text-[var(--pine)]'
      : 'text-[var(--mut)] hover:bg-[var(--field)] hover:text-[var(--ink)]',
  ].join(' ');

export function Layout() {
  return (
    <div className="relative min-h-screen bg-[var(--bg)] text-[var(--ink)] md:pl-28">
      {/* Soft gradient glow, top */}
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-x-0 top-0 z-0 h-72 print:hidden"
        style={{
          background:
            'radial-gradient(60% 100% at 70% 0%, color-mix(in srgb, var(--pine) 14%, transparent), transparent)',
        }}
      />

      <main className="relative z-[1] mx-auto w-full max-w-[430px] px-4 pt-4 pb-32 sm:max-w-[560px] md:max-w-[980px] md:px-8 md:pt-8 md:pb-14">
        <AppHeader />
        <Outlet />
      </main>

      {/* Floating pill bar on phones, left rail on desktop */}
      <nav
        aria-label="Main"
        className="fixed inset-x-3 bottom-3 z-30 flex justify-center gap-1 rounded-3xl border border-[var(--line)] bg-[color-mix(in_srgb,var(--card)_88%,transparent)] p-1.5 pb-[calc(6px+env(safe-area-inset-bottom,0px))] shadow-[var(--shadow-lg)] backdrop-blur-xl print:hidden md:inset-y-4 md:left-4 md:right-auto md:w-[88px] md:flex-col md:justify-start md:p-2"
      >
        {navLinks.map((link) => (
          <NavLink key={link.path} to={link.path} className={linkClass} title={link.label}>
            <i className={`ti ${link.icon} text-[22px]`} aria-hidden="true" />
            <span className="hidden leading-tight md:block">{link.label}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  );
}