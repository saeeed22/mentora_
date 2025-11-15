'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { mockAuth } from '@/lib/mock-auth';

// Validation schema
const resetSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
});

type ResetFormData = z.infer<typeof resetSchema>;

export default function ResetPasswordPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<boolean>(false);

  const form = useForm<ResetFormData>({
    resolver: zodResolver(resetSchema),
    defaultValues: {
      email: '',
    },
  });

  const onSubmit = async (data: ResetFormData) => {
    setIsLoading(true);
    setError('');
    setSuccess(false);

    try {
      const result = await mockAuth.resetPassword(data.email);
      
      if (result.success) {
        setSuccess(true);
        form.reset();
      } else {
        setError(result.error || 'Reset failed');
      }
    } catch {
      setError('An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-3xl font-bold text-brand-dark">Mentor Connect KU</h1>
          <p className="mt-2 text-gray-600">Reset your password</p>
        </div>

        {/* Reset Password Card */}
        <Card className="rounded-2xl shadow-md">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-semibold">Forgot password?</CardTitle>
            <CardDescription>
              {success 
                ? "We&apos;ve sent you a password reset link"
                : "Enter your email address and we&apos;ll send you a link to reset your password"
              }
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {success ? (
              // Success State
              <div className="text-center space-y-4">
                <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100">
                  <svg
                    className="h-6 w-6 text-green-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-medium text-gray-900">Check your email</h3>
                  <p className="mt-2 text-sm text-gray-600">
                    We&apos;ve sent a password reset link to your email address. Please check your inbox and follow the instructions to reset your password.
                  </p>
                </div>
                <div className="space-y-3">
                  <p className="text-sm text-gray-500">
                    Didn&apos;t receive the email? Check your spam folder or try again.
                  </p>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setSuccess(false);
                      setError('');
                    }}
                    className="w-full"
                  >
                    Try again
                  </Button>
                </div>
              </div>
            ) : (
              // Reset Form
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                {error && (
                  <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md">
                    {error}
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="email">Email address</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="Enter your email"
                    {...form.register('email')}
                  />
                  {form.formState.errors.email && (
                    <p className="text-sm text-red-600">{form.formState.errors.email.message}</p>
                  )}
                </div>

                <Button
                  type="submit"
                  className="w-full bg-brand hover:bg-brand/90"
                  disabled={isLoading}
                >
                  {isLoading ? 'Sending reset link...' : 'Send reset link'}
                </Button>
              </form>
            )}

            <div className="text-center">
              <Link
                href="/login"
                className="text-sm text-brand hover:text-brand/90 font-medium"
              >
                ← Back to sign in
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Help Information */}
        <Card className="rounded-2xl shadow-md bg-blue-50 border-blue-200">
          <CardHeader>
            <CardTitle className="text-lg text-blue-800">Need help?</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div>
              <p className="font-semibold text-blue-800">Can&apos;t access your email?</p>
              <p className="text-blue-700">Contact our support team at support@mentorconnect.ku.edu.pk</p>
            </div>
            <div>
              <p className="font-semibold text-blue-800">Remember your password?</p>
              <Link href="/login" className="text-blue-700 hover:text-blue-800 underline">
                Sign in to your account
              </Link>
            </div>
            <div>
              <p className="font-semibold text-blue-800">New to Mentor Connect KU?</p>
              <Link href="/signup" className="text-blue-700 hover:text-blue-800 underline">
                Create a new account
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

