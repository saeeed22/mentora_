'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
    Home,
    Search,
    MessageCircle,
    Calendar,
    User,
} from 'lucide-react';
import { CurrentUser } from '@/lib/api/auth';
import { useEffect, useState } from 'react';

interface BottomNavProps {
    user: CurrentUser;
    currentPath: string;
}

interface NavItem {
    name: string;
    href: string;
    icon: React.ComponentType<{ className?: string }>;
    badge?: number;
}

export function BottomNav({ user, currentPath }: BottomNavProps) {
    const [unreadCount, setUnreadCount] = useState(0);

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
    ];

    return (
        <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 shadow-lg">
            <div className="flex items-center justify-around h-16 px-2">
                {navItems.map((item) => {
                    const isActive = currentPath === item.href;
                    const Icon = item.icon;

                    return (
                        <Link
                            key={item.name}
                            href={item.href}
                            className={`
                flex flex-col items-center justify-center flex-1 h-full px-1 transition-colors relative
                ${isActive
                                    ? 'text-brand'
                                    : 'text-gray-500 hover:text-gray-900'
                                }
              `}
                        >
                            <div className="relative">
                                <Icon className={`${isActive ? 'text-brand' : 'text-gray-400'} h-5 w-5 sm:h-6 sm:w-6`} />
                                {item.badge && item.badge > 0 && (
                                    <span className="absolute -top-1 -right-1 h-4 w-4 bg-red-500 rounded-full border border-white flex items-center justify-center">
                                        <span className="text-[9px] text-white font-bold">
                                            {item.badge > 9 ? '9+' : item.badge}
                                        </span>
                                    </span>
                                )}
                            </div>
                            <span className={`text-[10px] sm:text-xs font-medium mt-0.5 ${isActive ? 'text-brand' : 'text-gray-600'}`}>
                                {item.name}
                            </span>
                        </Link>
                    );
                })}
            </div>
        </nav>
    );
}
