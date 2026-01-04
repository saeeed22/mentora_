'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Home,
  Search,
  MessageCircle,
  Calendar,
  User,
  Clock,
  LogOut
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { auth, CurrentUser } from '@/lib/api/auth';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface SidebarProps {
  user: CurrentUser;
  currentPath: string;
}

interface NavItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: number;
  mentorOnly?: boolean;
}

export function Sidebar({ user, currentPath }: SidebarProps) {
  const router = useRouter();
  const [unreadCount, setUnreadCount] = useState(0);
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);

  // Listen for unread message count changes from messages page
  useEffect(() => {
    const handleUnreadChange = (event: Event) => {
      const customEvent = event as CustomEvent;
      setUnreadCount(customEvent.detail?.count || 0);
    };
    window.addEventListener('unreadMessagesChange', handleUnreadChange);
    return () => window.removeEventListener('unreadMessagesChange', handleUnreadChange);
  }, []);

  const navItems: NavItem[] = [
    {
      name: 'Home',
      href: '/home',
      icon: Home,
    },
    {
      name: 'Explore',
      href: '/explore',
      icon: Search,
    },
    {
      name: 'Messages',
      href: '/messages',
      icon: MessageCircle,
      badge: unreadCount > 0 ? unreadCount : undefined,
    },
    {
      name: 'Bookings',
      href: '/bookings',
      icon: Calendar,
    },
    {
      name: 'Profile',
      href: '/profile',
      icon: User,
    },
    {
      name: 'Availability',
      href: '/availability',
      icon: Clock,
      mentorOnly: true,
    },
  ];

  const handleLogout = async () => {
    await auth.logout();
    router.push('/');
  };

  const confirmLogout = () => {
    setShowLogoutDialog(false);
    handleLogout();
  };

  return (
    <div className="hidden lg:flex w-20 h-screen bg-white shadow-sm border-r border-gray-200 flex-col items-center pt-2 sticky top-0">

      {/* Navigation (icons with labels below) */}
      <nav className="w-full px-2 py-4 space-y-2">
        {navItems
          .filter(item => !item.mentorOnly || user.role === 'mentor')
          .map((item) => {
            const isActive = currentPath === item.href;
            const Icon = item.icon;

            return (
              <Link
                key={item.name}
                href={item.href}
                className={`
                  group flex flex-col items-center justify-center px-2 py-3 text-[11px] font-medium rounded-lg transition-colors relative
                  ${isActive
                    ? 'bg-brand-light/10 text-brand'
                    : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                  }
                `}
              >
                <div className="relative">
                  <Icon className={`${isActive ? 'text-brand' : 'text-gray-400 group-hover:text-gray-500'} h-5 w-5`} />
                  {item.badge && item.badge > 0 && (
                    <span className="absolute -top-1 -right-1 h-2.5 w-2.5 bg-red-500 rounded-full border border-white" />
                  )}
                </div>
                <span className="leading-none text-center mt-1">{item.name}</span>
              </Link>
            );
          })}

        {/* Logout Button - Below Profile */}
        <div className="pt-2">
          <button
            onClick={() => setShowLogoutDialog(true)}
            className="group flex flex-col items-center justify-center px-2 py-3 text-[11px] font-medium rounded-lg transition-colors text-gray-700 hover:bg-red-50 hover:text-red-600 w-full"
          >
            <LogOut className="text-gray-400 group-hover:text-red-500 h-5 w-5 mb-1" />
            <span className="leading-none text-center">Logout</span>
          </button>
        </div>
      </nav>

      {/* Spacer to push content */}
      <div className="flex-1"></div>

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
              onClick={confirmLogout}
            >
              Logout
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
