import { useState, type FormEvent } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { authApi } from '../api/endpoints';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { PasswordStrength } from '../components/PasswordStrength';

function Logo() {
    return (
        <svg width="38" height="38" viewBox="0 0 56 56" aria-hidden="true">
            <circle cx="28" cy="28" r="25" fill="none" stroke="var(--onp)" strokeWidth="3" strokeDasharray="4 4" />
            <circle cx="28" cy="28" r="13" fill="none" stroke="var(--onp)" strokeWidth="3" />
            <circle cx="28" cy="28" r="5" fill="var(--sig)" />
        </svg>
    );
}

export function ResetPasswordPage() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const token = searchParams.get('token');

    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPw, setShowPw] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);

    if (!token) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-[var(--bg)] p-4">
                <Card className="w-full max-w-md">
                    <CardHeader>
                        <CardTitle>Invalid Reset Link</CardTitle>
                        <CardDescription>This password reset link is invalid or incomplete.</CardDescription>
                    </CardHeader>
                    <CardFooter>
                        <Button onClick={() => navigate('/auth')} className="w-full">
                            Back to Login
                        </Button>
                    </CardFooter>
                </Card>
            </div>
        );
    }

    const onSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setError('');

        if (password.length < 8) {
            setError('Password must be at least 8 characters long.');
            return;
        }

        if (password !== confirmPassword) {
            setError('Passwords do not match.');
            return;
        }

        setLoading(true);
        try {
            await authApi.reset(token, password);
            setSuccess(true);
            setTimeout(() => {
                navigate('/auth');
            }, 3000);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to reset password. The link may be invalid or expired.');
        } finally {
            setLoading(false);
        }
    };

    const pwType = showPw ? 'text' : 'password';

    return (
        <div className="relative min-h-[100dvh] overflow-x-hidden bg-[var(--bg)]">
            {/* Decorative gradient */}
            <div
                className="pointer-events-none absolute inset-x-0 top-0 h-60 sm:h-80"
                style={{
                    background: 'radial-gradient(60% 100% at 50% 0%, color-mix(in srgb, var(--pine) 18%, transparent), transparent)',
                }}
                aria-hidden="true"
            />

            <div className="relative z-10 mx-auto flex min-h-[100dvh] w-full max-w-[460px] flex-col justify-center px-[max(1rem,env(safe-area-inset-left))] py-6 sm:max-w-[480px] sm:px-[18px] sm:py-10">
                {/* Brand */}
                <div className="mb-5 text-center sm:mb-6">
                    <div className="mx-auto w-fit">
                        <span className="grid h-14 w-14 place-items-center rounded-2xl bg-[var(--pine)] shadow-[var(--shadow-lg)] sm:h-16 sm:w-16">
                            <Logo />
                        </span>
                    </div>
                    <h1 className="mt-3 text-[26px] font-bold leading-tight tracking-tight text-[var(--ink)] sm:mt-3.5 sm:text-[30px]">
                        GeoAttend
                    </h1>
                    <p className="mt-1 text-[13px] text-[var(--mut)]">Check in only where it counts.</p>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>{success ? 'Password Reset!' : 'Set New Password'}</CardTitle>
                        <CardDescription>
                            {success
                                ? 'Your password has been reset successfully. Redirecting to login...'
                                : 'Enter your new password below. Make sure it is at least 8 characters long.'}
                        </CardDescription>
                    </CardHeader>

                    {success ? (
                        <CardContent className="text-center">
                            <div className="text-6xl mb-4">✅</div>
                            <p className="text-sm text-[var(--mut)]">Taking you to login page...</p>
                        </CardContent>
                    ) : (
                        <form onSubmit={onSubmit}>
                            <CardContent className="space-y-4">
                                <div className="space-y-2">
                                    <div className="flex items-center justify-between">
                                        <Label htmlFor="password">New Password</Label>
                                        <button
                                            type="button"
                                            onClick={() => setShowPw((v) => !v)}
                                            className="text-xs font-semibold text-[var(--pine)] hover:underline"
                                        >
                                            {showPw ? 'Hide' : 'Show'}
                                        </button>
                                    </div>
                                    <Input
                                        id="password"
                                        type={pwType}
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        minLength={8}
                                        autoComplete="new-password"
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="confirm-password">Confirm Password</Label>
                                    <Input
                                        id="confirm-password"
                                        type={pwType}
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        minLength={8}
                                        autoComplete="new-password"
                                        required
                                    />
                                </div>
                                <PasswordStrength password={password} />
                                {error && (
                                    <p
                                        className="rounded-xl px-3 py-2 text-[13px] font-semibold"
                                        role="alert"
                                        style={{ background: 'var(--errt)', color: 'var(--err)' }}
                                    >
                                        {error}
                                    </p>
                                )}
                            </CardContent>
                            <CardFooter className="flex-col gap-2">
                                <Button type="submit" className="w-full" disabled={loading}>
                                    {loading ? 'Resetting...' : 'Reset Password'}
                                </Button>
                                <Button type="button" variant="link" size="sm" onClick={() => navigate('/auth')}>
                                    Back to Login
                                </Button>
                            </CardFooter>
                        </form>
                    )}
                </Card>
            </div>
        </div>
    );
}
