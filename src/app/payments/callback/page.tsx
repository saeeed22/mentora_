"use client";

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import LandingHeader from '@/components/landing/header';
import LandingFooter from '@/components/landing/footer';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { paymentsApi } from '@/lib/api/payments-api';
import { bookingsApi } from '@/lib/api/bookings-api';
import { toast } from 'sonner';

function PaymentCallbackContent() {
  const params = useSearchParams();
  const router = useRouter();
  const [status, setStatus] = useState<'processing' | 'success' | 'failed'>('processing');
  const [message, setMessage] = useState('Verifying your payment...');

  useEffect(() => {
    const allParams: Record<string, string> = {};
    params.forEach((value, key) => { allParams[key] = value; });

    const run = async () => {
      const res = await paymentsApi.notifyCallback(allParams);
      if (res.success && res.data) {
        const ok = res.data.ok;
        const bookingId = res.data.booking_id as string | undefined;
        const paymentStatus = res.data.status as string | undefined;

        if (ok && bookingId && paymentStatus === 'paid') {
          setStatus('success');
          setMessage('Payment successful! Confirming your booking...');
          // Mark booking confirmed
          await bookingsApi.updateBookingStatus(bookingId, 'confirmed');
          toast.success('Payment received');
          setTimeout(() => router.push('/bookings'), 1500);
          return;
        }
      }
      setStatus('failed');
      setMessage('Payment verification failed or cancelled.');
    };

    run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <LandingHeader />
      <div className="flex-1">
        <div className="bg-gradient-to-r from-purple-50 to-blue-50 py-12 px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-3xl md:text-4xl font-bold text-brand-dark mb-4">Payment Status</h1>
            <p className="text-gray-600">{message}</p>
          </div>
        </div>
        <div className="max-w-3xl mx-auto px-4 py-12">
          <Card className="shadow-sm">
            <CardContent className="p-6 text-center space-y-4">
              {status === 'processing' && (
                <p className="text-gray-600">Please wait while we verify your payment with the gateway...</p>
              )}
              {status === 'success' && (
                <>
                  <p className="text-green-700 font-medium">Your booking is confirmed.</p>
                  <Button className="bg-brand" onClick={() => router.push('/bookings')}>Go to Bookings</Button>
                </>
              )}
              {status === 'failed' && (
                <>
                  <p className="text-red-600 font-medium">Payment failed or cancelled.</p>
                  <Button variant="outline" onClick={() => router.push('/browse')}>Browse Mentors</Button>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
      <LandingFooter />
    </div>
  );
}

export default function PaymentCallbackPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <PaymentCallbackContent />
    </Suspense>
  );
}
