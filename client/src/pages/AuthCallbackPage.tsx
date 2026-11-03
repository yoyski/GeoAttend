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
            // Set the token as a cookie that matches what the server expects
            // Important: No 'secure' flag for localhost, but required for production
            const isProduction = window.location.protocol === 'https:';
            const cookieString = `token=${token}; path=/; max-age=${7 * 24 * 60 * 60}; samesite=lax${isProduction ? '; secure' : ''}`;
            document.cookie = cookieString;

            console.log('OAuth token received and cookie set');

            // Clear return-to from localStorage if it exists
            try {
                localStorage.removeItem('geoattend:returnTo');
            } catch {
                // ignore
            }

            // Use window.location.href for a full page reload to ensure cookie is available
            window.location.href = '/attend';
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
