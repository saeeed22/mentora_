'use client';

import { useState } from 'react';
import { Calendar, Clock, Video, MessageCircle, Star, MoreVertical } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

// Mock booking data
const mockBookings = {
  upcoming: [
    {
      id: '1',
      mentor: {
        name: 'Priya Sharma',
        title: 'Senior Software Engineer at Google',
        avatar: '/avatars/mentor1.jpg',
        rating: 4.9,
      },
      date: '2024-01-15',
      time: '2:00 PM - 3:00 PM',
      topic: 'Career Planning & Goal Setting',
      sessionType: 'One-on-One Mentoring',
      status: 'confirmed',
      meetingLink: 'https://meet.jit.si/mentora-session-1',
      description: 'Discuss career goals, create a roadmap, and identify next steps for professional growth.',
      price: 'Free',
      canJoin: true,
      canCancel: true,
    },
    {
      id: '2',
      mentor: {
        name: 'Rahul Thapa',
        title: 'Senior Product Manager at Microsoft',
        avatar: '/avatars/mentor2.jpg',
        rating: 4.8,
      },
      date: '2024-01-16',
      time: '10:30 AM - 11:30 AM',
      topic: 'Resume Review & Feedback',
      sessionType: 'Resume Review',
      status: 'confirmed',
      meetingLink: 'https://meet.jit.si/mentora-session-2',
      description: 'Comprehensive review of your resume with actionable feedback and improvement suggestions.',
      price: 'Free',
      canJoin: false,
      canCancel: true,
    },
  ],
  past: [
    {
      id: '3',
      mentor: {
        name: 'Dr. Sita Rai',
        title: 'Data Scientist at Netflix',
        avatar: '/avatars/mentor3.jpg',
        rating: 4.9,
      },
      date: '2024-01-10',
      time: '3:00 PM - 4:00 PM',
      topic: 'Machine Learning Career Path',
      sessionType: 'Career Guidance',
      status: 'completed',
      description: 'Explored different paths in ML, discussed required skills, and created a learning plan.',
      price: 'Free',
      feedback: {
        rating: 5,
        comment: 'Excellent session! Dr. Rai provided valuable insights and practical advice.',
        given: true,
      },
    },
    {
      id: '4',
      mentor: {
        name: 'Maya Gurung',
        title: 'UX Designer at Airbnb',
        avatar: '/avatars/mentor5.jpg',
        rating: 4.8,
      },
      date: '2024-01-05',
      time: '1:00 PM - 2:00 PM',
      topic: 'Design Portfolio Review',
      sessionType: 'Portfolio Review',
      status: 'completed',
      description: 'Reviewed design portfolio, discussed improvements, and shared industry insights.',
      price: 'Free',
      feedback: {
        rating: 0,
        comment: '',
        given: false,
      },
    },
  ],
  cancelled: [
    {
      id: '5',
      mentor: {
        name: 'Kiran Adhikari',
        title: 'DevOps Engineer at Amazon',
        avatar: '/avatars/mentor6.jpg',
        rating: 4.6,
      },
      date: '2024-01-12',
      time: '4:00 PM - 5:00 PM',
      topic: 'DevOps Best Practices',
      sessionType: 'Technical Discussion',
      status: 'cancelled',
      description: 'Discussion about DevOps tools, practices, and career opportunities.',
      price: 'Free',
      cancelReason: 'Mentor had to reschedule due to emergency',
      cancelledBy: 'mentor',
    },
  ],
};

