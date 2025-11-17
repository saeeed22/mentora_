'use client';

import { useEffect, useMemo, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Bell, Clock } from 'lucide-react';
import Link from 'next/link';
import { bookings } from '@/lib/api/bookings';
import { auth } from '@/lib/api/auth';
import { mentors } from '@/lib/api/mentors';
import { mockUsers } from '@/lib/mock-auth';
import { availability } from '@/lib/api/availability';
import type { Booking, AvailabilitySlot } from '@/lib/types';

interface CalendarWidgetProps {
  userRole: 'mentor' | 'mentee';
}

export function CalendarWidget({ userRole }: CalendarWidgetProps) {
  const [currentWeekStart, setCurrentWeekStart] = useState(new Date());
  const [userBookings, setUserBookings] = useState<Booking[]>([]);
  const [availabilitySlots, setAvailabilitySlots] = useState<AvailabilitySlot[]>([]);

  useEffect(() => {
    const currentUser = auth.getCurrentUser();
    if (!currentUser) return;
    const list = bookings.listForUser(currentUser.id, currentUser.role);
    setUserBookings(list);

    // For mentors, load their availability schedule
    if (currentUser.role === 'mentor') {
      const slots = availability.getGeneratedSlots(currentUser.id, 28);
      setAvailabilitySlots(slots);
    }

    // Auto-jump to the week of the next upcoming booking (confirmed/pending)
    const upcoming = list
      .filter(b => b.status === 'confirmed' || b.status === 'pending')
      .filter(b => new Date(b.datetime).getTime() >= Date.now())
      .sort((a, b) => new Date(a.datetime).getTime() - new Date(b.datetime).getTime());
    if (upcoming.length > 0) {
      const next = new Date(upcoming[0].datetime);
      const start = new Date(next);
      const dow = start.getDay();
      start.setDate(start.getDate() - dow); // set to Sunday
      start.setHours(0, 0, 0, 0);
      setCurrentWeekStart(start);
    }
  }, []);

  // Get the current week's dates
  const getWeekDates = () => {
    const dates = [];
    const start = new Date(currentWeekStart);
    
    // Get to the start of the week (Sunday)
    const dayOfWeek = start.getDay();
    start.setDate(start.getDate() - dayOfWeek);
    
    for (let i = 0; i < 7; i++) {
      const date = new Date(start);
      date.setDate(start.getDate() + i);
      dates.push(date);
    }
    
    return dates;
  };

  const weekDates = getWeekDates();

  const localDateKey = (d: Date) => {
    const y = d.getFullYear();
    const m = (d.getMonth() + 1).toString().padStart(2, '0');
    const day = d.getDate().toString().padStart(2, '0');
    return `${y}-${m}-${day}`;
  };

  const bookingsByDate = useMemo(() => {
    const map = new Map<string, Booking[]>();
    const start = new Date(weekDates[0]);
    const end = new Date(weekDates[6]);
    end.setHours(23, 59, 59, 999);
    for (const b of userBookings) {
      const d = new Date(b.datetime);
      const isInThisWeek = d >= start && d <= end;
      const isActive = b.status === 'confirmed' || b.status === 'pending';
      if (isInThisWeek && isActive) {
        const key = localDateKey(d);
        const arr = map.get(key) ?? [];
        arr.push(b);
        map.set(key, arr);
      }
    }
    return map;
  }, [userBookings, weekDates]);

  const availabilityByDate = useMemo(() => {
    const map = new Map<string, AvailabilitySlot>();
    const start = new Date(weekDates[0]);
    const end = new Date(weekDates[6]);
    end.setHours(23, 59, 59, 999);
    for (const slot of availabilitySlots) {
      const d = new Date(slot.date);
      const isInThisWeek = d >= start && d <= end;
      if (isInThisWeek && slot.slots.length > 0) {
        map.set(slot.date, slot);
      }
    }
    return map;
  }, [availabilitySlots, weekDates]);
  
  const previousWeek = () => {
    const newDate = new Date(currentWeekStart);
    newDate.setDate(newDate.getDate() - 7);
    setCurrentWeekStart(newDate);
  };

  const nextWeek = () => {
    const newDate = new Date(currentWeekStart);
    newDate.setDate(newDate.getDate() + 7);
    setCurrentWeekStart(newDate);
  };

  const formatDateRange = () => {
    const firstDate = weekDates[0];
    const lastDate = weekDates[6];
    
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
    return `${firstDate.getDate()} ${monthNames[firstDate.getMonth()]} - ${lastDate.getDate()} ${monthNames[lastDate.getMonth()]}`;
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return date.getDate() === today.getDate() &&
           date.getMonth() === today.getMonth() &&
           date.getFullYear() === today.getFullYear();
  };

  const dayNames = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];

  return (
    <Card className="rounded-2xl shadow-sm border border-gray-200">
      <CardContent className="p-6">
        {/* Week Navigation */}
        <div className="flex items-center justify-between mb-6">
          <Button variant="ghost" size="sm" onClick={previousWeek} className="h-8 w-8 p-0" aria-label="Previous week">
            <ChevronLeft className="h-4 w-4" />
          </Button>
          
          <h3 className="text-base font-bold text-brand-dark">
            {formatDateRange()}
          </h3>
          
          <Button variant="ghost" size="sm" onClick={nextWeek} className="h-8 w-8 p-0" aria-label="Next week">
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        {/* Week Days */}
        <div className="grid grid-cols-7 gap-2 mb-6">
          {weekDates.map((date, index) => {
            const today = isToday(date);
            const dateKey = localDateKey(date);
            const hasBookings = bookingsByDate.get(dateKey);
            const hasAvailability = userRole === 'mentor' && availabilityByDate.get(dateKey);
            
            return (
              <div key={index} className="text-center">
                <div className="text-xs font-medium text-gray-500 mb-2">
                  {dayNames[index]}
                </div>
                <div
                  className={`
                    mx-auto w-10 h-10 flex items-center justify-center rounded-lg
                    text-base font-semibold transition-colors relative
                    ${today 
                      ? 'bg-gray-900 text-white' 
                      : (hasBookings ? 'bg-brand-light/10 text-brand border border-brand-light/30' : 
                         hasAvailability ? 'bg-green-50 text-green-700 border border-green-200' : 
                         'text-gray-700 hover:bg-gray-100')
                    }
                  `}
                >
                  {date.getDate()}
                  {hasAvailability && !hasBookings && (
                    <div className="absolute -top-1 -right-1 w-2 h-2 bg-green-500 rounded-full border border-white" />
                  )}
                </div>
                {hasBookings && (
                  <div className="mt-1 h-1 w-1 mx-auto rounded-full bg-brand" />
                )}
                {hasAvailability && !hasBookings && (
                  <div className="mt-1 flex justify-center gap-0.5">
                    <div className="h-0.5 w-0.5 rounded-full bg-green-500" />
                    <div className="h-0.5 w-0.5 rounded-full bg-green-500" />
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Mentor Availability Summary */}
        {userRole === 'mentor' && availabilitySlots.length > 0 && (
          <div className="mb-4">
            <div className="bg-green-50 rounded-xl p-4 border border-green-200">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <Clock className="h-5 w-5 text-green-700" />
                </div>
                <div className="flex-1">
                  <h4 className="text-sm font-semibold text-green-900 mb-1">Availability Active</h4>
                  <p className="text-xs text-green-700">
                    {availabilitySlots.reduce((total, slot) => total + slot.slots.length, 0)} time slots available this month
                  </p>
                  <Link 
                    href="/availability" 
                    className="text-xs text-green-800 hover:text-green-900 font-medium inline-flex items-center mt-2"
                  >
                    Manage availability →
                  </Link>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Upcoming in this week */}
        {userBookings.filter(b => {
          const d = new Date(b.datetime);
          const active = b.status === 'confirmed' || b.status === 'pending';
          return active && d >= weekDates[0] && d <= new Date(weekDates[6].getFullYear(), weekDates[6].getMonth(), weekDates[6].getDate(), 23, 59, 59, 999);
        }).length === 0 ? (
          <div className="bg-gray-50 rounded-xl p-6 mb-4">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-brand-light/10 rounded-lg">
                <CalendarIcon className="h-6 w-6 text-brand" />
              </div>
              <div className="flex-1">
                <p className="text-gray-600 mb-2">You have no sessions this week</p>
                <Link 
                  href={userRole === 'mentor' ? '/availability' : '/explore'} 
                  className="text-brand hover:text-brand/90 font-semibold"
                >
                  {userRole === 'mentor' ? 'Set availability' : 'Book a session'}
                </Link>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-3 mb-4">
            {Array.from(bookingsByDate.entries())
              .sort(([a], [b]) => a.localeCompare(b))
              .slice(0, 3)
              .map(([dateKey, list]) => {
                const d = new Date(dateKey);
                const label = d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
                return (
                  <div key={dateKey} className="p-3 bg-gray-50 rounded-lg border border-gray-100">
                    <div className="text-xs text-gray-500 mb-2">{label}</div>
                    <ul className="space-y-2">
                      {list.slice(0,2).map((b) => {
                        const isMentor = userRole === 'mentor';
                        const otherId = isMentor ? b.menteeId : b.mentorId;
                        const otherUser = isMentor ? mockUsers.find(u => u.id === otherId) : mentors.getById(b.mentorId);
                        const name = isMentor ? (otherUser?.name ?? 'Unknown') : (otherUser?.name ?? 'Unknown');
                        const time = new Date(b.datetime).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
                        return (
                          <li key={b.id} className="flex items-center justify-between text-sm">
                            <span className="text-gray-700 truncate">{time} • {name}</span>
                            <span className="text-gray-500 truncate">{b.sessionType}</span>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                );
              })}
          </div>
        )}

        {/* Calendar Legend for Mentors */}
        {userRole === 'mentor' && (
          <div className="mb-4 p-3 bg-gray-50 rounded-lg border border-gray-100">
            <div className="text-xs font-medium text-gray-600 mb-2">Calendar Legend:</div>
            <div className="flex flex-wrap gap-3 text-xs">
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 bg-brand-light/10 border border-brand-light/30 rounded"></div>
                <span className="text-gray-600">Booked</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 bg-green-50 border border-green-200 rounded relative">
                  <div className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 bg-green-500 rounded-full border border-white"></div>
                </div>
                <span className="text-gray-600">Available</span>
              </div>
            </div>
          </div>
        )}

        {/* Notification Banner */}
        <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg border border-yellow-100">
          <div className="flex items-center gap-2 text-sm text-gray-700">
            <Bell className="h-4 w-4 text-gray-600" />
            <span>Get notified for your sessions</span>
          </div>
          <button className="text-sm font-semibold text-brand hover:text-brand/90">
            Allow
          </button>
        </div>
      </CardContent>
    </Card>
  );
}
