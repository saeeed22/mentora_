'use client';

import { useEffect, useState } from 'react';
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
import { messagingApi } from '@/lib/api/messaging-api';
import { addMessageNotification, getNotifications } from '@/lib/notifications';

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

  // Fetch unread message count with localStorage workaround
  useEffect(() => {
    const LAST_READ_KEY = 'mentora_messages_last_read';
    const NOTIFIED_CONVS_KEY = 'mentora_notified_conversations';

    // If user is on messages page, mark as read (save current timestamp)
    if (currentPath === '/messages') {
      localStorage.setItem(LAST_READ_KEY, new Date().toISOString());
      setUnreadCount(0);
      return;
    }

    const loadUnreadCount = async () => {
      const result = await messagingApi.getConversations();
      if (result.success && result.data) {
        const lastReadTime = localStorage.getItem(LAST_READ_KEY);
        const notifiedConvs = JSON.parse(localStorage.getItem(NOTIFIED_CONVS_KEY) || '[]');

        if (lastReadTime) {
          // Only count messages that arrived after last read
          const lastRead = new Date(lastReadTime);
          const unreadConvs = result.data.data.filter(conv => {
            const updatedAt = new Date(conv.updated_at || conv.created_at);
            return updatedAt > lastRead && (conv.unread_count || 0) > 0;
          });

          // Create notifications for new conversations we haven't notified about
          for (const conv of unreadConvs) {
            const convKey = `${conv.id}-${conv.updated_at}`;
            if (!notifiedConvs.includes(convKey) && conv.last_message) {
              // Get sender name from participants or use fallback
              const senderName = conv.participants?.find(p => p.id !== user.id)?.full_name || 'Someone';
              addMessageNotification(senderName, conv.last_message.content || 'New message', conv.id);
              notifiedConvs.push(convKey);
            }
          }

          // Keep only recent notified convs
          const recentNotified = notifiedConvs.slice(-50);
          localStorage.setItem(NOTIFIED_CONVS_KEY, JSON.stringify(recentNotified));

          setUnreadCount(unreadConvs.length > 0 ? unreadConvs.reduce((sum, c) => sum + (c.unread_count || 0), 0) : 0);
        } else {
          // First time - show backend count
          const total = result.data.data.reduce((sum, conv) => sum + (conv.unread_count || 0), 0);
          setUnreadCount(total);
        }
      }
    };
    loadUnreadCount();

    // Refresh unread count every 30 seconds
    const interval = setInterval(loadUnreadCount, 30000);
    return () => clearInterval(interval);
  }, [currentPath, user.id]); // Re-fetch when path changes (e.g., leaving messages page)

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
