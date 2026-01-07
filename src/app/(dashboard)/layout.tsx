'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { auth, CurrentUser } from '@/lib/api/auth';
import { Sidebar } from '@/components/dashboard/sidebar';
import { Header } from '@/components/dashboard/header';
import { BottomNav } from '@/components/dashboard/bottom-nav';
import LandingFooter from '@/components/landing/footer';
import { ReactQueryProvider } from '@/providers/react-query-provider';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const currentUser = auth.getCurrentUser();
    if (!currentUser) {
      router.replace('/login');
      return;
    }
    setUser(currentUser);
    setLoading(false);
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <ReactQueryProvider>
      <div className="min-h-screen bg-white flex flex-col">
        {/* Global Header above sidebar */}
        <Header user={user} />

        {/* Content row: compact sidebar + page content */}
        <div className="flex flex-1">
          <Sidebar user={user} currentPath={pathname} />

          {/* Main Content */}
          <main className="flex-1 p-4 sm:p-6 lg:p-8 min-w-0 pb-20 lg:pb-6">
            {children}
          </main>
        </div>

        {/* Mobile Bottom Navigation */}
        <BottomNav user={user} currentPath={pathname} />

        {/* Footer */}
        <LandingFooter />
      </div>
    </ReactQueryProvider>
  );
}
