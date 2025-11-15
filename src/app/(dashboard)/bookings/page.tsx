'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Calendar, Clock, Video, MessageCircle, Star, MoreVertical } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { bookings } from '@/lib/api/bookings';
import { auth } from '@/lib/api/auth';
import { mentors } from '@/lib/api/mentors';
import { mockUsers } from '@/lib/mock-auth';
import type { Booking } from '@/lib/types';
import { toast } from 'sonner';
import { FeedbackDialog } from '@/components/feedback-dialog';
import Link from 'next/link';
import { messaging } from '@/lib/api/messages';

export default function BookingsPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('upcoming');
  const [userBookings, setUserBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const [feedbackTarget, setFeedbackTarget] = useState<Booking | null>(null);

  useEffect(() => {
    const currentUser = auth.getCurrentUser();
    if (!currentUser) {
      router.push('/login');
      return;
    }

    const allBookings = bookings.listForUser(currentUser.id, currentUser.role);
    setUserBookings(allBookings);
    setLoading(false);
  }, [router]);

  const currentUser = auth.getCurrentUser();
  if (!currentUser) return null;

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase();
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { variant: 'secondary' as const, label: 'Pending' },
      confirmed: { variant: 'default' as const, label: 'Confirmed' },
      completed: { variant: 'secondary' as const, label: 'Completed' },
      cancelled: { variant: 'destructive' as const, label: 'Cancelled' },
    };
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.confirmed;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const formatDate = (isoString: string) => {
    const date = new Date(isoString);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    today.setHours(0, 0, 0, 0);
    tomorrow.setHours(0, 0, 0, 0);
    const targetDate = new Date(date);
    targetDate.setHours(0, 0, 0, 0);

    if (targetDate.getTime() === today.getTime()) {
      return 'Today';
    } else if (targetDate.getTime() === tomorrow.getTime()) {
      return 'Tomorrow';
    } else {
      return date.toLocaleDateString('en-US', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      });
    }
  };

  const formatTime = (isoString: string) => {
    const date = new Date(isoString);
    return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
  };

  const handleCancelBooking = (bookingId: string) => {
    bookings.cancel(bookingId);
    toast.success('Booking cancelled');
    // Refresh list
    const allBookings = bookings.listForUser(currentUser.id, currentUser.role);
    setUserBookings(allBookings);
  };

  const handleJoinSession = (booking: Booking) => {
    if (booking.videoCallLink) {
      router.push(`/session/${booking.id}`);
    }
  };

  const handleMessage = (booking: Booking) => {
    const currentUser = auth.getCurrentUser();
    if (!currentUser) return;
    const conv = messaging.getOrCreateConversation({ mentorId: booking.mentorId, menteeId: booking.menteeId, bookingId: booking.id });
    router.push(`/messages?c=${conv.id}`);
  };

  const upcomingBookings = userBookings.filter(b => (b.status === 'confirmed' || b.status === 'pending') && new Date(b.datetime).getTime() >= Date.now())
    .sort((a, b) => new Date(a.datetime).getTime() - new Date(b.datetime).getTime());
  const pastBookings = userBookings.filter(b => b.status === 'completed')
    .sort((a, b) => new Date(b.datetime).getTime() - new Date(a.datetime).getTime());
  const cancelledBookings = userBookings.filter(b => b.status === 'cancelled')
    .sort((a, b) => new Date(b.datetime).getTime() - new Date(a.datetime).getTime());

  const BookingCard = ({ booking, showActions = true }: { booking: Booking; showActions?: boolean }) => {
    // Get the other party (mentor if mentee, mentee if mentor)
    const isUserMentor = currentUser.role === 'mentor';
    const otherPartyId = isUserMentor ? booking.menteeId : booking.mentorId;
    const otherParty = mockUsers.find(u => u.id === otherPartyId);
    const mentor = mentors.getById(booking.mentorId);
    
    const displayName = otherParty?.name || 'Unknown User';
    const displayTitle = isUserMentor 
      ? otherParty?.title || 'Mentee'
      : mentor?.title || 'Mentor';
    const displayAvatar = isUserMentor ? otherParty?.avatar : mentor?.avatar;
    const mentorRating = mentor?.rating;

    const canJoin = booking.status === 'confirmed' && new Date(booking.datetime).getTime() - Date.now() < 15 * 60 * 1000; // within 15min

    return (
      <Card key={booking.id} className="rounded-2xl shadow-sm">
        <CardContent className="p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-start space-x-4">
              <Avatar className="h-12 w-12">
                <AvatarImage src={displayAvatar} alt={displayName} />
                <AvatarFallback className="bg-brand-light/20 text-brand">
                  {getInitials(displayName)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900">{displayName}</h3>
                <p className="text-sm text-gray-600 mb-1">{displayTitle}</p>
                <div className="flex items-center space-x-4 text-sm text-gray-500">
                  {mentorRating && (
                    <div className="flex items-center">
                      <Star className="w-4 h-4 text-yellow-400 fill-current mr-1" />
                      <span>{mentorRating}</span>
                    </div>
                  )}
                  <Badge variant="outline" className="text-xs">
                    {booking.sessionType}
                  </Badge>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              {getStatusBadge(booking.status)}
              {showActions && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem>View Details</DropdownMenuItem>
                    <DropdownMenuItem>Message {isUserMentor ? 'Mentee' : 'Mentor'}</DropdownMenuItem>
                    {booking.status === 'confirmed' && (
                      <DropdownMenuItem className="text-red-600" onClick={() => handleCancelBooking(booking.id)}>
                        Cancel Session
                      </DropdownMenuItem>
                    )}
                    {booking.status === 'completed' && !booking.feedback && (
                      <DropdownMenuItem onClick={() => { setFeedbackTarget(booking); setFeedbackOpen(true); }}>Leave Feedback</DropdownMenuItem>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
          </div>

          <div className="space-y-3">
            <div>
              <h4 className="font-medium text-gray-900 mb-1">{booking.topic}</h4>
              {booking.goals && <p className="text-sm text-gray-600">{booking.goals}</p>}
            </div>

            <div className="flex items-center space-x-6 text-sm text-gray-600">
              <div className="flex items-center">
                <Calendar className="w-4 h-4 mr-2" />
                <span>{formatDate(booking.datetime)}</span>
              </div>
              <div className="flex items-center">
                <Clock className="w-4 h-4 mr-2" />
                <span>{formatTime(booking.datetime)} ({booking.durationMin} min)</span>
              </div>
            </div>

          {booking.status === 'completed' && !booking.feedback && (
              <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-sm text-yellow-800">
                  Don&apos;t forget to leave feedback for this session!
                </p>
              </div>
            )}
          </div>

          {booking.status === 'confirmed' && (
            <div className="flex space-x-3 mt-4">
              {canJoin && (
                <Button className="bg-brand hover:bg-brand/90" onClick={() => handleJoinSession(booking)}>
                  <Video className="w-4 h-4 mr-2" />
                  Join Session
                </Button>
              )}
              <Button variant="outline" onClick={() => handleMessage(booking)}>
                <MessageCircle className="w-4 h-4 mr-2" />
                Message
              </Button>
              <Button variant="outline" className="text-red-600 hover:text-red-700" onClick={() => handleCancelBooking(booking.id)}>
                Cancel
              </Button>
            </div>
          )}

          {booking.status === 'completed' && !booking.feedback && (
            <div className="flex space-x-3 mt-4">
              <Button className="bg-brand hover:bg-brand/90" onClick={() => { setFeedbackTarget(booking); setFeedbackOpen(true); }}>
                <Star className="w-4 h-4 mr-2" />
                Leave Feedback
              </Button>
            <Button variant="outline" onClick={() => handleMessage(booking)}>
                <MessageCircle className="w-4 h-4 mr-2" />
                Message
              </Button>
            </div>
          )}

          {booking.status === 'completed' && booking.feedback && (
            <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center mb-2">
                <span className="text-sm font-medium text-green-800 mr-2">Your Rating:</span>
                <div className="flex">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`w-4 h-4 ${
                        i < booking.feedback!.rating ? 'text-yellow-400 fill-current' : 'text-gray-300'
                      }`}
                    />
                  ))}
                </div>
              </div>
              {booking.feedback.comment && (
                <p className="text-sm text-green-700">&quot;{booking.feedback.comment}&quot;</p>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading bookings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-brand-dark">My Bookings</h1>
          <p className="text-gray-600 mt-1">
            Manage your mentoring sessions and appointments
          </p>
        </div>
        <Button className="bg-brand hover:bg-brand/90" asChild>
          <Link href="/explore">
            <Calendar className="w-4 h-4 mr-2" />
            Book New Session
          </Link>
        </Button>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="upcoming" className="flex items-center space-x-2">
            <Clock className="w-4 h-4" />
            <span>Upcoming ({upcomingBookings.length})</span>
          </TabsTrigger>
          <TabsTrigger value="past" className="flex items-center space-x-2">
            <Calendar className="w-4 h-4" />
            <span>Past ({pastBookings.length})</span>
          </TabsTrigger>
          <TabsTrigger value="cancelled" className="flex items-center space-x-2">
            <span>Cancelled ({cancelledBookings.length})</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="upcoming" className="space-y-4 mt-6">
          {upcomingBookings.length === 0 ? (
            <Card className="rounded-2xl shadow-sm">
              <CardContent className="p-12 text-center">
                <Calendar className="mx-auto h-12 w-12 text-gray-300 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No upcoming sessions</h3>
                <p className="text-gray-600 mb-4">
                  You don&apos;t have any scheduled sessions. Book a session with a mentor to get started.
                </p>
                <Button className="bg-brand hover:bg-brand/90" asChild>
                  <Link href="/explore">Explore Mentors</Link>
                </Button>
              </CardContent>
            </Card>
          ) : (
            upcomingBookings.map((booking) => (
              <BookingCard key={booking.id} booking={booking} />
            ))
          )}
        </TabsContent>

        <TabsContent value="past" className="space-y-4 mt-6">
          {pastBookings.length === 0 ? (
            <Card className="rounded-2xl shadow-sm">
              <CardContent className="p-12 text-center">
                <Calendar className="mx-auto h-12 w-12 text-gray-300 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No past sessions</h3>
                <p className="text-gray-600">
                  Your completed sessions will appear here.
                </p>
              </CardContent>
            </Card>
          ) : (
            pastBookings.map((booking) => (
              <BookingCard key={booking.id} booking={booking} />
            ))
          )}
        </TabsContent>

        <TabsContent value="cancelled" className="space-y-4 mt-6">
          {cancelledBookings.length === 0 ? (
            <Card className="rounded-2xl shadow-sm">
              <CardContent className="p-12 text-center">
                <Calendar className="mx-auto h-12 w-12 text-gray-300 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No cancelled sessions</h3>
                <p className="text-gray-600">
                  Your cancelled sessions will appear here.
                </p>
              </CardContent>
            </Card>
          ) : (
            cancelledBookings.map((booking) => (
              <BookingCard key={booking.id} booking={booking} showActions={false} />
            ))
          )}
        </TabsContent>
      </Tabs>

      {feedbackTarget && (
        <FeedbackDialog
          open={feedbackOpen}
          onOpenChange={(o) => { setFeedbackOpen(o); if (!o) setFeedbackTarget(null); }}
          bookingId={feedbackTarget.id}
          mentorId={feedbackTarget.mentorId}
          mentorName={mentors.getById(feedbackTarget.mentorId)?.name || 'Mentor'}
          onSubmitted={() => {
            const currentUser = auth.getCurrentUser();
            if (!currentUser) return;
            setUserBookings(bookings.listForUser(currentUser.id, currentUser.role));
          }}
        />
      )}
    </div>
  );
}
