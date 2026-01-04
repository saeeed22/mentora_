'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Calendar, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { CurrentUser, auth } from '@/lib/api/auth';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useRouter } from 'next/navigation';

interface HeaderProps {
  user: CurrentUser;
}

export function Header({ user }: HeaderProps) {
  const [logoSrc, setLogoSrc] = useState('/logos/logo.png');
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);
  const router = useRouter();

  const handleLogout = async () => {
    await auth.logout();
    router.push('/');
  };

  return (
    <header className="bg-white border-b border-gray-200 px-4 sm:px-6 py-4">
      <div className="flex items-center justify-between">
        {/* Branding */}
        <Link href="/" className="flex items-center gap-2 shrink-0">
          <Image
            src={logoSrc}
            alt="Mentora Logo"
            width={60}
            height={60}
            className="object-contain w-12 h-12 sm:w-14 sm:h-14 lg:w-[60px] lg:h-[60px]"
            onError={() => setLogoSrc('/logos/logo.svg')}
          />
        </Link>

        {/* Right Section */}
        <div className="flex items-center space-x-2 sm:space-x-4 ml-auto">
          {/* Compact identity avatar */}
          <Avatar className="h-9 w-9 sm:h-10 sm:w-10 border border-gray-200 shadow-sm">
            <AvatarImage src={user.avatar} alt={user.name} />
            <AvatarFallback className="bg-gray-100 text-gray-700 text-xs sm:text-sm font-semibold">
              {(user.name || user.email || 'U').slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>

          {/* Book Session Button - Only for mentees */}
          {user.role === 'mentee' && (
            <Button className="bg-brand hover:bg-brand/90" asChild aria-label="Book a session">
              <Link href="/explore">
                <Calendar className="w-4 h-4 sm:mr-2" />
                <span className="hidden sm:inline">Book Session</span>
              </Link>
            </Button>
          )}

          {/* Logout Button - Only visible on mobile (lg:hidden) */}
          <Button
            variant="ghost"
            size="sm"
            className="lg:hidden p-2"
            onClick={() => setShowLogoutDialog(true)}
            aria-label="Logout"
          >
            <LogOut className="h-5 w-5 text-gray-600" />
          </Button>
        </div>
      </div>

      {/* Logout Confirmation Dialog */}
      <Dialog open={showLogoutDialog} onOpenChange={setShowLogoutDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Logout</DialogTitle>
            <DialogDescription>
              Are you sure you want to logout? You'll need to sign in again to access your dashboard.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowLogoutDialog(false)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                setShowLogoutDialog(false);
                handleLogout();
              }}
            >
              Logout
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </header>
  );
}
