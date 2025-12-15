'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { auth } from '@/lib/api/auth';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, CheckCircle, XCircle } from 'lucide-react';
import Link from 'next/link';

function OAuthCallbackContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
    const [error, setError] = useState<string>('');

    useEffect(() => {
        const handleCallback = async () => {
            // Get parameters from URL
            const code = searchParams.get('code');
            const provider = searchParams.get('provider') as 'google' | 'linkedin' | null;
            const errorParam = searchParams.get('error');

            // Check for OAuth error
            if (errorParam) {
                setStatus('error');
                setError(errorParam === 'access_denied'
                    ? 'You cancelled the login. Please try again.'
                    : `OAuth error: ${errorParam}`
                );
                return;
            }

            // Validate parameters
            if (!code) {
                setStatus('error');
                setError('No authorization code received. Please try again.');
                return;
            }

            if (!provider || !['google', 'linkedin'].includes(provider)) {
                // Try to detect provider from state or fallback
                setStatus('error');
                setError('Could not determine the OAuth provider. Please try again.');
                return;
            }

            // Exchange code for token
            const result = await auth.handleOAuthCallback(provider, code);

            if (result.success) {
                setStatus('success');
                // Redirect to dashboard after short delay
                setTimeout(() => {
                    router.push('/dashboard');
                }, 1500);
            } else {
                setStatus('error');
                setError(result.error || 'Failed to complete login. Please try again.');
            }
        };

        handleCallback();
    }, [searchParams, router]);

    return (
        <Card className="rounded-2xl shadow-md max-w-md w-full">
            <CardContent className="p-8 text-center">
                {status === 'loading' && (
                    <>
                        <Loader2 className="h-12 w-12 animate-spin text-brand mx-auto mb-4" />
                        <h2 className="text-xl font-semibold text-gray-900 mb-2">
                            Completing sign in...
                        </h2>
                        <p className="text-gray-600">
                            Please wait while we verify your account.
                        </p>
                    </>
                )}

                {status === 'success' && (
                    <>
                        <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
                        <h2 className="text-xl font-semibold text-gray-900 mb-2">
                            Sign in successful!
                        </h2>
                        <p className="text-gray-600">
                            Redirecting you to your dashboard...
                        </p>
                    </>
                )}

                {status === 'error' && (
                    <>
                        <XCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
                        <h2 className="text-xl font-semibold text-gray-900 mb-2">
                            Sign in failed
                        </h2>
                        <p className="text-gray-600 mb-6">{error}</p>
                        <div className="space-x-3">
                            <Button asChild variant="outline">
                                <Link href="/login">Back to Login</Link>
                            </Button>
                            <Button asChild className="bg-brand hover:bg-brand/90">
                                <Link href="/signup">Create Account</Link>
                            </Button>
                        </div>
                    </>
                )}
            </CardContent>
        </Card>
    );
}

function LoadingFallback() {
    return (
        <Card className="rounded-2xl shadow-md max-w-md w-full">
            <CardContent className="p-8 text-center">
                <Loader2 className="h-12 w-12 animate-spin text-brand mx-auto mb-4" />
                <h2 className="text-xl font-semibold text-gray-900 mb-2">
                    Loading...
                </h2>
            </CardContent>
        </Card>
    );
}

export default function OAuthCallbackPage() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4">
            <Suspense fallback={<LoadingFallback />}>
                <OAuthCallbackContent />
            </Suspense>
        </div>
    );
}
