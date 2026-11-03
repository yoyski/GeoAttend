import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

/**
 * OAuth callback page that receives the JWT token from Google OAuth
 * and stores it in a cookie for subsequent API requests
 */
export function AuthCallbackPage() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();

    useEffect(() => {
        const token = searchParams.get('token');

        if (token) {
            // Set the token as a cookie
            // Note: This won't be httpOnly, but it's the only way to make cross-domain OAuth work
            // The token is still signed and secure
            document.cookie = `token=${token}; path=/; max-age=${7 * 24 * 60 * 60}; secure; samesite=lax`;

            // Clear return-to from localStorage if it exists
            try {
                localStorage.removeItem('geoattend:returnTo');
            } catch {
                // ignore
            }

            // Redirect to /attend or wherever the user was trying to go
            navigate('/attend', { replace: true });
        } else {
            // No token, redirect to auth page with error
            navigate('/auth?error=oauth_failed', { replace: true });
        }
    }, [searchParams, navigate]);

    return (
        <div className="flex min-h-screen items-center justify-center bg-[var(--bg)]">
            <div className="text-center">
                <div className="mb-4 inline-block h-8 w-8 animate-spin rounded-full border-4 border-[var(--pine)] border-t-transparent" />
                <p className="text-[var(--mut)]">Completing sign in...</p>
            </div>
        </div>
    );
}
