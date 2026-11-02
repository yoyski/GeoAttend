import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';
import { useRequireLogin } from '../hooks/useRequireLogin';

/** Friendly "log in first" card for pages that only make sense with an account. Shown inside the app layout, so the nav stays visible. */
export function LoginGate({
  title = 'Log in to continue',
  desc = 'Log in or create a free account. You will come straight back to this page.',
  icon = 'ti-lock',
}: {
  title?: string;
  desc?: string;
  icon?: string;
}) {
  const { goToLogin } = useRequireLogin();
  return (
    <Card className="mt-5 overflow-hidden">
      <CardContent className="p-6 text-center">
        <span
          className="mx-auto grid h-16 w-16 place-items-center rounded-2xl text-[30px] text-[var(--pine)]"
          style={{ background: 'color-mix(in srgb, var(--pine) 12%, transparent)' }}
        >
          <i className={`ti ${icon}`} aria-hidden="true" />
        </span>
        <h2 className="mt-4 text-xl font-bold tracking-tight">{title}</h2>
        <p className="mx-auto mt-1.5 max-w-[360px] text-sm text-[var(--mut)]">{desc}</p>
        <Button type="button" size="lg" className="mt-5 w-full max-w-[320px]" onClick={() => goToLogin()}>
          <i className="ti ti-login text-[18px]" aria-hidden="true" />
          Log in or register
        </Button>
      </CardContent>
    </Card>
  );
}