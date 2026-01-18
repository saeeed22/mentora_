'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Calendar, Clock, Video, MessageCircle, Star, MoreVertical, Check, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { bookingsApi, BookingResponse } from '@/lib/api/bookings-api';
import { auth } from '@/lib/api/auth';
import { users } from '@/lib/api/users';
import { toast } from 'sonner';
import { FeedbackDialogNew } from '@/components/feedback-dialog-new';
import Link from 'next/link';
import { messagingApi } from '@/lib/api/messaging-api';

// Extended booking with user info
interface BookingWithUserInfo extends BookingResponse {
  mentorName?: string;
  mentorAvatar?: string;
  menteeName?: string;
  menteeAvatar?: string;
}

export default function BookingsPage() {
  const router = useRouter();
  const currentUser = auth.getCurrentUser();
  const isUserMentor = currentUser?.role === 'mentor';

  // Mentors see "pending" tab first, mentees see "upcoming"
  const [activeTab, setActiveTab] = useState(isUserMentor ? 'pending' : 'upcoming');
  const [userBookings, setUserBookings] = useState<BookingWithUserInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const [feedbackTarget, setFeedbackTarget] = useState<BookingWithUserInfo | null>(null);

  const loadBookings = async (isRefresh = false) => {
    const currentUser = auth.getCurrentUser();
    if (!currentUser) {
      router.push('/login');
      return;
    }

    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    const result = await bookingsApi.getMyBookings({ limit: 30 });

    if (result.success && result.data) {
      // Fetch user info for each booking
      const bookingsWithInfo = await Promise.all(
        result.data.data.map(async (booking) => {
          const enhanced: BookingWithUserInfo = { ...booking };

          // Fetch mentor info
          try {
            const mentorResult = await users.getUserById(booking.mentor_id);
            if (mentorResult.success && mentorResult.data) {
              enhanced.mentorName = mentorResult.data.profile?.full_name || mentorResult.data.email?.split("@")[0] || "Mentor";
            }
          } catch {
            enhanced.mentorName = 'Mentor';
          }

          // Fetch mentee info (for mentors)
          try {
            const menteeResult = await users.getUserById(booking.mentee_id);
            if (menteeResult.success && menteeResult.data) {
              enhanced.menteeName = menteeResult.data.profile?.full_name || menteeResult.data.email?.split("@")[0] || "Mentee";
            }
          } catch {
            enhanced.menteeName = 'Mentee';
          }

          return enhanced;
        })
      );

      setUserBookings(bookingsWithInfo);
    }
    if (isRefresh) {
      setRefreshing(false);
    } else {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBookings();
    // Auto-refresh removed for better performance
    // Users can manually refresh using the refresh button
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleRefresh = () => {
    loadBookings(true);
  };

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
      expired: { variant: 'destructive' as const, label: 'Expired' },
      rescheduled: { variant: 'secondary' as const, label: 'Rescheduled' },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.confirmed;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const getPaidBadge = (booking: BookingWithUserInfo) => {
    // Check if booking has a price (paid session, not free)
    const price = parseFloat(booking.price || '0');
    
    if (price <= 0) return null; // Don't show badge for free sessions
    
    return (
      <Badge 
        variant="default" 
        className="bg-amber-500 hover:bg-amber-600 text-white border-0 whitespace-nowrap text-xs"
      >
        Paid
      </Badge>
    );
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

  const handleCancelBooking = async (bookingId: string) => {
    const result = await bookingsApi.cancelBooking(bookingId);
    if (result.success) {
      toast.success('Booking cancelled');
      loadBookings(); // Refresh list
    } else {
      toast.error('Failed to cancel booking');
    }
  };

  const handleConfirmBooking = async (bookingId: string) => {
    // Use new confirm endpoint
    const result = await bookingsApi.confirmBooking(bookingId);
    if (result.success) {
      toast.success('Booking confirmed!');
      loadBookings(); // Refresh list
    } else {
      toast.error(result.error || 'Failed to confirm booking');
    }
  };

  const handleRejectBooking = async (bookingId: string) => {
    // Use new reject endpoint
    const result = await bookingsApi.rejectBooking(bookingId);
    if (result.success) {
      toast.success('Booking rejected');
      loadBookings(); // Refresh list
    } else {
      toast.error(result.error || 'Failed to reject booking');
    }
  };

  const handleCompleteBooking = async (bookingId: string) => {
    const result = await bookingsApi.updateBookingStatus(bookingId, 'completed');
    if (result.success) {
      toast.success('Session marked as completed!');
      loadBookings(); // Refresh list
    } else {
      toast.error(result.error || 'Failed to complete booking');
    }
  };

  const handleJoinSession = (booking: BookingWithUserInfo) => {
    router.push(`/session/${booking.id}`);
  };

  const handleMessage = async (booking: BookingWithUserInfo) => {
    const currentUser = auth.getCurrentUser();
    if (!currentUser) return;

    // Determine who to message based on current user's role
    const otherUserId = currentUser.role === 'mentor' ? booking.mentee_id : booking.mentor_id;

    try {
      // Create or get conversation via backend API
      const result = await messagingApi.createConversation([currentUser.id, otherUserId]);
      if (result.success && result.data) {
        router.push(`/messages?c=${result.data.id}`);
      } else {
        // API call succeeded but returned error - navigate to messages page
        console.error('[Bookings] Failed to create conversation');
        router.push('/messages');
      }
    } catch (error) {
      // API call failed - still navigate to messages page
      console.error('[Bookings] Error creating conversation:', error);
      router.push('/messages');
    }
  };

  // Separate pending bookings for mentors
  const pendingBookings = isUserMentor
    ? userBookings.filter(b => b.status === 'pending')
      .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
    : [];

  const upcomingBookings = userBookings.filter(b => (b.status === 'confirmed' || b.status === 'pending') && new Date(b.start_at).getTime() >= Date.now())
    .sort((a, b) => new Date(a.start_at).getTime() - new Date(b.start_at).getTime());
  const pastBookings = userBookings.filter(b => b.status === 'completed')
    .sort((a, b) => new Date(b.start_at).getTime() - new Date(a.start_at).getTime());
  const cancelledBookings = userBookings.filter(b => b.status === 'cancelled')
    .sort((a, b) => new Date(b.start_at).getTime() - new Date(a.start_at).getTime());

  const BookingCard = ({ booking, showActions = true }: { booking: BookingWithUserInfo; showActions?: boolean }) => {
    const isUserMentor = currentUser.role === 'mentor';
    // Mentors see mentee info, mentees see mentor info
    const displayName = isUserMentor
      ? (booking.menteeName || 'Mentee')
      : (booking.mentorName || 'Mentor');
    const displayTitle = isUserMentor ? 'Mentee' : 'Mentor';

    // Always allow joining for confirmed sessions (removed 15-minute restriction)
    const canJoin = booking.status === 'confirmed';
    const sessionEnded = new Date(booking.start_at).getTime() + (booking.duration_minutes * 60 * 1000) < Date.now();

    return (
      <Card key={booking.id} className="rounded-2xl shadow-sm">
        <CardContent className="p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-4">
            <div className="flex items-start space-x-3 sm:space-x-4 flex-1">
              <Avatar className="h-12 w-12 flex-shrink-0">
                <AvatarImage src={isUserMentor ? booking.menteeAvatar : booking.mentorAvatar} alt={displayName} />
                <AvatarFallback className="bg-brand-light/20 text-brand">
                  {getInitials(displayName)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-gray-900 truncate">{displayName}</h3>
                <p className="text-sm text-gray-600 mb-1 truncate">{displayTitle}</p>
                <div className="flex items-center space-x-2 text-sm text-gray-500">
                  <Badge variant="outline" className="text-xs">
                    {booking.duration_minutes} min session
                  </Badge>
                </div>
              </div>
            </div>
            <div className="flex items-center flex-wrap gap-2">
              {getStatusBadge(booking.status)}
              {/* Show "Paid" badge for paid sessions (not free) */}
              {getPaidBadge(booking)}
              {/* Show "Ready to Join" indicator for confirmed sessions that haven't ended */}
              {booking.status === 'confirmed' && !sessionEnded && (
                <Badge variant="default" className="bg-green-600 whitespace-nowrap">
                  Ready to Join
                </Badge>
              )}

              {booking.participant_emails && (
                <Badge variant="default" className={booking.participant_emails.length > 1 ? "bg-green-800 whitespace-nowrap" : "bg-blue-600 whitespace-nowrap"}>
                  {booking.participant_emails.length > 1 ? 'Group' : 'Solo'}
                </Badge>
              )}

              {showActions && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => handleMessage(booking)}>
                      Message {isUserMentor ? 'Mentee' : 'Mentor'}
                    </DropdownMenuItem>
                    {/* Mentor: Confirm pending booking */}
                    {isUserMentor && booking.status === 'pending' && (
                      <DropdownMenuItem onClick={() => handleConfirmBooking(booking.id)}>
                        
                        Confirm Booking
                      </DropdownMenuItem>
                    )}
                    {/* Mentor: Mark as completed after session ends */}
                    {isUserMentor && booking.status === 'confirmed' && sessionEnded && (
                      <DropdownMenuItem onClick={() => handleCompleteBooking(booking.id)}>
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Mark as Completed
                      </DropdownMenuItem>
                    )}
                    {booking.status === 'confirmed' && (
                      <DropdownMenuItem className="text-red-600" onClick={() => handleCancelBooking(booking.id)}>
                        Cancel Session
                      </DropdownMenuItem>
                    )}
                    {booking.status === 'completed' && !isUserMentor && (
                      <DropdownMenuItem onClick={() => { setFeedbackTarget(booking); setFeedbackOpen(true); }}>
                        Leave Feedback
                      </DropdownMenuItem>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
          </div>

          {/* Content Section with improved layout */}
          <div className="space-y-4">
            {/* Session Notes with better formatting */}
            {booking.notes && (
              <div className="bg-gray-50 rounded-lg p-3">
                <h4 className="font-semibold text-gray-900 text-sm mb-2">Session Notes</h4>
                <p className="text-sm text-gray-700 leading-relaxed break-words">
                  {booking.notes}
                </p>
              </div>
            )}

            {/* Date and Time - Better mobile layout */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-6 text-sm text-gray-600">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 flex-shrink-0 text-gray-400" />
                <span className="font-medium">{formatDate(booking.start_at)}</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 flex-shrink-0 text-gray-400" />
                <span>{formatTime(booking.start_at)} ({booking.duration_minutes} min)</span>
              </div>
            </div>
          </div>

          {/* Mentor: Pending booking actions */}
          {isUserMentor && booking.status === 'pending' && (
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 mt-4">
              <Button className="bg-green-600 hover:bg-green-700" onClick={() => handleConfirmBooking(booking.id)}>
                
                Confirm Booking
              </Button>
              <Button variant="outline" onClick={() => handleMessage(booking)}>
                <MessageCircle className="w-4 h-4 mr-2" />
                Message
              </Button>
              <Button variant="outline" className="text-red-600 hover:text-red-700" onClick={() => handleRejectBooking(booking.id)}>
                Reject
              </Button>
            </div>
          )}

          {/* Confirmed booking actions */}
          {booking.status === 'confirmed' && (
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 mt-4">
              {/* Always show Join button for confirmed sessions */}
              {!sessionEnded && (
                <Button className="bg-brand hover:bg-brand/90" onClick={() => handleJoinSession(booking)}>
                  <Video className="w-4 h-4 mr-2" />
                  Join Session
                </Button>
              )}
              {/* Mentor: Mark as completed after session */}
              {isUserMentor && sessionEnded && (
                <Button className="bg-green-600 hover:bg-green-700" onClick={() => handleCompleteBooking(booking.id)}>
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Mark Complete
                </Button>
              )}
              <Button variant="outline" onClick={() => handleMessage(booking)}>
                <MessageCircle className="w-4 h-4 mr-2" />
                Message
              </Button>
              {!sessionEnded && (
                <Button variant="outline" className="text-red-600 hover:text-red-700" onClick={() => handleCancelBooking(booking.id)}>
                  Cancel
                </Button>
              )}
            </div>
          )}

          {/* Completed booking actions (mentees only - feedback) */}
          {booking.status === 'completed' && !isUserMentor && (
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 mt-4">
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

          {/* Completed booking actions (mentors only - just message) */}
          {booking.status === 'completed' && isUserMentor && (
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 mt-4">
              <Button variant="outline" onClick={() => handleMessage(booking)}>
                <MessageCircle className="w-4 h-4 mr-2" />
                Message
              </Button>
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-brand-dark">My Bookings</h1>
          <p className="text-sm sm:text-base text-gray-600 mt-1">
            Manage your mentoring sessions and appointments
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleRefresh}
          disabled={refreshing}
          className="gap-2"
        >
          <svg
            className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
            />
          </svg>
          {refreshing ? 'Refreshing...' : 'Refresh'}
        </Button>
      </div>

      {/* Filters - Dropdown on mobile, Tabs on desktop */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        {/* Mobile: Dropdown */}
        <div className="lg:hidden">
          <Select value={activeTab} onValueChange={setActiveTab}>
            <SelectTrigger className="w-full bg-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {isUserMentor && (
                <SelectItem value="pending">
                  Pending ({pendingBookings.length})
                </SelectItem>
              )}
              <SelectItem value="upcoming">
                Upcoming ({upcomingBookings.length})
              </SelectItem>
              <SelectItem value="past">
                Past ({pastBookings.length})
              </SelectItem>
              <SelectItem value="cancelled">
                Cancelled ({cancelledBookings.length})
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Desktop: Tabs */}
        <TabsList className={`hidden lg:grid w-full ${isUserMentor ? 'grid-cols-4' : 'grid-cols-3'} h-auto p-1 gap-1 bg-gray-100`}>
          {isUserMentor && (
            <TabsTrigger
              value="pending"
              className="text-sm px-4 py-2 data-[state=active]:bg-white"
            >
              Pending ({pendingBookings.length})
            </TabsTrigger>
          )}
          <TabsTrigger
            value="upcoming"
            className="text-sm px-4 py-2 data-[state=active]:bg-white"
          >
            Upcoming ({upcomingBookings.length})
          </TabsTrigger>
          <TabsTrigger
            value="past"
            className="text-sm px-4 py-2 data-[state=active]:bg-white"
          >
            Past ({pastBookings.length})
          </TabsTrigger>
          <TabsTrigger
            value="cancelled"
            className="text-sm px-4 py-2 data-[state=active]:bg-white"
          >
            Cancelled ({cancelledBookings.length})
          </TabsTrigger>
        </TabsList>

        {/* Pending Requests Tab (Mentor Only) */}
        {isUserMentor && (
          <TabsContent value="pending" className="space-y-4 mt-6">
            {pendingBookings.length === 0 ? (
              <Card className="rounded-2xl shadow-sm">
                <CardContent className="p-12 text-center">
                  <Clock className="mx-auto h-12 w-12 text-gray-300 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No pending requests</h3>
                  <p className="text-gray-600">
                    Booking requests from mentees will appear here for your review.
                  </p>
                </CardContent>
              </Card>
            ) : (
              pendingBookings.map((booking) => (
                <BookingCard key={booking.id} booking={booking} />
              ))
            )}
          </TabsContent>
        )}

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
        <FeedbackDialogNew
          open={feedbackOpen}
          onOpenChangeAction={(o) => { setFeedbackOpen(o); if (!o) setFeedbackTarget(null); }}
          bookingId={feedbackTarget.id}
          mentorName={feedbackTarget.mentorName || 'Mentor'}
          onSuccess={() => {
            loadBookings();
          }}
        />
      )}
    </div>
  );
}
