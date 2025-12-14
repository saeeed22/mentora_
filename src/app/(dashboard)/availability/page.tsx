'use client';

import { useState, useEffect } from 'react';
import { Calendar, Plus, Settings, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { auth, CurrentUser } from '@/lib/api/auth';
import { useRouter } from 'next/navigation';
import { availability as availabilityApi } from '@/lib/api/availability';
import { toast } from 'sonner';

// Mock availability data
const mockAvailability = {
  timezone: 'Asia/Karachi',
  weeklySchedule: {
    monday: { enabled: true, slots: [{ start: '09:00', end: '12:00' }, { start: '14:00', end: '17:00' }] },
    tuesday: { enabled: true, slots: [{ start: '09:00', end: '12:00' }, { start: '14:00', end: '17:00' }] },
    wednesday: { enabled: true, slots: [{ start: '09:00', end: '12:00' }] },
    thursday: { enabled: true, slots: [{ start: '14:00', end: '17:00' }] },
    friday: { enabled: true, slots: [{ start: '09:00', end: '12:00' }, { start: '14:00', end: '16:00' }] },
    saturday: { enabled: false, slots: [] },
    sunday: { enabled: false, slots: [] },
  },
  blockedDates: ['2024-01-20', '2024-01-21'], // Vacation/unavailable dates
  sessionDuration: 60, // minutes
  bufferTime: 15, // minutes between sessions
  maxSessionsPerDay: 4,
  autoAcceptBookings: true,
};

const timeSlots = Array.from({ length: 24 }, (_, i) => {
  const hour = i.toString().padStart(2, '0');
  return `${hour}:00`;
});

const daysOfWeek = [
  { key: 'monday', label: 'Monday' },
  { key: 'tuesday', label: 'Tuesday' },
  { key: 'wednesday', label: 'Wednesday' },
  { key: 'thursday', label: 'Thursday' },
  { key: 'friday', label: 'Friday' },
  { key: 'saturday', label: 'Saturday' },
  { key: 'sunday', label: 'Sunday' },
];

export default function AvailabilityPage() {
  const router = useRouter();
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [availability, setAvailability] = useState(mockAvailability);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    const currentUser = auth.getCurrentUser();
    if (!currentUser) {
      router.push('/login');
      return;
    }
    if (currentUser.role !== 'mentor') {
      router.push('/home');
      return;
    }
    setUser(currentUser);
    // Load persisted schedule for this mentor
    try {
      const sch = availabilityApi.getSchedule(currentUser.id);
      setAvailability(sch as typeof mockAvailability);
    } catch {
      // keep defaults
    }
  }, [router]);

  const handleDayToggle = (day: string, enabled: boolean) => {
    setAvailability(prev => ({
      ...prev,
      weeklySchedule: {
        ...prev.weeklySchedule,
        [day]: {
          ...prev.weeklySchedule[day as keyof typeof prev.weeklySchedule],
          enabled,
        },
      },
    }));
    setHasChanges(true);
  };

  const addTimeSlot = (day: string) => {
    setAvailability(prev => ({
      ...prev,
      weeklySchedule: {
        ...prev.weeklySchedule,
        [day]: {
          ...prev.weeklySchedule[day as keyof typeof prev.weeklySchedule],
          slots: [
            ...prev.weeklySchedule[day as keyof typeof prev.weeklySchedule].slots,
            { start: '09:00', end: '10:00' },
          ],
        },
      },
    }));
    setHasChanges(true);
  };

  const updateTimeSlot = (day: string, index: number, field: 'start' | 'end', value: string) => {
    setAvailability(prev => ({
      ...prev,
      weeklySchedule: {
        ...prev.weeklySchedule,
        [day]: {
          ...prev.weeklySchedule[day as keyof typeof prev.weeklySchedule],
          slots: prev.weeklySchedule[day as keyof typeof prev.weeklySchedule].slots.map((slot, i) =>
            i === index ? { ...slot, [field]: value } : slot
          ),
        },
      },
    }));
    setHasChanges(true);
  };

  const removeTimeSlot = (day: string, index: number) => {
    setAvailability(prev => ({
      ...prev,
      weeklySchedule: {
        ...prev.weeklySchedule,
        [day]: {
          ...prev.weeklySchedule[day as keyof typeof prev.weeklySchedule],
          slots: prev.weeklySchedule[day as keyof typeof prev.weeklySchedule].slots.filter((_, i) => i !== index),
        },
      },
    }));
    setHasChanges(true);
  };

  const handleSave = () => {
    if (!user) return;
    availabilityApi.saveSchedule(user.id, availability as typeof mockAvailability);
    setHasChanges(false);
    toast.success('Availability saved');
  };

  if (!user || user.role !== 'mentor') {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-brand-dark">Availability</h1>
          <p className="text-gray-600 mt-1">
            Manage your mentoring schedule and availability
          </p>
        </div>
        <div className="flex space-x-3">
          <Button variant="outline">
            <Settings className="w-4 h-4 mr-2" />
            Settings
          </Button>
          <Button
            onClick={handleSave}
            disabled={!hasChanges}
            className="bg-brand hover:bg-brand/90"
          >
            <Save className="w-4 h-4 mr-2" />
            Save Changes
          </Button>
        </div>
      </div>

      {/* General Settings */}
      <Card className="rounded-2xl shadow-sm">
        <CardHeader>
          <CardTitle>General Settings</CardTitle>
          <CardDescription>
            Configure your basic availability preferences
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Label className="text-sm font-medium text-gray-700">Timezone</Label>
              <Select value={availability.timezone} onValueChange={(value) => {
                setAvailability(prev => ({ ...prev, timezone: value }));
                setHasChanges(true);
              }}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="America/Los_Angeles">Pacific Time (PT)</SelectItem>
                  <SelectItem value="America/Denver">Mountain Time (MT)</SelectItem>
                  <SelectItem value="America/Chicago">Central Time (CT)</SelectItem>
                  <SelectItem value="America/New_York">Eastern Time (ET)</SelectItem>
                  <SelectItem value="Asia/Karachi">Pakistan Standard Time (PKT)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-sm font-medium text-gray-700">Session Duration</Label>
              <Select value={availability.sessionDuration.toString()} onValueChange={(value) => {
                setAvailability(prev => ({ ...prev, sessionDuration: parseInt(value) }));
                setHasChanges(true);
              }}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="30">30 minutes</SelectItem>
                  <SelectItem value="45">45 minutes</SelectItem>
                  <SelectItem value="60">60 minutes</SelectItem>
                  <SelectItem value="90">90 minutes</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-sm font-medium text-gray-700">Buffer Time</Label>
              <Select value={availability.bufferTime.toString()} onValueChange={(value) => {
                setAvailability(prev => ({ ...prev, bufferTime: parseInt(value) }));
                setHasChanges(true);
              }}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0">No buffer</SelectItem>
                  <SelectItem value="15">15 minutes</SelectItem>
                  <SelectItem value="30">30 minutes</SelectItem>
                  <SelectItem value="60">60 minutes</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-sm font-medium text-gray-700">Max Sessions Per Day</Label>
              <Select value={availability.maxSessionsPerDay.toString()} onValueChange={(value) => {
                setAvailability(prev => ({ ...prev, maxSessionsPerDay: parseInt(value) }));
                setHasChanges(true);
              }}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1 session</SelectItem>
                  <SelectItem value="2">2 sessions</SelectItem>
                  <SelectItem value="3">3 sessions</SelectItem>
                  <SelectItem value="4">4 sessions</SelectItem>
                  <SelectItem value="5">5 sessions</SelectItem>
                  <SelectItem value="6">6 sessions</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div>
              <Label className="text-sm font-medium text-gray-700">Auto-accept bookings</Label>
              <p className="text-xs text-gray-500 mt-1">
                Automatically accept booking requests within your available hours
              </p>
            </div>
            <Switch
              checked={availability.autoAcceptBookings}
              onCheckedChange={(checked) => {
                setAvailability(prev => ({ ...prev, autoAcceptBookings: checked }));
                setHasChanges(true);
              }}
            />
          </div>
        </CardContent>
      </Card>

      {/* Weekly Schedule */}
      <Card className="rounded-2xl shadow-sm">
        <CardHeader>
          <CardTitle>Weekly Schedule</CardTitle>
          <CardDescription>
            Set your recurring weekly availability
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {daysOfWeek.map((day) => {
            const daySchedule = availability.weeklySchedule[day.key as keyof typeof availability.weeklySchedule];

            return (
              <div key={day.key} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <Switch
                      checked={daySchedule.enabled}
                      onCheckedChange={(checked) => handleDayToggle(day.key, checked)}
                    />
                    <Label className="text-sm font-medium text-gray-700">
                      {day.label}
                    </Label>
                    {daySchedule.enabled && daySchedule.slots.length > 0 && (
                      <Badge variant="secondary" className="text-xs">
                        {daySchedule.slots.length} slot{daySchedule.slots.length > 1 ? 's' : ''}
                      </Badge>
                    )}
                  </div>
                  {daySchedule.enabled && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => addTimeSlot(day.key)}
                    >
                      <Plus className="w-4 h-4 mr-1" />
                      Add Slot
                    </Button>
                  )}
                </div>

                {daySchedule.enabled && (
                  <div className="space-y-2">
                    {daySchedule.slots.length === 0 ? (
                      <p className="text-sm text-gray-500 text-center py-4">
                        No time slots set. Click &quot;Add Slot&quot; to add availability.
                      </p>
                    ) : (
                      daySchedule.slots.map((slot, index) => (
                        <div key={index} className="flex items-center space-x-2">
                          <Select
                            value={slot.start}
                            onValueChange={(value) => updateTimeSlot(day.key, index, 'start', value)}
                          >
                            <SelectTrigger className="w-24">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {timeSlots.map((time) => (
                                <SelectItem key={time} value={time}>
                                  {time}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <span className="text-gray-500">to</span>
                          <Select
                            value={slot.end}
                            onValueChange={(value) => updateTimeSlot(day.key, index, 'end', value)}
                          >
                            <SelectTrigger className="w-24">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {timeSlots.map((time) => (
                                <SelectItem key={time} value={time}>
                                  {time}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => removeTimeSlot(day.key, index)}
                            className="text-red-600 hover:text-red-700"
                          >
                            Remove
                          </Button>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </CardContent>
      </Card>

      {/* Calendar Integration */}
      <Card className="rounded-2xl shadow-sm">
        <CardHeader>
          <CardTitle>Calendar Integration</CardTitle>
          <CardDescription>
            Connect your external calendars to sync availability
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="border-2 border-dashed border-gray-200 hover:border-gray-300 transition-colors">
              <CardContent className="p-6 text-center">
                <Calendar className="mx-auto h-8 w-8 text-gray-400 mb-3" />
                <h3 className="font-medium text-gray-900 mb-1">Google Calendar</h3>
                <p className="text-sm text-gray-500 mb-3">
                  Sync with your Google Calendar
                </p>
                <Button variant="outline" size="sm">
                  Connect
                </Button>
              </CardContent>
            </Card>

            <Card className="border-2 border-dashed border-gray-200 hover:border-gray-300 transition-colors">
              <CardContent className="p-6 text-center">
                <Calendar className="mx-auto h-8 w-8 text-gray-400 mb-3" />
                <h3 className="font-medium text-gray-900 mb-1">Outlook Calendar</h3>
                <p className="text-sm text-gray-500 mb-3">
                  Sync with your Outlook Calendar
                </p>
                <Button variant="outline" size="sm">
                  Connect
                </Button>
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>

      {/* Quick Stats */}
      <Card className="rounded-2xl shadow-sm bg-blue-50 border-blue-200">
        <CardHeader>
          <CardTitle className="text-blue-800">Availability Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div className="text-center">
              <p className="text-2xl font-bold text-blue-900">
                {Object.values(availability.weeklySchedule).filter(day => day.enabled).length}
              </p>
              <p className="text-blue-700">Active days</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-blue-900">
                {Object.values(availability.weeklySchedule)
                  .reduce((total, day) => total + day.slots.length, 0)}
              </p>
              <p className="text-blue-700">Total time slots</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-blue-900">
                {availability.sessionDuration}m
              </p>
              <p className="text-blue-700">Session duration</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
