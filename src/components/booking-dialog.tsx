'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { bookingsApi } from '@/lib/api/bookings-api';
import { auth } from '@/lib/api/auth';
import { toast } from 'sonner';
import { Calendar, Clock, Video } from 'lucide-react';
import { addBookingNotification } from '@/lib/notifications';

interface BookingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mentorId: string;
  mentorName: string;
  selectedDate: string | null;
  selectedTimeSlot: string | null;
}

const SESSION_TYPES = [
  'One-on-One Mentoring',
  'Career Guidance',
  'Resume Review',
  'Portfolio Review',
  'Interview Preparation',
  'Technical Discussion',
  'Mock Interview',
];

export function BookingDialog({
  open,
  onOpenChange,
  mentorId,
  mentorName,
  selectedDate,
  selectedTimeSlot,
}: BookingDialogProps) {
  const router = useRouter();
  const [sessionType, setSessionType] = useState(SESSION_TYPES[0]);
  const [topic, setTopic] = useState('');
  const [goals, setGoals] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    const currentUser = auth.getCurrentUser();
    if (!currentUser) {
      toast.error('Please log in to book a session');
      router.push('/login');
      return;
    }

    if (currentUser.role === 'mentor') {
      toast.error('Mentors cannot book sessions with other mentors');
      return;
    }

    if (!selectedDate || !selectedTimeSlot) {
      toast.error('Please select a date and time slot');
      return;
    }

    if (!topic.trim()) {
      toast.error('Please provide a session topic');
      return;
    }

    setIsSubmitting(true);

    try {
      // Build ISO datetime from date + time slot
      const [time, period] = selectedTimeSlot.split(' '); // "9:00 AM" => ["9:00", "AM"]
      const timeParts = time.split(':').map(Number);
      let hours = timeParts[0];
      const minutes = timeParts[1];
      if (period === 'PM' && hours !== 12) hours += 12;
      if (period === 'AM' && hours === 12) hours = 0;

      const datetime = new Date(`${selectedDate}T${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:00`);

      const requestData = {
        mentor_id: mentorId,
        start_at: datetime.toISOString(),
        duration_minutes: 60,
        notes: `${sessionType}: ${topic.trim()}${goals.trim() ? '\n\nGoals: ' + goals.trim() : ''}`,
      };
      console.log('[Booking] Request data:', requestData);

      // Use real backend API
      const result = await bookingsApi.createBooking(requestData);
      console.log('[Booking] API result:', result);

      if (result.success) {
        // Create booking notification
        const formattedDate = selectedDate ? new Date(selectedDate).toLocaleDateString('en-US', {
          weekday: 'long',
          month: 'short',
          day: 'numeric',
        }) : '';
        addBookingNotification(
          `Session booked with ${mentorName}`,
          `${formattedDate} at ${selectedTimeSlot} - ${sessionType}`
        );

        toast.success('Session booked successfully!', {
          description: `Your session with ${mentorName} is confirmed.`,
          action: {
            label: 'View Booking',
            onClick: () => router.push('/bookings'),
          },
        });

        onOpenChange(false);

        // Small delay before redirecting
        setTimeout(() => {
          router.push('/bookings');
        }, 1000);
      } else {
        toast.error('Failed to create booking', {
          description: result.error || 'Please try again later.',
        });
      }
    } catch (error) {
      console.error('Booking error:', error);
      toast.error('Failed to create booking', {
        description: 'Please try again later.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Book a Session with {mentorName}</DialogTitle>
          <DialogDescription>
            Complete the details below to confirm your mentoring session.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Selected Date & Time */}
          <div className="space-y-3 p-4 bg-brand-light/10 rounded-lg border border-brand-light/30">
            <div className="flex items-center text-sm text-gray-700">
              <Calendar className="h-4 w-4 mr-2 text-brand" />
              <span className="font-medium">{selectedDate ? formatDate(selectedDate) : 'No date selected'}</span>
            </div>
            <div className="flex items-center text-sm text-gray-700">
              <Clock className="h-4 w-4 mr-2 text-brand" />
              <span className="font-medium">{selectedTimeSlot || 'No time selected'}</span>
            </div>
            <div className="flex items-center text-sm text-gray-700">
              <Video className="h-4 w-4 mr-2 text-brand" />
              <span className="font-medium">60 minutes via video call</span>
            </div>
          </div>

          {/* Session Type */}
          <div className="space-y-2">
            <Label htmlFor="session-type">Session Type</Label>
            <Select value={sessionType} onValueChange={setSessionType}>
              <SelectTrigger id="session-type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SESSION_TYPES.map((type) => (
                  <SelectItem key={type} value={type}>
                    {type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Topic */}
          <div className="space-y-2">
            <Label htmlFor="topic">
              Session Topic <span className="text-red-500">*</span>
            </Label>
            <Textarea
              id="topic"
              placeholder="E.g., Career transition to product management"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              rows={2}
              maxLength={200}
            />
            <p className="text-xs text-gray-500">{topic.length}/200 characters</p>
          </div>

          {/* Goals */}
          <div className="space-y-2">
            <Label htmlFor="goals">Session Goals (Optional)</Label>
            <Textarea
              id="goals"
              placeholder="What do you hope to achieve from this session?"
              value={goals}
              onChange={(e) => setGoals(e.target.value)}
              rows={3}
              maxLength={500}
            />
            <p className="text-xs text-gray-500">{goals.length}/500 characters</p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end space-x-3">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting || !selectedDate || !selectedTimeSlot || !topic.trim()}
            className="bg-brand hover:bg-brand/90"
          >
            {isSubmitting ? 'Booking...' : 'Confirm Booking'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

