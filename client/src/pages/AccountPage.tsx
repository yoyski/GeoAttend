import { useEffect, useRef, useState } from 'react';
import { ApiError } from '../api/client';
import { authApi, meApi } from '../api/endpoints';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../components/ui/dialog';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Separator } from '../components/ui/separator';
import { Skeleton } from '../components/ui/skeleton';
import { Avatar } from '../components/Avatar';
import { AvatarPicker } from '../components/AvatarPicker';
import { ErrorBox, PageHeading } from '../components/modern';
import { fileToAvatar } from '../lib/image';
import { useAsync } from '../hooks/useAsync';

type Dlg = 'delete' | 'signout' | 'password' | null;

function Switch({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={
        'relative h-7 w-12 shrink-0 cursor-pointer rounded-full transition-colors focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[color-mix(in_srgb,var(--pine)_25%,transparent)] ' +
        (checked ? 'bg-[var(--pine)]' : 'bg-[var(--line)]')
      }
    >
      <span
        className={
          'absolute left-0.5 top-0.5 h-6 w-6 rounded-full bg-white shadow-[var(--shadow-md)] transition-transform ' +
          (checked ? 'translate-x-5' : 'translate-x-0')
        }
      />
    </button>
  );
}

function SettingRow({
  icon,
  title,
  desc,
  children,
}: {
  icon: string;
  title: string;
  desc?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-3.5 py-3.5">
      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[var(--tint)] text-lg text-[var(--pine)]">
        <i className={`ti ${icon}`} aria-hidden="true" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold">{title}</p>
        {desc && <p className="text-[13px] text-[var(--mut)]">{desc}</p>}
      </div>
      {children}
    </div>
  );
}

