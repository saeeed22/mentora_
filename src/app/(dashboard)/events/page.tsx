'use client';

import { useState } from 'react';
import { Calendar, Clock, Users, MapPin, Plus, Filter, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

// Mock events data
const mockEvents = {
  upcoming: [
    {
      id: '1',
      title: 'Career Fair: Tech Industry Opportunities',
      description: 'Join us for a virtual career fair featuring top tech companies and startups. Network with recruiters and learn about exciting opportunities.',
      date: '2024-01-20',
      time: '10:00 AM - 4:00 PM',
      type: 'Career Fair',
      format: 'Virtual',
      attendees: 156,
      maxAttendees: 200,
      host: {
        name: 'KU Career Center',
        avatar: '/avatars/ku-logo.jpg',
      },
      tags: ['Tech', 'Networking', 'Career'],
      isRegistered: true,
      isFree: true,
    },
    {
      id: '2',
      title: 'Workshop: Building Your Personal Brand',
      description: 'Learn how to create and maintain a strong personal brand across social media and professional networks.',
      date: '2024-01-22',
      time: '2:00 PM - 3:30 PM',
      type: 'Workshop',
      format: 'Virtual',
      attendees: 45,
      maxAttendees: 50,
      host: {
        name: 'Maya Gurung',
        avatar: '/avatars/mentor5.jpg',
      },
      tags: ['Personal Branding', 'Social Media', 'Marketing'],
      isRegistered: false,
      isFree: true,
    },
    {
      id: '3',
      title: 'Panel Discussion: Women in Tech',
      description: 'Inspiring panel discussion with successful women leaders in technology sharing their journeys and insights.',
      date: '2024-01-25',
      time: '6:00 PM - 7:30 PM',
      type: 'Panel Discussion',
      format: 'Virtual',
      attendees: 89,
      maxAttendees: 100,
      host: {
        name: 'Tech Women Nepal',
        avatar: '/avatars/tech-women.jpg',
      },
      tags: ['Women in Tech', 'Leadership', 'Inspiration'],
      isRegistered: true,
      isFree: true,
    },
  ],
  past: [
    {
      id: '4',
      title: 'Coding Bootcamp: React Fundamentals',
      description: 'Intensive 3-hour workshop covering React basics, components, and state management.',
      date: '2024-01-10',
      time: '1:00 PM - 4:00 PM',
      type: 'Bootcamp',
      format: 'Virtual',
      attendees: 78,
      maxAttendees: 80,
      host: {
        name: 'Amit Shrestha',
        avatar: '/avatars/mentor4.jpg',
      },
      tags: ['React', 'JavaScript', 'Web Development'],
      attended: true,
      rating: 5,
      isFree: true,
    },
    {
      id: '5',
      title: 'Startup Pitch Competition',
      description: 'Students presented their startup ideas to a panel of investors and industry experts.',
      date: '2024-01-05',
      time: '10:00 AM - 12:00 PM',
      type: 'Competition',
      format: 'Hybrid',
      attendees: 120,
      maxAttendees: 150,
      host: {
        name: 'KU Entrepreneurship Club',
        avatar: '/avatars/ku-logo.jpg',
      },
      tags: ['Startup', 'Entrepreneurship', 'Pitch'],
      attended: false,
      isFree: true,
    },
  ],
};

export default function EventsPage() {
  const [activeTab, setActiveTab] = useState('upcoming');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState('all');
  const [selectedFormat, setSelectedFormat] = useState('all');

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase();
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

  const getTypeColor = (type: string) => {
    const colors = {
      'Career Fair': 'bg-blue-100 text-blue-800',
      'Workshop': 'bg-green-100 text-green-800',
      'Panel Discussion': 'bg-purple-100 text-purple-800',
      'Bootcamp': 'bg-orange-100 text-orange-800',
      'Competition': 'bg-red-100 text-red-800',
    };
    return colors[type as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const EventCard = ({ event, isPast = false }: { event: any; isPast?: boolean }) => (
    <Card className="rounded-2xl shadow-sm hover:shadow-md transition-shadow">
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <div className="flex items-center space-x-2 mb-2">
              <Badge className={getTypeColor(event.type)}>
                {event.type}
              </Badge>
              <Badge variant="outline">
                {event.format}
              </Badge>
              {event.isFree && (
                <Badge variant="secondary" className="bg-green-100 text-green-800">
                  Free
                </Badge>
              )}
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {event.title}
            </h3>
            <p className="text-sm text-gray-600 mb-4 line-clamp-2">
              {event.description}
            </p>
          </div>
        </div>

        <div className="space-y-3 mb-4">
          <div className="flex items-center space-x-4 text-sm text-gray-600">
            <div className="flex items-center">
              <Calendar className="w-4 h-4 mr-2" />
              <span>{formatDate(event.date)}</span>
            </div>
            <div className="flex items-center">
              <Clock className="w-4 h-4 mr-2" />
              <span>{event.time}</span>
            </div>
          </div>

          <div className="flex items-center justify-between text-sm text-gray-600">
            <div className="flex items-center">
              <Users className="w-4 h-4 mr-2" />
              <span>{event.attendees} / {event.maxAttendees} attendees</span>
            </div>
            <div className="flex items-center">
              <Avatar className="h-6 w-6 mr-2">
                <AvatarImage src={event.host.avatar} alt={event.host.name} />
                <AvatarFallback className="text-xs bg-teal-100 text-teal-700">
                  {getInitials(event.host.name)}
                </AvatarFallback>
              </Avatar>
              <span className="text-xs">by {event.host.name}</span>
            </div>
          </div>

          <div className="flex flex-wrap gap-1">
            {event.tags.map((tag: string) => (
              <Badge key={tag} variant="outline" className="text-xs">
                {tag}
              </Badge>
            ))}
          </div>
        </div>

        {!isPast ? (
          <div className="flex space-x-3">
            {event.isRegistered ? (
              <Button className="flex-1 bg-green-600 hover:bg-green-700">
                Registered
              </Button>
            ) : (
              <Button className="flex-1 bg-teal-600 hover:bg-teal-700">
                Register
              </Button>
            )}
            <Button variant="outline">
              Share
            </Button>
          </div>
        ) : (
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              {event.attended ? (
                <Badge className="bg-green-100 text-green-800">Attended</Badge>
              ) : (
                <Badge variant="outline">Missed</Badge>
              )}
            </div>
            {event.attended && event.rating && (
              <div className="flex items-center space-x-1">
                <span className="text-sm text-gray-600">Your rating:</span>
                <div className="flex">
                  {[...Array(5)].map((_, i) => (
                    <span
                      key={i}
                      className={`text-sm ${
                        i < event.rating ? 'text-yellow-400' : 'text-gray-300'
                      }`}
                    >
                      ★
                    </span>
                  ))}
                </div>
              </div>
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
          <h1 className="text-3xl font-bold text-gray-900">Events</h1>
          <p className="text-gray-600 mt-1">
            Discover workshops, career fairs, and networking opportunities
          </p>
        </div>
        <Button className="bg-teal-600 hover:bg-teal-700">
          <Plus className="w-4 h-4 mr-2" />
          Create Event
        </Button>
      </div>

      {/* Search and Filters */}
      <Card className="rounded-2xl shadow-sm">
        <CardContent className="p-4">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  type="search"
                  placeholder="Search events..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="flex space-x-3">
              <Select value={selectedType} onValueChange={setSelectedType}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="workshop">Workshop</SelectItem>
                  <SelectItem value="career-fair">Career Fair</SelectItem>
                  <SelectItem value="panel">Panel Discussion</SelectItem>
                  <SelectItem value="bootcamp">Bootcamp</SelectItem>
                  <SelectItem value="competition">Competition</SelectItem>
                </SelectContent>
              </Select>

              <Select value={selectedFormat} onValueChange={setSelectedFormat}>
                <SelectTrigger className="w-[120px]">
                  <SelectValue placeholder="Format" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Formats</SelectItem>
                  <SelectItem value="virtual">Virtual</SelectItem>
                  <SelectItem value="in-person">In-Person</SelectItem>
                  <SelectItem value="hybrid">Hybrid</SelectItem>
                </SelectContent>
              </Select>

              <Button variant="outline" size="icon">
                <Filter className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="upcoming" className="flex items-center space-x-2">
            <Calendar className="w-4 h-4" />
            <span>Upcoming ({mockEvents.upcoming.length})</span>
          </TabsTrigger>
          <TabsTrigger value="past" className="flex items-center space-x-2">
            <Clock className="w-4 h-4" />
            <span>Past Events ({mockEvents.past.length})</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="upcoming" className="space-y-4 mt-6">
          {mockEvents.upcoming.length === 0 ? (
            <Card className="rounded-2xl shadow-sm">
              <CardContent className="p-12 text-center">
                <Calendar className="mx-auto h-12 w-12 text-gray-300 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No upcoming events</h3>
                <p className="text-gray-600 mb-4">
                  Check back later for new events and workshops.
                </p>
                <Button className="bg-teal-600 hover:bg-teal-700">
                  <Plus className="w-4 h-4 mr-2" />
                  Create Event
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {mockEvents.upcoming.map((event) => (
                <EventCard key={event.id} event={event} />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="past" className="space-y-4 mt-6">
          {mockEvents.past.length === 0 ? (
            <Card className="rounded-2xl shadow-sm">
              <CardContent className="p-12 text-center">
                <Clock className="mx-auto h-12 w-12 text-gray-300 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No past events</h3>
                <p className="text-gray-600">
                  Events you've attended will appear here.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {mockEvents.past.map((event) => (
                <EventCard key={event.id} event={event} isPast />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
