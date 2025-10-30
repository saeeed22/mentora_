'use client';

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Bell } from 'lucide-react';
import Link from 'next/link';

interface CalendarWidgetProps {
  userRole: 'mentor' | 'mentee';
}

export function CalendarWidget({ userRole }: CalendarWidgetProps) {
  const [currentWeekStart, setCurrentWeekStart] = useState(new Date());

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
          <Button variant="ghost" size="sm" onClick={previousWeek} className="h-8 w-8 p-0">
            <ChevronLeft className="h-4 w-4" />
          </Button>
          
          <h3 className="text-base font-bold text-gray-900">
            {formatDateRange()}
          </h3>
          
          <Button variant="ghost" size="sm" onClick={nextWeek} className="h-8 w-8 p-0">
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        {/* Week Days */}
        <div className="grid grid-cols-7 gap-2 mb-6">
          {weekDates.map((date, index) => {
            const today = isToday(date);
            
            return (
              <div key={index} className="text-center">
                <div className="text-xs font-medium text-gray-500 mb-2">
                  {dayNames[index]}
                </div>
                <div
                  className={`
                    mx-auto w-10 h-10 flex items-center justify-center rounded-lg
                    text-base font-semibold transition-colors
                    ${today 
                      ? 'bg-gray-900 text-white' 
                      : 'text-gray-700 hover:bg-gray-100'
                    }
                  `}
                >
                  {date.getDate()}
                </div>
              </div>
            );
          })}
        </div>

        {/* Empty State */}
        <div className="bg-gray-50 rounded-xl p-6 mb-4">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-teal-50 rounded-lg">
              <CalendarIcon className="h-6 w-6 text-teal-600" />
            </div>
            <div className="flex-1">
              <p className="text-gray-600 mb-2">You have no upcoming sessions</p>
              <Link 
                href="/explore" 
                className="text-teal-600 hover:text-teal-700 font-semibold"
              >
                Book a session
              </Link>
            </div>
          </div>
        </div>

        {/* Notification Banner */}
        <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg border border-yellow-100">
          <div className="flex items-center gap-2 text-sm text-gray-700">
            <Bell className="h-4 w-4 text-gray-600" />
            <span>Get notified for your sessions</span>
          </div>
          <button className="text-sm font-semibold text-teal-600 hover:text-teal-700">
            Allow
          </button>
        </div>
      </CardContent>
    </Card>
  );
}