export function AccountPage() {
  const me = useAsync(() => meApi.get(), []);
  const [name, setName] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState<ApiError | null>(null);
  const [dlg, setDlg] = useState<Dlg>(null);
  const [uploading, setUploading] = useState(false);
  const [showAvatarPicker, setShowAvatarPicker] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (me.data) setName(me.data.name);
  }, [me.data]);

  const run = async (fn: () => Promise<unknown>, successMsg = ''): Promise<boolean> => {
    setError(null);
    setMessage('');
    try {
      await fn();
      if (successMsg) setMessage(successMsg);
      me.reload();
      return true;
    } catch (e) {
      setError(e as ApiError);
      return false;
    }
  };

  const onPickPhoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = ''; // lets the same file be picked again
    if (!file) return;
    setUploading(true);
    setError(null);
    setMessage('');
    try {
      // fileToAvatar already resizes to 256x256 and compresses to ~15-60KB
      const avatarDataUrl = await fileToAvatar(file);
      await run(() => meApi.patch({ avatar: avatarDataUrl }), 'Profile photo updated');
    } catch (err) {
      setError({ message: err instanceof Error ? err.message : 'Could not upload that image.' } as ApiError);
    } finally {
      setUploading(false);
    }
  };

  const closePassword = () => {
    setDlg(null);
    setCurrentPassword('');
    setNewPassword('');
  };

  const savePassword = async () => {
    const ok = await run(() => authApi.changePassword(currentPassword, newPassword), 'Password updated');
    if (ok) closePassword();
  };

  const doConfirmed = () => {
    const which = dlg;
    setDlg(null);
    if (which === 'delete') {
      void run(async () => {
        await meApi.remove();
        setMessage('Account deleted');
      });
    } else if (which === 'signout') {
      void run(async () => {
        await authApi.logout();
        window.location.href = '/';
      });
    }
  };

  const d = me.data;
  const nameChanged = !!d && name.trim() !== '' && name.trim() !== d.name;

  return (
    <div>
      <PageHeading title="Account" sub="Manage your profile and preferences" />

      <ErrorBox error={me.error || error} />
      {message && (
        <Card tone="tint" role="status" className="mb-4">
          <CardContent className="flex items-center gap-2.5 p-4 text-sm font-semibold text-[var(--pine)]">
            <i className="ti ti-circle-check text-lg" aria-hidden="true" />
            {message}
          </CardContent>
        </Card>
      )}

      {me.loading && !d && (
        <div className="grid gap-5 md:grid-cols-[340px_1fr] md:items-start">
          {/* Left: identity skeleton */}
          <Card className="overflow-hidden">
            <div className="h-20 bg-[var(--line)]" />
            <CardContent className="-mt-10 p-5 pt-0">
              <Skeleton className="h-20 w-20 rounded-full ring-4 ring-[var(--card)]" />
              <Skeleton className="mt-3 h-6 w-32" />
              <Skeleton className="mt-1 h-4 w-48" />
              <Skeleton className="mt-2.5 h-6 w-20 rounded-full" />
              <div className="my-5">
                <Skeleton className="h-px w-full" />
              </div>
              <div className="space-y-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
              </div>
              <Skeleton className="mt-3 h-10 w-full" />
            </CardContent>
          </Card>

          {/* Right: settings skeleton */}
          <div className="space-y-5">
            <Card>
              <CardHeader>
                <Skeleton className="h-6 w-32" />
                <Skeleton className="h-4 w-48" />
              </CardHeader>
              <CardContent className="divide-y divide-[var(--line)] py-0">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex items-center gap-3.5 py-3.5">
                    <Skeleton className="h-10 w-10 rounded-xl" />
                    <div className="min-w-0 flex-1 space-y-1.5">
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-3 w-48" />
                    </div>
                    <Skeleton className="h-7 w-12 rounded-full" />
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {d && (
        <div className="grid gap-5 md:grid-cols-[340px_1fr] md:items-start">
          {/* Left: identity */}
          <Card className="overflow-hidden">
            <div
              className="h-20"
              style={{
                background:
                  'linear-gradient(120deg, color-mix(in srgb, var(--pine) 80%, transparent), color-mix(in srgb, var(--sig) 60%, transparent))',
              }}
            />
            <CardContent className="-mt-10 p-5 pt-0">
              <div className="relative w-fit">
                <Avatar
                  name={d.name}
                  src={d.avatar}
                  className="h-20 w-20 text-[26px] shadow-[var(--shadow-md)] ring-4 ring-[var(--card)]"
                />
                <button
                  type="button"
                  aria-label={d.avatar ? 'Change profile photo' : 'Upload profile photo'}
                  title={d.avatar ? 'Change photo' : 'Upload photo'}
                  onClick={() => fileRef.current?.click()}
                  disabled={uploading}
                  className="absolute -bottom-1 -right-1 grid h-8 w-8 cursor-pointer place-items-center rounded-full bg-[var(--pine)] text-[16px] text-[var(--onp)] shadow-[var(--shadow-md)] ring-2 ring-[var(--card)] transition hover:brightness-110 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[color-mix(in_srgb,var(--pine)_30%,transparent)] disabled:opacity-60"
                >
                  <i className={`ti ${uploading ? 'ti-loader-2 animate-spin' : 'ti-camera'}`} aria-hidden="true" />
                </button>
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  className="sr-only"
                  tabIndex={-1}
                  onChange={onPickPhoto}
                />
              </div>
              {d.avatar && (
                <div className="mt-2 flex gap-2">
                  <button
                    type="button"
                    disabled={uploading}
                    onClick={() => setShowAvatarPicker(true)}
                    className="text-xs font-semibold text-[var(--pine)] hover:underline"
                  >
                    Choose avatar
                  </button>
                  <span className="text-xs text-[var(--line)]">•</span>
                  <button
                    type="button"
                    disabled={uploading}
                    onClick={() => void run(() => meApi.patch({ avatar: null }), 'Profile photo removed')}
                    className="text-xs font-semibold text-[var(--mut)] hover:text-[var(--err)] hover:underline"
                  >
                    Remove photo
                  </button>
                </div>
              )}
              {!d.avatar && (
                <button
                  type="button"
                  disabled={uploading}
                  onClick={() => setShowAvatarPicker(true)}
                  className="mt-2 text-xs font-semibold text-[var(--pine)] hover:underline"
                >
                  Choose avatar
                </button>
              )}
              <h2 className="mt-3 truncate text-xl font-bold">{d.name}</h2>
              <p className="truncate text-[13px] text-[var(--mut)]">{d.email}</p>
              <div className="mt-2.5">
                <Badge variant={d.verified ? 'success' : 'warning'} showDot>
                  {d.verified ? 'Verified' : 'Not verified'}
                </Badge>
              </div>

              <Separator className="my-5" />

              <form
                className="space-y-2"
                onSubmit={(e) => {
                  e.preventDefault();
                  if (nameChanged) void run(() => meApi.patch({ name: name.trim() }), 'Profile updated');
                }}
              >
                <Label htmlFor="display-name">Display name</Label>
                <Input
                  id="display-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your name"
                  autoComplete="name"
                />
                <Button type="submit" className="w-full" disabled={!nameChanged}>
                  Save changes
                </Button>
              </form>

              <Button type="button" variant="outline" className="mt-3 w-full" onClick={() => setDlg('signout')}>
                <i className="ti ti-logout text-base" aria-hidden="true" />
                Sign out
              </Button>
            </CardContent>
          </Card>

          {/* Right: settings */}
          <div className="space-y-5">
            <Card>
              <CardHeader>
                <CardTitle>Notifications</CardTitle>
                <CardDescription>Saved as soon as you switch them.</CardDescription>
              </CardHeader>
              <CardContent className="divide-y divide-[var(--line)] py-0">
                <SettingRow icon="ti-bell" title="Session reminders" desc="Remind me when a session opens">
                  <Switch
                    label="Remind me when a session opens"
                    checked={d.notifications.reminders}
                    onChange={(v) => void run(() => meApi.patch({ notifications: { reminders: v } }))}
                  />
                </SettingRow>
                <SettingRow icon="ti-circle-check" title="Check-in receipts" desc="Notify me after I check in">
                  <Switch
                    label="Notify me after I check in"
                    checked={d.notifications.checkIn}
                    onChange={(v) => void run(() => meApi.patch({ notifications: { checkIn: v } }))}
                  />
                </SettingRow>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Security</CardTitle>
              </CardHeader>
              <CardContent className="py-0">
                <SettingRow icon="ti-lock" title="Password" desc="Change the password you use to log in">
                  <Button type="button" variant="outline" size="sm" onClick={() => setDlg('password')}>
                    Change
                  </Button>
                </SettingRow>
              </CardContent>
            </Card>

            <div className="flex items-center gap-3.5 rounded-2xl border border-[color-mix(in_srgb,var(--err)_30%,transparent)] bg-[var(--errt)] p-4">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[var(--card)] text-lg text-[var(--err)]">
                <i className="ti ti-trash" aria-hidden="true" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-[var(--err)]">Delete account</p>
                <p className="text-[13px] text-[var(--mut)]">Removes your account and all your sessions. Cannot be undone.</p>
              </div>
              <Button type="button" variant="destructive" size="sm" onClick={() => setDlg('delete')}>
                Delete
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Change password */}
      <Dialog open={dlg === 'password'} onOpenChange={(o) => !o && closePassword()}>
        <DialogContent>
          <form
            className="grid gap-4"
            onSubmit={(e) => {
              e.preventDefault();
              void savePassword();
            }}
          >
            <DialogHeader>
              <DialogTitle>Change password</DialogTitle>
              <DialogDescription>Enter your current password, then choose a new one.</DialogDescription>
            </DialogHeader>
            <div className="space-y-2">
              <Label htmlFor="cur-pass">Current password</Label>
              <Input
                id="cur-pass"
                type="password"
                autoComplete="current-password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-pass">New password</Label>
              <Input
                id="new-pass"
                type="password"
                autoComplete="new-password"
                minLength={8}
                placeholder="At least 8 characters"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={closePassword}>
                Cancel
              </Button>
              <Button type="submit" disabled={!currentPassword || newPassword.length < 8}>
                Update password
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Sign out / delete confirm */}
      <Dialog open={dlg === 'delete' || dlg === 'signout'} onOpenChange={(o) => !o && setDlg(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{dlg === 'delete' ? 'Delete your account?' : 'Sign out?'}</DialogTitle>
            <DialogDescription>
              {dlg === 'delete'
                ? 'This removes your account and all your sessions. This cannot be undone.'
                : 'You will need to log in again to see sessions.'}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setDlg(null)}>
              Cancel
            </Button>
            <Button type="button" variant={dlg === 'delete' ? 'destructive' : 'default'} onClick={doConfirmed}>
              {dlg === 'delete' ? 'Delete account' : 'Sign out'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Avatar Picker */}
      <AvatarPicker
        open={showAvatarPicker}
        onClose={() => setShowAvatarPicker(false)}
        onSelect={(avatarUrl) => void run(() => meApi.patch({ avatar: avatarUrl }), 'Profile photo updated')}
        currentAvatar={d?.avatar}
      />
    </div>
  );
}