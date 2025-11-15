'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { bookings } from '@/lib/api/bookings';
import { mentors } from '@/lib/api/mentors';
import { toast } from 'sonner';
import { Star } from 'lucide-react';

interface FeedbackDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  bookingId: string;
  mentorId: string;
  mentorName: string;
  onSubmitted?: () => void;
}

export function FeedbackDialog({ open, onOpenChange, bookingId, mentorId, mentorName, onSubmitted }: FeedbackDialogProps) {
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const submit = () => {
    if (!rating) {
      toast.error('Please select a rating');
      return;
    }
    setIsSubmitting(true);
    try {
      // Save to booking
      bookings.addFeedback(bookingId, { rating, comment, givenByUserId: 'me' });
      // Update mentor aggregate
      mentors.applyFeedback(mentorId, rating);
      toast.success('Thanks for your feedback!');
      onOpenChange(false);
      if (onSubmitted) onSubmitted();
    } catch {
      toast.error('Failed to submit feedback');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>Leave feedback</DialogTitle>
          <DialogDescription>
            Rate your session with {mentorName}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="flex items-center gap-2">
            {[1,2,3,4,5].map(i => (
              <button
                key={i}
                onClick={() => setRating(i)}
                className={`p-1 rounded ${i <= rating ? 'text-yellow-400' : 'text-gray-300'}`}
                aria-label={`Rate ${i} star`}
              >
                <Star className={`h-6 w-6 ${i <= rating ? 'fill-yellow-400' : ''}`} />
              </button>
            ))}
          </div>
          <Textarea
            placeholder="Share your experience (optional)"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            rows={4}
          />
        </div>

        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>Cancel</Button>
          <Button className="bg-brand hover:bg-brand/90" onClick={submit} disabled={isSubmitting}>Submit</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}


