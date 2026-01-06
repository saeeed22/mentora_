'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { auth, CurrentUser } from '@/lib/api/auth';
import { mentorsApi } from '@/lib/api/mentors-api';
// Mock data imports removed - using real API only
import { bookingsApi, BookingWithDetails } from '@/lib/api/bookings-api';
import { users } from '@/lib/api/users';
import type { Booking } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { CalendarWidget } from '@/components/dashboard/calendar-widget';
import MentorCard from '@/components/mentorcard';
import {
  Calendar,
  Clock,
  ArrowRight,
  ChevronRight,
  X,
  CheckCircle2,
  Video
} from 'lucide-react';

export default function DashboardHomePage() {
  const router = useRouter();
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [showBasicsCard, setShowBasicsCard] = useState(true);
  const [upcomingSessions, setUpcomingSessions] = useState<BookingWithDetails[]>([]);
  const [isLoadingBookings, setIsLoadingBookings] = useState(true);
  const [suggestedMentors, setSuggestedMentors] = useState<Array<{
    id: string;
    image: string;
    name: string;
    countryCode: string;
    jobTitle: string;
    company: string;
    current_role?: string;
    current_company?: string;
    sessions: number;
    reviews: number;
    attendance: number;
    experience: number;
    price_per_session_solo?: number;
  }>>([]);

  useEffect(() => {
    const currentUser = auth.getCurrentUser();
    setUser(currentUser);

    // Check if user has dismissed the basics card
    const hasSeenBasics = localStorage.getItem('hasSeenBasics');
    if (hasSeenBasics) {
      setShowBasicsCard(false);
    }

    // Load upcoming sessions from real API
    if (currentUser) {
      loadUpcomingSessions(currentUser);

      // Auto-refresh removed for better performance
      // Data will refresh when user navigates back to this page

      // Load suggested mentors from API
      if (currentUser.role === 'mentee') {
        loadSuggestedMentors();
      }
    }
  }, []);

  const loadUpcomingSessions = async (currentUser: CurrentUser) => {
    setIsLoadingBookings(true);
    try {
      // Get confirmed and pending bookings
      const result = await bookingsApi.getMyBookings({
        limit: 30
      });

      if (result.success && result.data) {
        // Fetch user info for each booking
        const bookingsWithInfo = await Promise.all(
          result.data.data.map(async (booking) => {
            const enhanced: BookingWithDetails = { ...booking };

            // Fetch mentor info
            try {
              const mentorResult = await users.getUserById(booking.mentor_id);
              if (mentorResult.success && mentorResult.data) {
                enhanced.mentorName = mentorResult.data.email.split('@')[0];
              }
            } catch {
              enhanced.mentorName = 'Mentor';
            }

            // Fetch mentee info (for mentors)
            try {
              const menteeResult = await users.getUserById(booking.mentee_id);
              if (menteeResult.success && menteeResult.data) {
                enhanced.menteeName = menteeResult.data.email.split('@')[0];
              }
            } catch {
              enhanced.menteeName = 'Mentee';
            }

            return enhanced;
          })
        );

        // Filter and sort upcoming sessions (confirmed or pending, and in the future)
        const now = Date.now();
        const upcoming = bookingsWithInfo
          .filter(b =>
            (b.status === 'confirmed' || b.status === 'pending') &&
            new Date(b.start_at).getTime() >= now
          )
          .sort((a, b) => new Date(a.start_at).getTime() - new Date(b.start_at).getTime())
          .slice(0, 2); // Top 2

        console.log('[Home] Loaded upcoming sessions:', upcoming);
        setUpcomingSessions(upcoming);
      }
    } catch (error) {
      console.error('[Home] Error loading bookings:', error);
    } finally {
      setIsLoadingBookings(false);
    }
  };

  const loadSuggestedMentors = async () => {
    const result = await mentorsApi.searchMentors({ limit: 20, sort: 'rating' });
    if (result.success && result.data) {
      // Filter mentors by qualification criteria:
      // - Must have experience > 0 years
      // - Must have headline
      // - Must have skills
      const qualifiedMentors = result.data.data.filter(mentor => {
        const experience = mentor.mentor_profile?.experience_years ?? 0;
        const hasHeadline = mentor.mentor_profile?.headline && mentor.mentor_profile.headline.length > 0;
        const hasSkills = mentor.mentor_profile?.skills && mentor.mentor_profile.skills.length > 0;

        return experience > 0 && hasHeadline && hasSkills;
      });

      // Note: Backend returns { id, profile, mentor_profile } - no user or stats objects
      const mentorCards = qualifiedMentors.slice(0, 3).map(m => ({
        id: m.profile?.user_id || (m as { id?: string }).id || m.user?.id || '',
        image: m.profile?.avatar_url || '/mentor_fallback_1.jpg',
        name: m.profile?.full_name || 'Unknown Mentor',
        countryCode: m.profile?.timezone?.includes('Asia/Karachi') ? 'PK' : 'US',
        jobTitle: m.mentor_profile?.headline || 'Mentor',
        company: '', // Not available from backend currently
        current_role: m.mentor_profile?.current_role,
        current_company: m.mentor_profile?.current_company,
        sessions: m.stats?.total_sessions ?? 0,
        reviews: m.mentor_profile?.rating_count ?? 0,
        attendance: m.stats?.total_sessions ? 95 : 0,
        experience: m.mentor_profile?.experience_years ?? 0,
        price_per_session_solo: m.mentor_profile?.price_per_session_solo,
      }));
      setSuggestedMentors(mentorCards);
    } else {
      // No mentors available - show empty state
      setSuggestedMentors([]);
    }
  };

  const dismissBasicsCard = () => {
    setShowBasicsCard(false);
    localStorage.setItem('hasSeenBasics', 'true');
  };

  if (!user) return null;

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0]?.toUpperCase())
      .join('')
      .toUpperCase();
  };

  const displayName = user.name || user.email || 'User';

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
      return date.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });
    }
  };

  const formatTime = (isoString: string) => {
    const date = new Date(isoString);
    return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
  };

  // Transform upcoming sessions to display format with join status
  const displaySessions = upcomingSessions.map(booking => {
    const isUserMentor = user?.role === 'mentor';
    const now = Date.now();
    const startTime = new Date(booking.start_at).getTime();
    const endTime = startTime + (booking.duration_minutes * 60 * 1000);
    const isConfirmed = booking.status === 'confirmed';

    // Can join if:
    // - Status is confirmed
    // - Session hasn't ended yet
    const canJoin = isConfirmed && (now < endTime);

    return {
      id: booking.id,
      status: booking.status,
      mentorName: isUserMentor ? (booking.menteeName || 'Mentee') : (booking.mentorName || 'Mentor'),
      mentorAvatar: undefined,
      date: formatDate(booking.start_at),
      time: formatTime(booking.start_at),
      topic: booking.notes || 'Session',
      type: 'Video Call',
      canJoin,
      isConfirmed,
      startTime,
    };
  });

  // Helper function to calculate years of experience from period string
  const calculateExperience = (period: string): number => {
    const parts = period.split(' - ');
    if (parts.length !== 2) return 5; // Default

    const startYear = parseInt(parts[0]);
    const endPart = parts[1].trim();
    const endYear = endPart === 'Present' ? new Date().getFullYear() : parseInt(endPart);

    return Math.max(1, endYear - startYear);
  };

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="space-y-1">
        <h1 className="text-2xl sm:text-3xl font-bold text-brand-dark">
          Good {new Date().getHours() < 12 ? 'morning' : 'afternoon'}, {displayName}👋!
        </h1>
        <p className="text-sm sm:text-base text-gray-600">
          {user.role === 'mentor'
            ? "Ready to inspire and guide today's learners?"
            : "Ready to learn and grow today?"
          }
        </p>
      </div>

      {/* Let's Start with Basics & Profile Strength - Only for Mentees */}
      {user.role === 'mentee' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {/* Left Column - Let's Start with the Basics Card or Upcoming Sessions */}
          {showBasicsCard ? (
            <Card className="rounded-2xl shadow-sm md:col-span-2 relative">
              <button
                onClick={dismissBasicsCard}
                className="absolute top-4 right-4 p-1 hover:bg-gray-100 rounded-lg transition-colors"
                aria-label="Dismiss"
              >
                <X className="h-4 w-4 text-gray-500" />
              </button>
              <CardHeader>
                <CardTitle className="text-2xl">Let&apos;s start with the basics</CardTitle>
                <CardDescription>Get more by setting up a profile you love.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Progress Bar - Calculate based on profile completeness */}
                {(() => {
                  // Calculate profile completeness
                  let completed = 1; // Email verified by default (user is logged in)
                  let total = 3; // Tasks: verify email, book session, complete profile
                  if (upcomingSessions.length > 0 || displaySessions.length > 0) completed++;
                  if (user.bio && user.bio.length > 0) completed++;
                  const percent = Math.round((completed / total) * 100);
                  return (
                    <>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-gray-700">{percent}% completed</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div className="bg-brand h-2 rounded-full" style={{ width: `${percent}%` }} />
                      </div>
                    </>
                  );
                })()}

                {/* Task List */}
                <div className="space-y-3 mt-6">
                  {/* Completed Task */}
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0" />
                    <span className="text-gray-400 line-through">Verify email</span>
                  </div>

                  {/* Incomplete Task */}
                  <div className="flex items-center gap-3">
                    <div className="h-5 w-5 rounded-full border-2 border-gray-300 flex-shrink-0" />
                    <div className="flex-1">
                      <Link href="/bookings" className="text-brand hover:text-brand/90 font-medium">
                        Book your first session
                      </Link>
                      <span className="text-gray-500"> — Learn/network with mentors.</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card className="rounded-2xl shadow-sm md:col-span-2">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-xl">Upcoming Sessions</CardTitle>
                  <CardDescription>Your scheduled mentoring sessions</CardDescription>
                </div>
                <Button variant="ghost" size="sm" asChild>
                  <Link href="/bookings">
                    View all <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </CardHeader>
              <CardContent className="space-y-4">
                {isLoadingBookings ? (
                  <div className="text-center py-8">
                    <div className="animate-spin h-8 w-8 border-2 border-brand border-t-transparent rounded-full mx-auto mb-3" />
                    <p className="text-sm text-gray-500">Loading sessions...</p>
                  </div>
                ) : displaySessions.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <Calendar className="mx-auto h-10 w-10 sm:h-12 sm:w-12 text-gray-300 mb-4" />
                    <p>No upcoming sessions</p>
                    <Button className="mt-4 bg-brand hover:bg-brand/90" size="sm" asChild>
                      <Link href="/explore">Book a session</Link>
                    </Button>
                  </div>
                ) : (
                  displaySessions.map((session) => (
                    <div key={session.id} className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-0 p-3 sm:p-4 bg-gray-50 rounded-lg">
                      <Avatar className="h-10 w-10 sm:h-12 sm:w-12">
                        <AvatarImage src={session.mentorAvatar} alt={session.mentorName} />
                        <AvatarFallback>{getInitials(session.mentorName)}</AvatarFallback>
                      </Avatar>
                      <div className="sm:ml-4 flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h4 className="font-medium text-gray-900">{session.mentorName}</h4>
                          {session.status === 'pending' && (
                            <span className="px-2 py-0.5 text-xs bg-yellow-100 text-yellow-800 rounded-full">
                              Pending
                            </span>
                          )}
                          {session.isConfirmed && (
                            <span className="px-2 py-0.5 text-xs bg-green-100 text-green-800 rounded-full">
                              Confirmed
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-600">{session.topic}</p>
                        <div className="flex items-center mt-1 text-xs text-gray-500">
                          <Clock className="w-3 h-3 mr-1" />
                          {session.date} at {session.time}
                        </div>
                      </div>
                      {session.canJoin ? (
                        <Button size="sm" className="bg-brand hover:bg-brand/90 w-full sm:w-auto" onClick={() => router.push(`/session/${session.id}`)}>
                          <Video className="w-4 h-4 mr-1" />
                          Join
                        </Button>
                      ) : session.status === 'pending' ? (
                        <Button size="sm" variant="outline" disabled className="w-full sm:w-auto">
                          Awaiting Approval
                        </Button>
                      ) : (
                        <Button size="sm" variant="outline" disabled className="w-full sm:w-auto">
                          Join opens 15 min before
                        </Button>
                      )}
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          )}

          {/* Right Column - Profile Strength Card & Calendar Widget */}
          <div className="space-y-6">
            {/* Profile Strength Card */}
            <Link href="/profile">
              <div
                className="rounded-2xl shadow-sm p-6 relative cursor-pointer hover:shadow-md transition-shadow"
                style={{
                  background: 'linear-gradient(135deg, #4a1942 0%, #6b2463 50%, #3d1438 100%)',
                }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="text-sm text-gray-300 mb-2">Your profile strength</p>
                    {(() => {
                      // Calculate profile strength based on completeness
                      const hasBio = user.bio && user.bio.length > 0;
                      const hasAvatar = !!user.avatar;
                      const hasBookings = upcomingSessions.length > 0;
                      const strength = [hasBio, hasAvatar, hasBookings].filter(Boolean).length;
                      const levels = [
                        { name: 'Youngling', emoji: '🔰', percent: 30 },
                        { name: 'Apprentice', emoji: '⭐', percent: 50 },
                        { name: 'Journeyman', emoji: '🌟', percent: 75 },
                        { name: 'Master', emoji: '👑', percent: 100 },
                      ];
                      const level = levels[Math.min(strength, levels.length - 1)];
                      return (
                        <>
                          <h2 className="text-3xl font-bold text-orange-400 flex items-center gap-2">
                            {level.name} <span className="text-2xl">{level.emoji}</span>
                          </h2>
                        </>
                      );
                    })()}
                  </div>
                  <ChevronRight className="h-6 w-6 text-white" />
                </div>
                <div className="mt-4 w-full bg-purple-900/50 rounded-full h-2">
                  {(() => {
                    const hasBio = user.bio && user.bio.length > 0;
                    const hasAvatar = !!user.avatar;
                    const hasBookings = upcomingSessions.length > 0;
                    const strength = [hasBio, hasAvatar, hasBookings].filter(Boolean).length;
                    const percent = strength === 0 ? 30 : strength === 1 ? 50 : strength === 2 ? 75 : 100;
                    return (
                      <div
                        className="bg-gradient-to-r from-orange-400 to-orange-500 h-2 rounded-full"
                        style={{ width: `${percent}%` }}
                      />
                    );
                  })()}
                </div>
              </div>
            </Link>

            {/* Calendar Widget */}
            <CalendarWidget userRole={user.role} />
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        {/* Upcoming Sessions - Only show here for mentors */}
        {user.role !== 'mentee' && (
          <Card className="rounded-2xl shadow-sm lg:col-span-2">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-xl">Upcoming Sessions</CardTitle>
                <CardDescription>Your scheduled mentoring sessions</CardDescription>
              </div>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/bookings">
                  View all <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              {isLoadingBookings ? (
                <div className="text-center py-8">
                  <div className="animate-spin h-8 w-8 border-2 border-brand border-t-transparent rounded-full mx-auto mb-3" />
                  <p className="text-sm text-gray-500">Loading sessions...</p>
                </div>
              ) : displaySessions.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Calendar className="mx-auto h-10 w-10 sm:h-12 sm:w-12 text-gray-300 mb-4" />
                  <p>No upcoming sessions</p>
                  <Button className="mt-4 bg-brand hover:bg-brand/90" size="sm" asChild>
                    <Link href={user.role === 'mentor' ? '/availability' : '/explore'}>
                      {user.role === 'mentor' ? 'Set availability' : 'Book a session'}
                    </Link>
                  </Button>
                </div>
              ) : (
                displaySessions.map((session) => (
                  <div key={session.id} className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-0 p-3 sm:p-4 bg-gray-50 rounded-lg">
                    <Avatar className="h-10 w-10 sm:h-12 sm:w-12">
                      <AvatarImage src={session.mentorAvatar} alt={session.mentorName} />
                      <AvatarFallback>{getInitials(session.mentorName)}</AvatarFallback>
                    </Avatar>
                    <div className="sm:ml-4 flex-1 min-w-0">
                      <h4 className="font-medium text-gray-900">{session.mentorName}</h4>
                      <p className="text-sm text-gray-600">{session.topic}</p>
                      <div className="flex items-center mt-1 text-xs text-gray-500">
                        <Clock className="w-3 h-3 mr-1" />
                        {session.date} at {session.time}
                      </div>
                    </div>
                    <Button size="sm" className="bg-brand hover:bg-brand/90 w-full sm:w-auto" onClick={() => router.push(`/session/${session.id}`)}>
                      <Video className="w-4 h-4 mr-1" />
                      Join
                    </Button>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        )}

        {/* Calendar Widget - Only for mentors (mentees have it in right column above) */}
        {user.role !== 'mentee' && <CalendarWidget userRole={user.role === 'admin' ? 'mentor' : user.role} />}
      </div>

      {/* Top Mentors (for mentees) / Recent Activity (for mentors) */}
      {user.role === 'mentee' ? (
        <div>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-xl font-bold text-brand-dark">Top Mentors</h2>
              <p className="text-sm text-gray-600">Mentors that match your interests</p>
            </div>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/explore">
                View all <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
          <div className="flex gap-6 overflow-x-auto pb-4 items-stretch">
            {suggestedMentors.map((mentor) => (
              <div key={mentor.id} className="flex-shrink-0">
                <MentorCard mentor={mentor} showBookButton={true} />
              </div>
            ))}
          </div>
        </div>
      ) : (
        <Card className="rounded-2xl shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-xl">Recent Activity</CardTitle>
              <CardDescription>Your recent mentoring activities</CardDescription>
            </div>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/bookings">
                View all <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            {upcomingSessions.length > 0 ? (
              <div className="space-y-3">
                {upcomingSessions.slice(0, 3).map((session, idx) => {
                  const isCompleted = session.status === 'completed';
                  const isPending = session.status === 'pending';
                  const statusColor = isCompleted ? 'bg-green-500' : isPending ? 'bg-yellow-500' : 'bg-blue-500';
                  const statusText = isCompleted
                    ? `Completed session with ${session.menteeName || 'mentee'}`
                    : isPending
                      ? `New booking request from ${session.menteeName || 'mentee'}`
                      : `Upcoming session with ${session.menteeName || 'mentee'}`;
                  return (
                    <div key={session.id || idx} className="flex items-center text-sm">
                      <div className={`w-2 h-2 ${statusColor} rounded-full mr-3`} />
                      <span>{statusText}</span>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-4 text-gray-500">
                <p className="text-sm">No recent activity</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
