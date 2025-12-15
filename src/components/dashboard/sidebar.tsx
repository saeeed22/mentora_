'use client';

import { useState } from 'react';
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
  const [unreadCount] = useState(0);

  // NOTE: Conversations API polling disabled due to backend CORS issues
  // Re-enable when backend CORS is fixed
  // The original code that polled for unread messages has been removed temporarily

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
    router.push('/login');
  };

  return (
    <div className="w-20 h-screen bg-white shadow-sm border-r border-gray-200 flex flex-col items-center pt-2 sticky top-0">

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
            onClick={handleLogout}
            className="group flex flex-col items-center justify-center px-2 py-3 text-[11px] font-medium rounded-lg transition-colors text-gray-700 hover:bg-red-50 hover:text-red-600 w-full"
          >
            <LogOut className="text-gray-400 group-hover:text-red-500 h-5 w-5 mb-1" />
            <span className="leading-none text-center">Logout</span>
          </button>
        </div>
      </nav>

      {/* Spacer to push content */}
      <div className="flex-1"></div>
    </div>
  );
}
