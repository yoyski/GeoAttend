import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { verifyEmail } from '../api/endpoints';

export function VerifyEmailPage() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
    const [message, setMessage] = useState('');

    useEffect(() => {
        const token = searchParams.get('token');

        if (!token) {
            setStatus('error');
            setMessage('Invalid verification link. No token provided.');
            return;
        }

        verifyEmail(token)
            .then(() => {
                setStatus('success');
                setMessage('Your email has been verified! You can now log in.');
                // Redirect to auth page after 3 seconds
                setTimeout(() => {
                    navigate('/auth', { replace: true });
                }, 3000);
            })
            .catch((error: any) => {
                setStatus('error');
                setMessage(error.response?.data?.error?.message || 'Failed to verify email. The link may be invalid or expired.');
            });
    }, [searchParams, navigate]);

    return (
        <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-[#667eea] to-[#764ba2] p-4">
            <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-xl">
                {status === 'loading' && (
                    <div className="text-center">
                        <div className="mb-4 inline-block h-12 w-12 animate-spin rounded-full border-4 border-solid border-[#667eea] border-r-transparent" />
                        <h1 className="text-2xl font-bold text-gray-800">Verifying your email...</h1>
                        <p className="mt-2 text-gray-600">Please wait</p>
                    </div>
                )}

                {status === 'success' && (
                    <div className="text-center">
                        <div className="mb-4 text-6xl">✅</div>
                        <h1 className="text-2xl font-bold text-green-600">Email Verified!</h1>
                        <p className="mt-3 text-gray-700">{message}</p>
                        <p className="mt-4 text-sm text-gray-500">Redirecting to login...</p>
                        <div className="mt-6">
                            <button
                                onClick={() => navigate('/auth')}
                                className="rounded-lg bg-gradient-to-r from-[#667eea] to-[#764ba2] px-6 py-2 font-semibold text-white transition hover:opacity-90"
                            >
                                Go to Login
                            </button>
                        </div>
                    </div>
                )}

                {status === 'error' && (
                    <div className="text-center">
                        <div className="mb-4 text-6xl">❌</div>
                        <h1 className="text-2xl font-bold text-red-600">Verification Failed</h1>
                        <p className="mt-3 text-gray-700">{message}</p>
                        <div className="mt-6 space-y-3">
                            <button
                                onClick={() => navigate('/auth')}
                                className="w-full rounded-lg bg-gradient-to-r from-[#667eea] to-[#764ba2] px-6 py-2 font-semibold text-white transition hover:opacity-90"
                            >
                                Back to Login
                            </button>
                            <p className="text-sm text-gray-500">
                                Need help? Contact support or try registering again.
                            </p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
