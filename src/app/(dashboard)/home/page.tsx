'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { mockAuth, User } from '@/lib/mock-auth';
import { mockMentorProfiles } from '@/lib/mock-mentors';
import { bookings } from '@/lib/api/bookings';
import { mentors } from '@/lib/api/mentors';
import { mockUsers } from '@/lib/mock-auth';
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
  const [user, setUser] = useState<User | null>(null);
  const [showBasicsCard, setShowBasicsCard] = useState(true);
  const [upcomingSessions, setUpcomingSessions] = useState<Booking[]>([]);

  useEffect(() => {
    const currentUser = mockAuth.getCurrentUser();
    setUser(currentUser);
    
    // Check if user has dismissed the basics card
    const hasSeenBasics = localStorage.getItem('hasSeenBasics');
    if (hasSeenBasics) {
      setShowBasicsCard(false);
    }

    // Load upcoming sessions from bookings service
    if (currentUser) {
      const userBookings = bookings.listForUser(currentUser.id, currentUser.role);
      // Show next confirmed/pending future sessions
      const upcoming = userBookings
        .filter(b => (b.status === 'confirmed' || b.status === 'pending') && new Date(b.datetime).getTime() >= Date.now())
        .sort((a, b) => new Date(a.datetime).getTime() - new Date(b.datetime).getTime())
        .slice(0, 2); // Top 2
      setUpcomingSessions(upcoming);
    }
  }, []);

  const dismissBasicsCard = () => {
    setShowBasicsCard(false);
    localStorage.setItem('hasSeenBasics', 'true');
  };

  if (!user) return null;

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase();
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
      return date.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });
    }
  };

  const formatTime = (isoString: string) => {
    const date = new Date(isoString);
    return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
  };

  // Transform upcoming sessions to display format
  const displaySessions = upcomingSessions.map(booking => {
    const isUserMentor = user.role === 'mentor';
    const otherPartyId = isUserMentor ? booking.menteeId : booking.mentorId;
    const otherParty = mockUsers.find(u => u.id === otherPartyId);
    const mentor = mentors.getById(booking.mentorId);

    return {
      id: booking.id,
      mentorName: isUserMentor ? (otherParty?.name || 'Unknown') : (mentor?.name || 'Unknown'),
      mentorAvatar: isUserMentor ? otherParty?.avatar : mentor?.avatar,
      date: formatDate(booking.datetime),
      time: formatTime(booking.datetime),
      topic: booking.topic,
      type: 'Video Call',
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

  const suggestedMentors = mockMentorProfiles.slice(0, 3).map(mentor => ({
    id: mentor.id,
    image: mentor.avatar,
    name: mentor.name,
    countryCode: mentor.location.split(',').pop()?.trim() || 'US',
    jobTitle: mentor.title,
    company: mentor.company,
    sessions: mentor.sessionsCompleted,
    reviews: mentor.reviewCount,
    attendance: 95, // Default attendance
    experience: mentor.experience.length > 0 ? calculateExperience(mentor.experience[0].period) : 5,
  }));

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-brand-dark">
            Good {new Date().getHours() < 12 ? 'morning' : 'afternoon'}, {user.name}👋!
          </h1>
          <p className="text-gray-600 mt-1">
            {user.role === 'mentor' 
              ? "Ready to inspire and guide today's learners?" 
              : "Ready to learn and grow today?"
            }
          </p>
        </div>
      </div>

      {/* Let's Start with Basics & Profile Strength - Only for Mentees */}
      {user.role === 'mentee' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Let's Start with the Basics Card or Upcoming Sessions */}
          {showBasicsCard ? (
            <Card className="rounded-2xl shadow-sm lg:col-span-2 relative">
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
                {/* Progress Bar */}
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700">50% completed</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-brand h-2 rounded-full" style={{ width: '50%' }} />
                </div>

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
                {displaySessions.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <Calendar className="mx-auto h-12 w-12 text-gray-300 mb-4" />
                    <p>No upcoming sessions</p>
                    <Button className="mt-4 bg-brand hover:bg-brand/90" size="sm" asChild>
                      <Link href="/explore">Book a session</Link>
                    </Button>
                  </div>
                ) : (
                  displaySessions.map((session) => (
                    <div key={session.id} className="flex items-center p-4 bg-gray-50 rounded-lg">
                      <Avatar className="h-12 w-12">
                        <AvatarImage src={session.mentorAvatar} alt={session.mentorName} />
                        <AvatarFallback>{getInitials(session.mentorName)}</AvatarFallback>
                      </Avatar>
                      <div className="ml-4 flex-1">
                        <h4 className="font-medium text-gray-900">{session.mentorName}</h4>
                        <p className="text-sm text-gray-600">{session.topic}</p>
                        <div className="flex items-center mt-1 text-xs text-gray-500">
                          <Clock className="w-3 h-3 mr-1" />
                          {session.date} at {session.time}
                        </div>
                      </div>
                      <Button size="sm" className="bg-brand hover:bg-brand/90" onClick={() => router.push(`/session/${session.id}`)}>
                        <Video className="w-4 h-4 mr-1" />
                        Join
                      </Button>
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
                    <h2 className="text-3xl font-bold text-orange-400 flex items-center gap-2">
                      Youngling <span className="text-2xl">🔰</span>
                    </h2>
                  </div>
                  <ChevronRight className="h-6 w-6 text-white" />
                </div>
                <div className="mt-4 w-full bg-purple-900/50 rounded-full h-2">
                  <div 
                    className="bg-gradient-to-r from-orange-400 to-orange-500 h-2 rounded-full" 
                    style={{ width: '30%' }} 
                  />
                </div>
              </div>
            </Link>

            {/* Calendar Widget */}
            <CalendarWidget userRole={user.role} />
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
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
            {displaySessions.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Calendar className="mx-auto h-12 w-12 text-gray-300 mb-4" />
                <p>No upcoming sessions</p>
                <Button className="mt-4 bg-brand hover:bg-brand/90" size="sm" asChild>
                  <Link href={user.role === 'mentor' ? '/availability' : '/explore'}>
                    {user.role === 'mentor' ? 'Set availability' : 'Book a session'}
                  </Link>
                </Button>
              </div>
            ) : (
              displaySessions.map((session) => (
                <div key={session.id} className="flex items-center p-4 bg-gray-50 rounded-lg">
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={session.mentorAvatar} alt={session.mentorName} />
                    <AvatarFallback>{getInitials(session.mentorName)}</AvatarFallback>
                  </Avatar>
                  <div className="ml-4 flex-1">
                    <h4 className="font-medium text-gray-900">{session.mentorName}</h4>
                    <p className="text-sm text-gray-600">{session.topic}</p>
                    <div className="flex items-center mt-1 text-xs text-gray-500">
                      <Clock className="w-3 h-3 mr-1" />
                      {session.date} at {session.time}
                    </div>
                  </div>
                  <Button size="sm" className="bg-brand hover:bg-brand/90" onClick={() => router.push(`/session/${session.id}`)}>
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
        {user.role !== 'mentee' && <CalendarWidget userRole={user.role} />}
      </div>

      {/* Suggested Mentors (for mentees) / Recent Activity (for mentors) */}
      {user.role === 'mentee' ? (
        <div>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-xl font-bold text-brand-dark">Suggested Mentors</h2>
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
                <MentorCard mentor={mentor} />
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
            <div className="space-y-3">
              <div className="flex items-center text-sm">
                <div className="w-2 h-2 bg-green-500 rounded-full mr-3" />
                <span>Completed session with Sarah Johnson</span>
              </div>
              <div className="flex items-center text-sm">
                <div className="w-2 h-2 bg-blue-500 rounded-full mr-3" />
                <span>New booking request from Alex Chen</span>
              </div>
              <div className="flex items-center text-sm">
                <div className="w-2 h-2 bg-purple-500 rounded-full mr-3" />
                <span>Profile viewed 15 times this week</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
