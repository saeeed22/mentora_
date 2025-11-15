'use client';

import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { getMentorById, getSimilarMentors } from '@/lib/mock-mentors';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  MessageCircle,
  Heart,
  MoreVertical,
  Linkedin,
  Twitter,
  Globe,
  Star,
  Rocket,
  Award,
  Briefcase,
  GraduationCap,
  ChevronRight,
  ChevronLeft,
  ThumbsUp,
} from 'lucide-react';
import Link from 'next/link';
import { BookingDialog } from '@/components/booking-dialog';
import { mentors as mentorsApi } from '@/lib/api/mentors';
import type { AvailabilitySlot } from '@/lib/types';
import { messaging } from '@/lib/api/messages';
import { auth } from '@/lib/api/auth';
import { useRouter } from 'next/navigation';

export default function MentorProfilePage() {
  const params = useParams();
  const router = useRouter();
  const mentorId = params.id as string;
  const mentor = getMentorById(mentorId);
  const similarMentors = getSimilarMentors(mentorId, 3);

  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<string | null>(null);
  const [showFullBio, setShowFullBio] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);
  const [bookingDialogOpen, setBookingDialogOpen] = useState(false);
  const [availableSlots, setAvailableSlots] = useState<AvailabilitySlot[]>([]);

  // Load available slots (prefer generated availability; fallback to profile slots)
  useEffect(() => {
    if (!mentor) return;
    let mounted = true;
    (async () => {
      const generated = await mentorsApi.getAvailableSlots(mentorId, 28);
      const slots = (generated && generated.length > 0) ? generated : (mentor.availability_slots ?? []);
      if (!mounted) return;
      setAvailableSlots(slots);
      if (slots.length > 0) {
        setSelectedDate(slots[0].date);
        if (slots[0].slots.length > 0) setSelectedTimeSlot(slots[0].slots[0]);
      }
    })();
    return () => { mounted = false; };
  }, [mentorId, mentor]);

  if (!mentor) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-brand-dark mb-2">Mentor not found</h2>
          <p className="text-gray-600 mb-4">The mentor profile you&apos;re looking for doesn&apos;t exist.</p>
          <Button asChild className="bg-brand hover:bg-brand/90">
            <Link href="/explore">Back to Explore</Link>
          </Button>
        </div>
      </div>
    );
  }

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase();
  };

  const handleBooking = () => {
    if (!selectedDate || !selectedTimeSlot) {
      return;
    }
    setBookingDialogOpen(true);
  };

  const selectedDateSlots = availableSlots?.find((slot) => slot.date === selectedDate);

  return (
    <div className="space-y-6 pb-12">
      {/* Profile Header Section */}
      <div className="bg-white">
        {/* Cover Background with decorative circles */}
        <div
          className="h-48 w-full relative overflow-hidden"
          style={{
            background: 'linear-gradient(135deg, #0d9488 0%, #14b8a6 50%, #5eead4 100%)',
          }}
        >
          {/* Decorative circles */}
          <div className="absolute top-0 left-20 w-40 h-40 rounded-full bg-green-700 opacity-30" />
          <div className="absolute bottom-0 right-20 w-60 h-60 rounded-full bg-brand-light opacity-20" />
        </div>

        {/* Profile Content */}
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col lg:flex-row gap-8 -mt-20 relative">
            {/* Left Section - Profile Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-start gap-6">
                {/* Avatar */}
                <Avatar className="h-44 w-44 border-8 border-white shadow-xl flex-shrink-0">
                  <AvatarImage src={mentor.avatar} alt={mentor.name} />
                  <AvatarFallback className="bg-brand-light/20 text-brand text-4xl">
                    {getInitials(mentor.name)}
                  </AvatarFallback>
                </Avatar>

                {/* Name and Title */}
                <div className="flex-1 pt-24">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h1 className="text-3xl font-bold text-brand-dark mb-1">
                        {mentor.name}
                      </h1>
                      <p className="text-lg text-gray-700">
                        {mentor.title} <span className="text-gray-500">at</span>{' '}
                        <span className="font-medium">{mentor.company}</span>
                      </p>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="icon"
                        className="rounded-lg"
                        aria-label="Message"
                        onClick={() => {
                          const currentUser = auth.getCurrentUser();
                          if (!currentUser) { router.push('/login'); return; }
                          if (currentUser.role !== 'mentee') return; // mentees initiate
                          const conv = messaging.getOrCreateConversation({ mentorId: mentorId, menteeId: currentUser.id });
                          router.push(`/messages?c=${conv.id}`);
                        }}
                      >
                        <MessageCircle className="h-5 w-5" />
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        className="rounded-lg"
                        aria-label="Favorite"
                        onClick={() => setIsFavorite(!isFavorite)}
                      >
                        <Heart
                          className={`h-5 w-5 ${
                            isFavorite ? 'fill-red-500 text-red-500' : ''
                          }`}
                        />
                      </Button>
                      <Button variant="outline" size="icon" className="rounded-lg" aria-label="More options">
                        <MoreVertical className="h-5 w-5" />
                      </Button>
                    </div>
                  </div>

                  {/* Social Links */}
                  {mentor.socialLinks && (
                    <div className="flex items-center gap-2">
                      {mentor.socialLinks.linkedin && (
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0" asChild>
                          <a
                            href={mentor.socialLinks.linkedin}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <Linkedin className="h-4 w-4" />
                          </a>
                        </Button>
                      )}
                      {mentor.socialLinks.twitter && (
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0" asChild>
                          <a
                            href={mentor.socialLinks.twitter}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <Twitter className="h-4 w-4" />
                          </a>
                        </Button>
                      )}
                      {mentor.socialLinks.website && (
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0" asChild>
                          <a
                            href={mentor.socialLinks.website}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <Globe className="h-4 w-4" />
                          </a>
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Left Section - Tabs and Content */}
          <div className="flex-1 min-w-0">
            <Tabs defaultValue="overview" className="w-full">
              <TabsList className="w-full justify-start border-b rounded-none h-auto p-0 bg-transparent">
                <TabsTrigger
                  value="overview"
                  className="rounded-none border-b-2 border-transparent data-[state=active]:border-brand data-[state=active]:bg-transparent"
                >
                  Overview
                </TabsTrigger>
                <TabsTrigger
                  value="reviews"
                  className="rounded-none border-b-2 border-transparent data-[state=active]:border-brand data-[state=active]:bg-transparent"
                >
                  Reviews
                </TabsTrigger>
                <TabsTrigger
                  value="achievements"
                  className="rounded-none border-b-2 border-transparent data-[state=active]:border-brand data-[state=active]:bg-transparent"
                >
                  Achievements{' '}
                  <Badge variant="secondary" className="ml-2">
                    {mentor.achievements?.sessionMilestones.length || 0}
                  </Badge>
                </TabsTrigger>
                <TabsTrigger
                  value="sessions"
                  className="rounded-none border-b-2 border-transparent data-[state=active]:border-brand data-[state=active]:bg-transparent"
                >
                  Group sessions
                </TabsTrigger>
              </TabsList>

              {/* Overview Tab */}
              <TabsContent value="overview" className="mt-6 space-y-6">
                    {/* Bio Section */}
                    <Card className="rounded-2xl shadow-sm">
                      <CardContent className="p-6">
                        <div className="prose max-w-none">
                          <p className="text-gray-700 whitespace-pre-line">
                            {showFullBio ? mentor.fullBio : mentor.bio}
                          </p>
                          {mentor.fullBio && mentor.fullBio !== mentor.bio && (
                            <button
                              onClick={() => setShowFullBio(!showFullBio)}
                              className="text-brand hover:text-brand/90 font-medium mt-2"
                            >
                              {showFullBio ? 'Show less' : 'Show more'}
                            </button>
                          )}
                        </div>
                      </CardContent>
                    </Card>

                    {/* Profile Insights */}
                    {mentor.profileInsights && mentor.profileInsights.length > 0 && (
                      <Card className="rounded-2xl shadow-sm">
                        <CardContent className="p-6">
                          <h3 className="text-xl font-bold text-brand-dark mb-4">
                            Profile insights
                          </h3>
                          <div className="space-y-4">
                            {mentor.profileInsights.map((insight, idx) => (
                              <div key={idx} className="flex items-start gap-4">
                                <div className="p-3 bg-blue-100 rounded-lg">
                                  <Award className="h-6 w-6 text-blue-600" />
                                </div>
                                <div>
                                  <h4 className="font-semibold text-gray-900">
                                    {insight.title}
                                  </h4>
                                  <p className="text-sm text-gray-600">{insight.period}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    )}

                    {/* Background Section */}
                    <Card className="rounded-2xl shadow-sm">
                      <CardContent className="p-6">
                        <h3 className="text-xl font-bold text-brand-dark mb-4">Background</h3>

                        {/* Expertise */}
                        <div className="mb-6">
                          <h4 className="text-sm font-medium text-gray-700 mb-3">Expertise</h4>
                          <div className="flex flex-wrap gap-2">
                            {mentor.expertise.map((skill) => (
                              <Badge
                                key={skill}
                                variant="secondary"
                                className="bg-red-100 text-red-700 hover:bg-red-200"
                              >
                                {skill}
                              </Badge>
                            ))}
                          </div>
                        </div>

                        {/* Disciplines */}
                        <div className="mb-6">
                          <h4 className="text-sm font-medium text-gray-700 mb-3">
                            Disciplines
                          </h4>
                          <div className="flex flex-wrap gap-2">
                            {mentor.disciplines.map((discipline) => (
                              <Badge key={discipline} variant="outline">
                                {discipline}
                              </Badge>
                            ))}
                          </div>
                        </div>

                        {/* Languages */}
                        <div>
                          <h4 className="text-sm font-medium text-gray-700 mb-3">
                            Fluent in
                          </h4>
                          <div className="flex flex-wrap gap-2">
                            {mentor.languages.map((language) => (
                              <Badge key={language} variant="outline">
                                {language}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Experience */}
                    <Card className="rounded-2xl shadow-sm">
                      <CardContent className="p-6">
                        <div className="flex items-center gap-2 mb-4">
                          <h3 className="text-xl font-bold text-brand-dark">Experience</h3>
                          <Badge variant="secondary">
                            {mentor.experience.length}
                          </Badge>
                        </div>
                        <div className="space-y-4">
                          {mentor.experience.map((exp, idx) => (
                            <div key={idx} className="flex gap-4">
                              <div className="p-3 bg-brand-light/20 rounded-lg h-fit">
                                <Briefcase className="h-5 w-5 text-brand" />
                              </div>
                              <div className="flex-1">
                                <h4 className="font-semibold text-gray-900">{exp.title}</h4>
                                <p className="text-gray-700">{exp.company}</p>
                                <div className="flex items-center gap-2 mt-1">
                                  <p className="text-sm text-gray-600">{exp.period}</p>
                                  {exp.current && (
                                    <Badge variant="secondary" className="text-xs">
                                      PRESENT
                                    </Badge>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>

                    {/* Education */}
                    {mentor.education && mentor.education.length > 0 && (
                      <Card className="rounded-2xl shadow-sm">
                        <CardContent className="p-6">
                          <h3 className="text-xl font-bold text-brand-dark mb-4">Education</h3>
                          <div className="space-y-4">
                            {mentor.education.map((edu, idx) => (
                              <div key={idx} className="flex gap-4">
                                <div className="p-3 bg-purple-100 rounded-lg h-fit">
                                  <GraduationCap className="h-5 w-5 text-purple-700" />
                                </div>
                                <div>
                                  <h4 className="font-semibold text-gray-900">{edu.degree}</h4>
                                  <p className="text-gray-700">{edu.institution}</p>
                                  <p className="text-sm text-gray-600">{edu.year}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    )}
              </TabsContent>

              {/* Reviews Tab */}
              <TabsContent value="reviews" className="mt-6 space-y-6">
                    <Card className="rounded-2xl shadow-sm">
                      <CardContent className="p-6">
                        <div className="mb-6">
                          <div className="flex items-center gap-4 mb-4">
                            <div className="text-center">
                              <div className="text-4xl font-bold text-brand-dark">
                                {mentor.rating}
                              </div>
                              <div className="flex items-center gap-1 mt-1">
                                {[...Array(5)].map((_, i) => (
                                  <Star
                                    key={i}
                                    className={`h-4 w-4 ${
                                      i < Math.floor(mentor.rating)
                                        ? 'fill-yellow-400 text-yellow-400'
                                        : 'text-gray-300'
                                    }`}
                                  />
                                ))}
                              </div>
                              <p className="text-sm text-gray-600 mt-1">
                                {mentor.reviewCount} reviews
                              </p>
                            </div>
                          </div>
                        </div>

                        {mentor.reviews && mentor.reviews.length > 0 ? (
                          <div className="space-y-6">
                            {mentor.reviews.map((review) => (
                              <div key={review.id} className="border-t pt-6 first:border-t-0 first:pt-0">
                                <div className="flex items-start gap-4">
                                  <Avatar className="h-12 w-12">
                                    <AvatarImage
                                      src={review.reviewerAvatar}
                                      alt={review.reviewerName}
                                    />
                                    <AvatarFallback>
                                      {getInitials(review.reviewerName)}
                                    </AvatarFallback>
                                  </Avatar>
                                  <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-2">
                                      <h4 className="font-semibold text-gray-900">
                                        {review.reviewerName}
                                      </h4>
                                      <span className="text-gray-400">•</span>
                                      <p className="text-sm text-gray-600">{review.date}</p>
                                    </div>
                                    <p className="text-sm text-gray-600 mb-2">
                                      {review.reviewerTitle}
                                    </p>
                                    <div className="flex items-center gap-1 mb-3">
                                      {[...Array(5)].map((_, i) => (
                                        <Star
                                          key={i}
                                          className={`h-4 w-4 ${
                                            i < review.rating
                                              ? 'fill-yellow-400 text-yellow-400'
                                              : 'text-gray-300'
                                          }`}
                                        />
                                      ))}
                                    </div>
                                    <p className="text-gray-700 mb-3">{review.comment}</p>
                                    <Button variant="ghost" size="sm" className="text-gray-600">
                                      <ThumbsUp className="h-4 w-4 mr-1" />
                                      Helpful ({review.helpful})
                                    </Button>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="text-center py-8 text-gray-500">
                            <p>No reviews yet</p>
                          </div>
                        )}
                      </CardContent>
                </Card>
              </TabsContent>

              {/* Achievements Tab */}
              <TabsContent value="achievements" className="mt-6 space-y-6">
                    {/* Session Milestones */}
                    {mentor.achievements?.sessionMilestones && (
                      <Card className="rounded-2xl shadow-sm">
                        <CardContent className="p-6">
                          <h3 className="text-xl font-bold text-brand-dark mb-6">
                            Session Milestones
                          </h3>
                          <div className="space-y-4">
                            {mentor.achievements.sessionMilestones.map((milestone, idx) => (
                              <div key={idx} className="flex items-center gap-4">
                                <div className="w-16 h-16 bg-yellow-100 rounded-lg flex items-center justify-center">
                                  <Rocket className="h-8 w-8 text-yellow-600" />
                                </div>
                                <div className="flex-1">
                                  <h4 className="font-semibold text-gray-900">
                                    {milestone.title}
                                  </h4>
                                  <button className="text-sm text-brand hover:underline">
                                    See credentials →
                                  </button>
                                </div>
                                <p className="text-sm text-gray-600">{milestone.date}</p>
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    )}

                    {/* Community Recognition */}
                    {mentor.achievements?.communityRecognition && (
                      <Card className="rounded-2xl shadow-sm">
                        <CardContent className="p-6">
                          <h3 className="text-xl font-bold text-brand-dark mb-6">
                            Community Recognition
                          </h3>
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                            {mentor.achievements.communityRecognition.map((badge, idx) => {
                              const badgeColors = {
                                green: 'bg-green-100 text-green-700',
                                red: 'bg-red-100 text-red-700',
                                blue: 'bg-blue-100 text-blue-700',
                              };
                              return (
                                <div key={idx} className="text-center">
                                  <div
                                    className={`w-24 h-24 mx-auto rounded-full flex items-center justify-center mb-3 ${
                                      badgeColors[badge.color as keyof typeof badgeColors]
                                    }`}
                                  >
                                    <Award className="h-12 w-12" />
                                  </div>
                                  <h4 className="font-semibold text-gray-900 mb-1">
                                    {badge.title}
                                  </h4>
                                  <p className="text-sm text-yellow-600 font-medium mb-2">
                                    {badge.date}
                                  </p>
                                  <button className="text-sm text-brand hover:underline">
                                    See credentials →
                                  </button>
                                </div>
                              );
                            })}
                          </div>
                        </CardContent>
                      </Card>
                )}
              </TabsContent>

              {/* Group Sessions Tab */}
              <TabsContent value="sessions" className="mt-6">
                    <Card className="rounded-2xl shadow-sm">
                      <CardContent className="p-12 text-center">
                        <p className="text-gray-500">No group sessions available</p>
                      </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>

          {/* Right Sidebar - Booking Widget & Stats */}
          <div className="lg:w-96 space-y-6 flex-shrink-0">
            {/* Community Statistics */}
            <Card className="rounded-2xl shadow-sm bg-white">
              <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-bold text-brand-dark">Community statistics</h3>
                    <button className="text-sm text-brand hover:underline">
                      See more
                    </button>
                  </div>
                  <div className="space-y-4">
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-blue-100 rounded-lg">
                        <Rocket className="h-6 w-6 text-blue-600" />
                      </div>
                      <div>
                        <p className="text-2xl font-bold text-brand-dark">
                          {mentor.totalMentoringTime} mins
                        </p>
                        <p className="text-sm text-gray-600">Total mentoring time</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-red-100 rounded-lg">
                        <Star className="h-6 w-6 text-red-600" />
                      </div>
                      <div>
                        <p className="text-2xl font-bold text-brand-dark">
                          {mentor.sessionsCompleted}
                        </p>
                        <p className="text-sm text-gray-600">Sessions completed</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Booking Widget */}
              {availableSlots && availableSlots.length > 0 && (
                <Card className="rounded-2xl shadow-sm bg-white">
                  <CardContent className="p-6">
                    <h3 className="text-lg font-bold text-brand-dark mb-4">
                      Available sessions
                    </h3>
                    <p className="text-sm text-gray-600 mb-4">
                      Book 1:1 sessions from the options based on your needs
                    </p>

                    {/* Date Selector */}
                    <div className="mb-6">
                      <div className="flex items-center justify-between mb-3">
                        <Button variant="ghost" size="sm">
                          <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm">
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                      </div>
                      <div className="grid grid-cols-4 gap-2">
                        {availableSlots.map((slot) => {
                          const date = new Date(slot.date);
                          const day = date.getDate();
                          return (
                            <button
                              key={slot.date}
                              onClick={() => {
                                setSelectedDate(slot.date);
                                setSelectedTimeSlot(slot.slots[0]);
                              }}
                              className={`p-3 rounded-lg border-2 text-center transition-colors ${
                                selectedDate === slot.date
                                  ? 'border-brand bg-brand-light/10'
                                  : 'border-gray-200 hover:border-gray-300'
                              }`}
                            >
                              <div className="text-xs text-gray-600 font-medium mb-1">
                                {slot.dayName}
                              </div>
                              <div className="text-lg font-bold text-brand-dark mb-1">
                                {day} Oct
                              </div>
                              <div className="text-xs text-brand font-medium">
                                {slot.slots.length} slots
                              </div>
                            </button>
                          );
                        })}
                      </div>
                      <button className="text-sm text-brand hover:underline mt-3 w-full text-center">
                        View all →
                      </button>
                    </div>

                    {/* Time Slots */}
                    {selectedDateSlots && (
                      <div className="mb-6">
                        <h4 className="font-semibold text-gray-900 mb-3 flex items-center justify-between">
                          Available time slots
                          <ChevronRight className="h-4 w-4" />
                        </h4>
                        <div className="grid grid-cols-3 gap-2">
                          {selectedDateSlots.slots.map((time) => (
                            <button
                              key={time}
                              onClick={() => setSelectedTimeSlot(time)}
                              className={`p-2 rounded-lg border-2 text-sm font-medium transition-colors ${
                                selectedTimeSlot === time
                                  ? 'border-brand bg-brand-light/10 text-brand'
                                  : 'border-gray-200 hover:border-gray-300 text-gray-700'
                              }`}
                            >
                              {time}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Book Button */}
                    <Button
                      onClick={handleBooking}
                      className="w-full bg-brand hover:bg-brand/90 py-6 text-lg font-medium"
                    >
                      Book Session for {selectedDate && new Date(selectedDate).getDate()} Oct{' '}
                      2025
                    </Button>
                  </CardContent>
                </Card>
              )}

              {/* Similar Mentors */}
              <Card className="rounded-2xl shadow-sm">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-bold text-brand-dark">Similar mentor profiles</h3>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="sm">
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm">
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <div className="space-y-4">
                    {similarMentors.map((similarMentor) => (
                      <Link
                        key={similarMentor.id}
                        href={`/mentor/${similarMentor.id}`}
                        className="flex items-center gap-3 p-3 hover:bg-gray-50 rounded-lg transition-colors"
                      >
                        <Avatar className="h-16 w-16">
                          <AvatarImage
                            src={similarMentor.avatar}
                            alt={similarMentor.name}
                          />
                          <AvatarFallback>
                            {getInitials(similarMentor.name)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold text-gray-900 truncate">
                            {similarMentor.name}
                          </h4>
                          <p className="text-sm text-gray-600 truncate">
                            {similarMentor.title}
                          </p>
                          <p className="text-xs text-gray-500 truncate">
                            {similarMentor.company}
                          </p>
                        </div>
                      </Link>
                    ))}
                  </div>
                </CardContent>
              </Card>
          </div>
        </div>
      </div>

      {/* Booking Dialog */}
      <BookingDialog
        open={bookingDialogOpen}
        onOpenChange={setBookingDialogOpen}
        mentorId={mentorId}
        mentorName={mentor.name}
        selectedDate={selectedDate}
        selectedTimeSlot={selectedTimeSlot}
      />
    </div>
  );
}
