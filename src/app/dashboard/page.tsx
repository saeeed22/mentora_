'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { mockAuth } from '@/lib/mock-auth';

export default function DashboardRedirect() {
  const router = useRouter();

  useEffect(() => {
    const currentUser = mockAuth.getCurrentUser();
    if (!currentUser) {
      router.push('/login');
      return;
    }
    
    // Redirect to the actual dashboard home page
    router.replace('/home');
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">Loading dashboard...</p>
      </div>
    </div>
  );
}