export default function BookingsPage() {
  const [activeTab, setActiveTab] = useState('upcoming');

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase();
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      confirmed: { variant: 'default' as const, label: 'Confirmed' },
      completed: { variant: 'secondary' as const, label: 'Completed' },
      cancelled: { variant: 'destructive' as const, label: 'Cancelled' },
    };
    
    const config = statusConfig[status as keyof typeof statusConfig];
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === tomorrow.toDateString()) {
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

  const BookingCard = ({ booking, showActions = true }: { booking: any; showActions?: boolean }) => (
    <Card key={booking.id} className="rounded-2xl shadow-sm">
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-start space-x-4">
            <Avatar className="h-12 w-12">
              <AvatarImage src={booking.mentor.avatar} alt={booking.mentor.name} />
              <AvatarFallback className="bg-teal-100 text-teal-700">
                {getInitials(booking.mentor.name)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900">{booking.mentor.name}</h3>
              <p className="text-sm text-gray-600 mb-1">{booking.mentor.title}</p>
              <div className="flex items-center space-x-4 text-sm text-gray-500">
                <div className="flex items-center">
                  <Star className="w-4 h-4 text-yellow-400 fill-current mr-1" />
                  <span>{booking.mentor.rating}</span>
                </div>
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
                  <DropdownMenuItem>Message Mentor</DropdownMenuItem>
                  {booking.status === 'confirmed' && booking.canCancel && (
                    <DropdownMenuItem className="text-red-600">Cancel Session</DropdownMenuItem>
                  )}
                  {booking.status === 'completed' && !booking.feedback?.given && (
                    <DropdownMenuItem>Leave Feedback</DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>

        <div className="space-y-3">
          <div>
            <h4 className="font-medium text-gray-900 mb-1">{booking.topic}</h4>
            <p className="text-sm text-gray-600">{booking.description}</p>
          </div>

          <div className="flex items-center space-x-6 text-sm text-gray-600">
            <div className="flex items-center">
              <Calendar className="w-4 h-4 mr-2" />
              <span>{formatDate(booking.date)}</span>
            </div>
            <div className="flex items-center">
              <Clock className="w-4 h-4 mr-2" />
              <span>{booking.time}</span>
            </div>
          </div>

          {booking.cancelReason && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-800">
                <strong>Cancelled:</strong> {booking.cancelReason}
              </p>
            </div>
          )}

          {booking.status === 'completed' && booking.feedback && !booking.feedback.given && (
            <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-sm text-yellow-800">
                Don't forget to leave feedback for this session!
              </p>
            </div>
          )}
        </div>

        {booking.status === 'confirmed' && (
          <div className="flex space-x-3 mt-4">
            {booking.canJoin && (
              <Button className="bg-teal-600 hover:bg-teal-700">
                <Video className="w-4 h-4 mr-2" />
                Join Session
              </Button>
            )}
            <Button variant="outline">
              <MessageCircle className="w-4 h-4 mr-2" />
              Message
            </Button>
            {booking.canCancel && (
              <Button variant="outline" className="text-red-600 hover:text-red-700">
                Cancel
              </Button>
            )}
          </div>
        )}

        {booking.status === 'completed' && !booking.feedback?.given && (
          <div className="flex space-x-3 mt-4">
            <Button className="bg-teal-600 hover:bg-teal-700">
              <Star className="w-4 h-4 mr-2" />
              Leave Feedback
            </Button>
            <Button variant="outline">
              <MessageCircle className="w-4 h-4 mr-2" />
              Message
            </Button>
          </div>
        )}

        {booking.status === 'completed' && booking.feedback?.given && (
          <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center mb-2">
              <span className="text-sm font-medium text-green-800 mr-2">Your Rating:</span>
              <div className="flex">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={`w-4 h-4 ${
                      i < booking.feedback.rating ? 'text-yellow-400 fill-current' : 'text-gray-300'
                    }`}
                  />
                ))}
              </div>
            </div>
            {booking.feedback.comment && (
              <p className="text-sm text-green-700">"{booking.feedback.comment}"</p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">My Bookings</h1>
          <p className="text-gray-600 mt-1">
            Manage your mentoring sessions and appointments
          </p>
        </div>
        <Button className="bg-teal-600 hover:bg-teal-700">
          <Calendar className="w-4 h-4 mr-2" />
          Book New Session
        </Button>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="upcoming" className="flex items-center space-x-2">
            <Clock className="w-4 h-4" />
            <span>Upcoming ({mockBookings.upcoming.length})</span>
          </TabsTrigger>
          <TabsTrigger value="past" className="flex items-center space-x-2">
            <Calendar className="w-4 h-4" />
            <span>Past ({mockBookings.past.length})</span>
          </TabsTrigger>
          <TabsTrigger value="cancelled" className="flex items-center space-x-2">
            <span>Cancelled ({mockBookings.cancelled.length})</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="upcoming" className="space-y-4 mt-6">
          {mockBookings.upcoming.length === 0 ? (
            <Card className="rounded-2xl shadow-sm">
              <CardContent className="p-12 text-center">
                <Calendar className="mx-auto h-12 w-12 text-gray-300 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No upcoming sessions</h3>
                <p className="text-gray-600 mb-4">
                  You don't have any scheduled sessions. Book a session with a mentor to get started.
                </p>
                <Button className="bg-teal-600 hover:bg-teal-700">
                  Explore Mentors
                </Button>
              </CardContent>
            </Card>
          ) : (
            mockBookings.upcoming.map((booking) => (
              <BookingCard key={booking.id} booking={booking} />
            ))
          )}
        </TabsContent>

        <TabsContent value="past" className="space-y-4 mt-6">
          {mockBookings.past.length === 0 ? (
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
            mockBookings.past.map((booking) => (
              <BookingCard key={booking.id} booking={booking} />
            ))
          )}
        </TabsContent>

        <TabsContent value="cancelled" className="space-y-4 mt-6">
          {mockBookings.cancelled.length === 0 ? (
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
            mockBookings.cancelled.map((booking) => (
              <BookingCard key={booking.id} booking={booking} showActions={false} />
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
