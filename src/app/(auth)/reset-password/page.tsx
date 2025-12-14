'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { auth } from '@/lib/api/auth';
import { Mail, KeyRound, CheckCircle } from 'lucide-react';

// Step 1: Request OTP
const emailSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
});

// Step 2: Enter OTP and new password
const resetSchema = z.object({
  otp: z.string().length(6, 'OTP must be 6 digits'),
  new_password: z.string().min(8, 'Password must be at least 8 characters'),
  confirm_password: z.string().min(8, 'Please confirm your password'),
}).refine((data) => data.new_password === data.confirm_password, {
  message: "Passwords don't match",
  path: ['confirm_password'],
});

type EmailFormData = z.infer<typeof emailSchema>;
type ResetFormData = z.infer<typeof resetSchema>;

type Step = 'email' | 'reset' | 'success';

export default function ResetPasswordPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>('email');
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>('');

  const emailForm = useForm<EmailFormData>({
    resolver: zodResolver(emailSchema),
    defaultValues: { email: '' },
  });

  const resetForm = useForm<ResetFormData>({
    resolver: zodResolver(resetSchema),
    defaultValues: { otp: '', new_password: '', confirm_password: '' },
  });

  // Step 1: Request OTP
  const onEmailSubmit = async (data: EmailFormData) => {
    setIsLoading(true);
    setError('');

    try {
      const result = await auth.forgotPassword({ email: data.email });

      if (result.success) {
        setEmail(data.email);
        setStep('reset');
      } else {
        setError(result.error || 'Failed to send reset code. Please try again.');
      }
    } catch {
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Step 2: Reset password with OTP
  const onResetSubmit = async (data: ResetFormData) => {
    setIsLoading(true);
    setError('');

    try {
      const result = await auth.resetPassword({
        email,
        otp: data.otp,
        new_password: data.new_password,
      });

      if (result.success) {
        setStep('success');
        // Auto-redirect to login after 3 seconds
        setTimeout(() => {
          router.push('/login');
        }, 3000);
      } else {
        setError(result.error || 'Failed to reset password. Please check your code.');
      }
    } catch {
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Success screen
  if (step === 'success') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4">
        <Card className="rounded-2xl shadow-md max-w-md w-full">
          <CardContent className="pt-8 pb-8 text-center space-y-4">
            <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900">Password Reset!</h2>
            <p className="text-gray-600">
              Your password has been successfully reset. Redirecting to login...
            </p>
            <Button onClick={() => router.push('/login')} className="bg-brand hover:bg-brand/90">
              Go to Login
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Step 2: Enter OTP and new password
  if (step === 'reset') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4">
        <div className="max-w-md w-full space-y-8">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-brand-dark">Reset Password</h1>
            <p className="mt-2 text-gray-600">Enter the code and your new password</p>
          </div>

          <Card className="rounded-2xl shadow-md">
            <CardHeader className="space-y-1 text-center">
              <div className="mx-auto w-12 h-12 bg-brand/10 rounded-full flex items-center justify-center mb-2">
                <KeyRound className="w-6 h-6 text-brand" />
              </div>
              <CardTitle className="text-xl">Create new password</CardTitle>
              <CardDescription>
                We sent a 6-digit code to <strong>{email}</strong>
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <form onSubmit={resetForm.handleSubmit(onResetSubmit)} className="space-y-4">
                {error && (
                  <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md">
                    {error}
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="otp">Verification Code</Label>
                  <Input
                    id="otp"
                    type="text"
                    placeholder="Enter 6-digit code"
                    maxLength={6}
                    className="text-center text-2xl tracking-widest"
                    {...resetForm.register('otp')}
                  />
                  {resetForm.formState.errors.otp && (
                    <p className="text-sm text-red-600">{resetForm.formState.errors.otp.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="new_password">New Password</Label>
                  <Input
                    id="new_password"
                    type="password"
                    placeholder="Enter new password (min 8 characters)"
                    {...resetForm.register('new_password')}
                  />
                  {resetForm.formState.errors.new_password && (
                    <p className="text-sm text-red-600">{resetForm.formState.errors.new_password.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirm_password">Confirm New Password</Label>
                  <Input
                    id="confirm_password"
                    type="password"
                    placeholder="Confirm new password"
                    {...resetForm.register('confirm_password')}
                  />
                  {resetForm.formState.errors.confirm_password && (
                    <p className="text-sm text-red-600">{resetForm.formState.errors.confirm_password.message}</p>
                  )}
                </div>

                <Button
                  type="submit"
                  className="w-full bg-brand hover:bg-brand/90"
                  disabled={isLoading}
                >
                  {isLoading ? 'Resetting...' : 'Reset Password'}
                </Button>
              </form>

              <div className="text-center">
                <button
                  type="button"
                  className="text-sm text-gray-500 hover:text-gray-700"
                  onClick={() => {
                    setStep('email');
                    setError('');
                  }}
                >
                  ← Back to email
                </button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Step 1: Enter email
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
          <CardHeader className="space-y-1 text-center">
            <div className="mx-auto w-12 h-12 bg-brand/10 rounded-full flex items-center justify-center mb-2">
              <Mail className="w-6 h-6 text-brand" />
            </div>
            <CardTitle className="text-2xl font-semibold">Forgot password?</CardTitle>
            <CardDescription>
              Enter your email and we&apos;ll send you a code to reset your password
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <form onSubmit={emailForm.handleSubmit(onEmailSubmit)} className="space-y-4">
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
                  {...emailForm.register('email')}
                />
                {emailForm.formState.errors.email && (
                  <p className="text-sm text-red-600">{emailForm.formState.errors.email.message}</p>
                )}
              </div>

              <Button
                type="submit"
                className="w-full bg-brand hover:bg-brand/90"
                disabled={isLoading}
              >
                {isLoading ? 'Sending code...' : 'Send reset code'}
              </Button>
            </form>

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
              <p className="text-blue-700">Contact support@mentorconnect.ku.edu.pk</p>
            </div>
            <div>
              <p className="font-semibold text-blue-800">Remember your password?</p>
              <Link href="/login" className="text-blue-700 hover:text-blue-800 underline">
                Sign in to your account
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
