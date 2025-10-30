'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  Home, 
  Search, 
  MessageCircle, 
  Calendar, 
  User, 
  Users, 
  Clock, 
  LogOut
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { mockAuth, User as UserType } from '@/lib/mock-auth';

interface SidebarProps {
  user: UserType;
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
      badge: 3,
    },
    {
      name: 'Bookings',
      href: '/bookings',
      icon: Calendar,
      badge: 2
    },
    {
      name: 'Profile',
      href: '/profile',
      icon: User,
    },
    {
      name: 'Events',
      href: '/events',
      icon: Users,
    },
    {
      name: 'Availability',
      href: '/availability',
      icon: Clock,
      mentorOnly: true,
    },
  ];

  const handleLogout = async () => {
    await mockAuth.logout();
    router.push('/login');
  };

  return (
    <div className="w-20 bg-white shadow-sm border-r border-gray-200 flex flex-col items-center pt-2">

      {/* Navigation (icons with labels below) */}
      <nav className="flex-1 w-full px-2 py-4 space-y-2">
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
                  group flex flex-col items-center justify-center px-2 py-3 text-[11px] font-medium rounded-lg transition-colors
                  ${isActive
                    ? 'bg-teal-50 text-teal-700'
                    : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                  }
                `}
              >
                <Icon className={`${isActive ? 'text-teal-600' : 'text-gray-400 group-hover:text-gray-500'} h-5 w-5 mb-1`} />
                <span className="leading-none text-center">{item.name}</span>
              </Link>
            );
          })}
      </nav>

      {/* Bottom Section */}
      <div className="p-2 w-full border-t border-gray-200">
        <Button
          variant="ghost"
          className="w-full justify-center text-gray-700 hover:text-gray-900 hover:bg-gray-50"
          onClick={handleLogout}
        >
          <LogOut className="h-5 w-5" />
          <span className="sr-only">Logout</span>
        </Button>
      </div>
    </div>
  );
}
