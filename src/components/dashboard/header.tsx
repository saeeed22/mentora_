'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Bell, Calendar, X, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { CurrentUser } from '@/lib/api/auth';
import {
  Notification,
  getNotifications,
  markAsRead,
  markAllAsRead,
  formatRelativeTime
} from '@/lib/notifications';

interface HeaderProps {
  user: CurrentUser;
}

export function Header({ user }: HeaderProps) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showAllNotifications, setShowAllNotifications] = useState(false);

  // Load notifications and refresh periodically
  const loadNotifications = useCallback(() => {
    const notifs = getNotifications();
    // Update relative times
    const updated = notifs.map(n => ({
      ...n,
      time: formatRelativeTime(n.createdAt),
    }));
    setNotifications(updated);
  }, []);

  useEffect(() => {
    loadNotifications();
    // Refresh every 30 seconds
    const interval = setInterval(loadNotifications, 30000);
    return () => clearInterval(interval);
  }, [loadNotifications]);

  const handleMarkAsRead = (notificationId: string) => {
    markAsRead(notificationId);
    loadNotifications();
  };

  const handleMarkAllAsRead = () => {
    markAllAsRead();
    loadNotifications();
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  const [logoSrc, setLogoSrc] = useState('/logos/logo.svg')

  return (
    <header className="bg-white border-b border-gray-200 px-6 py-4">
      <div className="flex items-center justify-between">
        {/* Branding */}
        <Link href="/" className="flex items-center gap-2 shrink-0">
          <Image
            src={logoSrc}
            alt="Mentora Logo"
            width={60}
            height={60}
            className="object-contain"
            onError={() => setLogoSrc('/logos/logo.png')}
          />
        </Link>

        {/* Right Section */}
        <div className="flex items-center space-x-4 ml-auto">
          {/* Book Session Button - Only for mentees */}
          {user.role === 'mentee' && (
            <Button className="bg-brand hover:bg-brand/90" asChild aria-label="Book a session">
              <Link href="/explore">
                <Calendar className="w-4 h-4 mr-2" />
                Book Session
              </Link>
            </Button>
          )}

          {/* Notifications */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="relative p-2" aria-label="Notifications">
                <Bell className="h-5 w-5" />
                {unreadCount > 0 && (
                  <Badge
                    variant="destructive"
                    className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
                  >
                    {unreadCount}
                  </Badge>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80">
              <DropdownMenuLabel className="flex items-center justify-between">
                <span>Notifications</span>
                {unreadCount > 0 && (
                  <Badge variant="secondary" className="text-xs">
                    {unreadCount} new
                  </Badge>
                )}
              </DropdownMenuLabel>
              <DropdownMenuSeparator />

              {notifications.length === 0 ? (
                <div className="p-4 text-center text-gray-500 text-sm">
                  No notifications yet
                </div>
              ) : (
                <div className="max-h-96 overflow-y-auto">
                  {notifications.slice(0, 5).map((notification) => (
                    <DropdownMenuItem
                      key={notification.id}
                      className="p-4 cursor-pointer hover:bg-gray-50"
                      onClick={() => {
                        handleMarkAsRead(notification.id);
                        if (notification.link) {
                          window.location.href = notification.link;
                        }
                      }}
                    >
                      <div className="flex items-start space-x-3 w-full">
                        <div className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${!notification.read ? 'bg-brand' : 'bg-gray-300'
                          }`} />
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm ${!notification.read ? 'font-medium text-gray-900' : 'text-gray-700'
                            }`}>
                            {notification.title}
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            {notification.description}
                          </p>
                          <p className="text-xs text-gray-400 mt-1">
                            {notification.time}
                          </p>
                        </div>
                      </div>
                    </DropdownMenuItem>
                  ))}
                </div>
              )}

              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-center text-brand hover:text-brand/90 cursor-pointer"
                onClick={() => setShowAllNotifications(true)}
              >
                <span className="w-full text-sm">View all notifications</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* All Notifications Dialog */}
      <Dialog open={showAllNotifications} onOpenChange={setShowAllNotifications}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="text-2xl">All Notifications</DialogTitle>
            <DialogDescription>
              Stay updated with your mentoring activities
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto pr-2">
            <div className="space-y-2">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`p-4 rounded-lg border transition-colors ${!notification.read
                    ? 'bg-brand-light/5 border-brand-light/30'
                    : 'bg-gray-50 border-gray-200'
                    } hover:bg-gray-100`}
                >
                  <div className="flex items-start space-x-3">
                    <div className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${!notification.read ? 'bg-brand' : 'bg-gray-300'
                      }`} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p className={`text-sm ${!notification.read ? 'font-semibold text-gray-900' : 'font-medium text-gray-700'
                          }`}>
                          {notification.title}
                        </p>
                        <span className="text-xs text-gray-400 whitespace-nowrap">
                          {notification.time}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">
                        {notification.description}
                      </p>
                      <div className="flex items-center gap-2 mt-2">
                        <Badge variant="outline" className="text-xs">
                          {notification.type}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between pt-4 border-t">
            <Button
              variant="outline"
              size="sm"
              onClick={handleMarkAllAsRead}
              disabled={unreadCount === 0}
            >
              <Check className="w-4 h-4 mr-2" />
              Mark all as read
            </Button>
            <Button
              variant="default"
              size="sm"
              onClick={() => setShowAllNotifications(false)}
              className="bg-brand hover:bg-brand/90"
            >
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </header>
  );
}
