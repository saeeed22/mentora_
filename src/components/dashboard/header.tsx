'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Bell, Calendar, Search, X } from 'lucide-react';
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
import { User } from '@/lib/mock-auth';

interface HeaderProps {
  user: User;
}

// Mock notifications data
const mockNotifications = [
  {
    id: '1',
    title: 'New booking request',
    description: 'Sarah Johnson wants to book a session with you',
    time: '5 minutes ago',
    read: false,
    type: 'booking',
  },
  {
    id: '2',
    title: 'Session reminder',
    description: 'You have a session with Alex Chen in 30 minutes',
    time: '25 minutes ago',
    read: false,
    type: 'reminder',
  },
  {
    id: '3',
    title: 'Profile viewed',
    description: '3 people viewed your profile today',
    time: '2 hours ago',
    read: true,
    type: 'profile',
  },
];

export function Header({ user }: HeaderProps) {
  const [notifications] = useState(mockNotifications);
  const [showAllNotifications, setShowAllNotifications] = useState(false);
  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <header className="bg-white border-b border-gray-200 px-6 py-4">
      <div className="flex items-center justify-between">
        {/* Branding */}
        <div className="flex items-center gap-2 shrink-0">
          <Image 
            src="/logos/logo.png" 
            alt="Mentora Logo" 
            width={60} 
            height={60}
            className="object-contain"
          />
        </div>

        {/* Centered Search */}
        <div className="flex-1 flex justify-center px-4">
          <div className="relative w-full max-w-xl">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              type="search"
              placeholder="Search mentors, sessions, or topics..."
              className="pl-10 pr-4 py-2 w-full bg-gray-50 border-gray-200 focus:bg-white"
            />
          </div>
        </div>

        {/* Right Section */}
        <div className="flex items-center space-x-4">
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
                  {notifications.map((notification) => (
                    <DropdownMenuItem 
                      key={notification.id}
                      className="p-4 cursor-pointer hover:bg-gray-50"
                    >
                      <div className="flex items-start space-x-3 w-full">
                        <div className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${
                          !notification.read ? 'bg-brand' : 'bg-gray-300'
                        }`} />
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm ${
                            !notification.read ? 'font-medium text-gray-900' : 'text-gray-700'
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
                  className={`p-4 rounded-lg border transition-colors ${
                    !notification.read 
                      ? 'bg-brand-light/5 border-brand-light/30' 
                      : 'bg-gray-50 border-gray-200'
                  } hover:bg-gray-100`}
                >
                  <div className="flex items-start space-x-3">
                    <div className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${
                      !notification.read ? 'bg-brand' : 'bg-gray-300'
                    }`} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p className={`text-sm ${
                          !notification.read ? 'font-semibold text-gray-900' : 'font-medium text-gray-700'
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
              onClick={() => {
                // Mark all as read functionality
                console.log('Mark all as read');
              }}
            >
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
