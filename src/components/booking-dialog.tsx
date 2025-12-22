'use client';

import { useState, useEffect } from 'react';
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
import { mentorsApi } from '@/lib/api/mentors-api';
import { paymentsApi } from '@/lib/api/payments-api';
import { auth } from '@/lib/api/auth';
import { toast } from 'sonner';
import { Calendar, Clock, Video, Wallet } from 'lucide-react';
import { addBookingNotification } from '@/lib/notifications';
import { convertToUTCISO } from '@/lib/datetime-utils';

interface BookingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mentorId: string;
  mentorName: string;
  selectedDate: string | null;
  selectedTimeSlot: string | null;
  selectedSlotStartTime: string | null; // Original ISO timestamp from backend
  selectedSlotIsGroup?: boolean | null;
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
  selectedSlotStartTime,
  selectedSlotIsGroup,
}: BookingDialogProps) {
  const router = useRouter();
  const [sessionType, setSessionType] = useState(SESSION_TYPES[0]);
  const [topic, setTopic] = useState('');
  const [goals, setGoals] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [mentorGroupEnabled, setMentorGroupEnabled] = useState(false);
  const [mentorGroupMax, setMentorGroupMax] = useState(1);
  const [groupParticipants, setGroupParticipants] = useState(1);
  const [paymentGateway, setPaymentGateway] = useState<'jazzcash' | 'easypaisa' | 'payfast_pk'>('jazzcash');
  const [groupPricePKR, setGroupPricePKR] = useState<number | null>(null);

  // Load mentor group session settings
  useEffect(() => {
    const loadMentor = async () => {
      const res = await mentorsApi.getMentorById(mentorId);
      if (res.success && res.data) {
        const mp = res.data.mentor_profile;
        const enabled = !!mp.group_enabled;
        setMentorGroupEnabled(enabled);
        setMentorGroupMax(mp.group_max_participants ?? 1);
        setGroupPricePKR(mp.group_price_per_session ?? null);
        // ensure participants within range
        setGroupParticipants(Math.min(groupParticipants, mp.group_max_participants ?? 1));
      }
    };
    loadMentor();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mentorId]);

  const slotAllowsGroup = !!selectedSlotIsGroup && mentorGroupEnabled;
  useEffect(() => {
    if (!slotAllowsGroup) {
      setGroupParticipants(1);
    }
  }, [slotAllowsGroup]);

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
      // Use the original ISO timestamp from backend if available
      let startAt: string;
      if (selectedSlotStartTime) {
        startAt = selectedSlotStartTime;
      } else {
        // Fallback: Convert date + time slot to UTC ISO string
        startAt = convertToUTCISO(selectedDate, selectedTimeSlot);
        console.log('[Booking] Converted datetime:', {
          selectedDate,
          selectedTimeSlot,
          resultISO: startAt
        });
      }

      const requestData = {
        mentor_id: mentorId,
        start_at: startAt,
        duration_minutes: 60,
        notes: `${sessionType}: ${topic.trim()}${goals.trim() ? '\n\nGoals: ' + goals.trim() : ''}`,
      };
      console.log('[Booking] Request data:', requestData);

      // Use real backend API
      const result = await bookingsApi.createBooking(requestData);
      console.log('[Booking] API result:', result);

      if (result.success && result.data) {
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

        // If group is enabled and participants > 1, initiate payment
        const bookingId = result.data.id;
        const participants = slotAllowsGroup ? Math.max(1, groupParticipants) : 1;

        // Compute amount (PKR)
        let amountPKR = 0;
        if (slotAllowsGroup && groupPricePKR) {
          amountPKR = groupPricePKR * participants;
        }

        if (amountPKR > 0) {
          const returnUrl = `${window.location.origin}/payments/callback`;
          const cancelUrl = `${window.location.origin}/bookings`;
          const payRes = await paymentsApi.createPaymentLink({
            booking_id: bookingId,
            amount_pkr: amountPKR,
            description: `Mentoring session with ${mentorName} (${participants} attendee${participants>1?'s':''})`,
            gateway: paymentGateway,
            return_url: returnUrl,
            cancel_url: cancelUrl,
            metadata: { participants },
          });

          if (payRes.success) {
            if (payRes.data) {
              toast.success('Redirecting to payment...', { description: `Amount: PKR ${amountPKR}` });
              onOpenChange(false);
              window.location.href = payRes.data.payment_url;
              return;
            } else {
              toast.error('Failed to initiate payment', { description: 'Please try again later.' });
            }
          } else {
            toast.error('Failed to initiate payment', { description: payRes.error || 'Please try again later.' });
          }
        }

        // Fallback: no payment required, just close and navigate
        toast.success('Session booked successfully!', {
          description: `Your session with ${mentorName} is confirmed.`,
          action: {
            label: 'View Booking',
            onClick: () => router.push('/bookings'),
          },
        });
        onOpenChange(false);
        setTimeout(() => { router.push('/bookings'); }, 1000);
      } else {
        const errMsg = !result.success ? (result as any).error || 'Please try again later.' : 'Please try again later.';
        toast.error('Failed to create booking', {
          description: errMsg,
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

          {/* Group session options */}
          {slotAllowsGroup && (
            <div className="space-y-2">
              <Label htmlFor="group-count">Attendees (including you)</Label>
              <Select value={groupParticipants.toString()} onValueChange={(v) => setGroupParticipants(parseInt(v))}>
                <SelectTrigger id="group-count">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: mentorGroupMax }, (_, i) => i + 1).map((n) => (
                    <SelectItem key={n} value={n.toString()}>{n}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {groupPricePKR && (
                <div className="flex items-center text-sm text-gray-700 mt-2">
                  <Wallet className="h-4 w-4 mr-2 text-brand" />
                  <span className="font-medium">Estimated total: PKR {groupPricePKR * Math.max(1, groupParticipants)}</span>
                </div>
              )}
            </div>
          )}

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
        <div className="flex justify-between items-center space-x-3">
          {/* Payment gateway */}
          {slotAllowsGroup && groupPricePKR && (
            <div className="w-1/2">
              <Label htmlFor="gateway">Payment Method</Label>
              <Select value={paymentGateway} onValueChange={(v) => setPaymentGateway(v as any)}>
                <SelectTrigger id="gateway">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="jazzcash">JazzCash</SelectItem>
                  <SelectItem value="easypaisa">Easypaisa</SelectItem>
                  <SelectItem value="payfast_pk">PayFast PK</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="flex-1 flex justify-end space-x-3">
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
        </div>
      </DialogContent>
    </Dialog>
  );
}

