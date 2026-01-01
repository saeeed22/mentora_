'use client';

import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { mentorsApi } from '@/lib/api/mentors-api';
import { bookingsApi } from '@/lib/api/bookings-api';
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
  Loader2,
  Clock,
} from 'lucide-react';
import Link from 'next/link';
import { BookingDialog } from '@/components/booking-dialog';
import type { AvailabilitySlot, BackendAvailabilitySlot, MentorDetailResponse } from '@/lib/types';
import { messagingApi } from '@/lib/api/messaging-api';
import { auth } from '@/lib/api/auth';
import { useRouter } from 'next/navigation';
import { parseDateAsUTC } from '@/lib/datetime-utils';

// MentorProfile interface (previously from mock-mentors)
interface MentorProfile {
  id: string;
  name: string;
  title: string;
  company: string;
  location: string;
  avatar: string;
  coverImage?: string;
  bio: string;
  fullBio?: string;
  expertise: string[];
  disciplines: string[];
  languages: string[];
  rating: number;
  reviewCount: number;
  sessionsCompleted: number;
  totalMentoringTime: number;
  responseTime: string;
  availability: string;
  isOnline: boolean;
  socialLinks?: {
    linkedin?: string;
    twitter?: string;
    website?: string;
  };
  achievements?: {
    sessionMilestones: {
      count: number;
      title: string;
      date: string;
    }[];
    communityRecognition: {
      title: string;
      rank: string;
      date: string;
      color: string;
    }[];
  };
  experience: {
    title: string;
    company: string;
    period: string;
    current?: boolean;
  }[];
  education?: {
    degree: string;
    institution: string;
    year: string;
  }[];
  profileInsights?: {
    title: string;
    description: string;
    period: string;
  }[];
  reviews?: {
    id: string;
    reviewerName: string;
    reviewerAvatar: string;
    reviewerTitle: string;
    rating: number;
    comment: string;
    date: string;
    helpful: number;
  }[];
  availability_slots?: {
    date: string;
    dayName: string;
    slots: string[];
  }[];
}

// Convert backend availability slots to frontend format
function convertBackendSlots(backendSlots: BackendAvailabilitySlot[]): AvailabilitySlot[] {
  const dayNames = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
  const slotsByDate = new Map<string, { display: string; iso: string; isGroup?: boolean; groupTier?: number | null }[]>();

  backendSlots.forEach(slot => {
    const startDate = new Date(slot.start_at);
    const dateKey = startDate.toISOString().split('T')[0]; // YYYY-MM-DD
    const timeStr = startDate.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });

    if (!slotsByDate.has(dateKey)) {
      slotsByDate.set(dateKey, []);
    }
    
    // Use group_tier if available, fall back to is_group for backwards compatibility
    // Solo = null or 1, Group = 2, 3, 4, 5, 10, etc.
    const groupTier = slot.group_tier !== undefined ? slot.group_tier : (slot.is_group ? null : null);
    const isGroup = groupTier !== null && groupTier !== undefined && groupTier > 1 ? true : false;
    console.log('[convertBackendSlots] Processing slot:', { time: timeStr, group_tier: slot.group_tier, groupTier, isGroup });
    
    slotsByDate.get(dateKey)!.push({ 
      display: timeStr, 
      iso: slot.start_at, 
      isGroup,
      groupTier
    });
  });

  // Convert to array and sort by date
  const result: AvailabilitySlot[] = [];
  slotsByDate.forEach((slotsData, date) => {
    // Parse date as UTC to avoid timezone shifts
    const dateObj = parseDateAsUTC(date);
    // Sort by ISO time
    const sorted = slotsData.sort((a, b) => a.iso.localeCompare(b.iso));
    result.push({
      date,
      dayName: dayNames[dateObj.getUTCDay()],
      slots: sorted.map(s => s.display),
      slotTimes: sorted.map(s => s.iso),
      slotGroupFlags: sorted.map(s => !!s.isGroup),
      slotGroupTiers: sorted.map(s => s.groupTier ?? null),
    });
  });

  return result.sort((a, b) => a.date.localeCompare(b.date));
}

export default function MentorProfilePage() {
  const params = useParams();
  const router = useRouter();
  const mentorId = params.id as string;

  const [mentor, setMentor] = useState<MentorProfile | null>(null);
  const [backendMentor, setBackendMentor] = useState<MentorDetailResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [similarMentors, setSimilarMentors] = useState<MentorProfile[]>([]);
  const [isViewerMentor, setIsViewerMentor] = useState(false);
  const [viewerId, setViewerId] = useState<string | null>(null);
  const [isOwnProfile, setIsOwnProfile] = useState(false);

  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedSlotIndex, setSelectedSlotIndex] = useState<number | null>(null);
  const [selectedSlotStartTime, setSelectedSlotStartTime] = useState<string | null>(null); // ISO timestamp for booking
  const [selectedSlotIsGroup, setSelectedSlotIsGroup] = useState<boolean | null>(null);
  const [selectedSlotGroupTier, setSelectedSlotGroupTier] = useState<number | null>(null);
  const [showFullBio, setShowFullBio] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);
  const [bookingDialogOpen, setBookingDialogOpen] = useState(false);
  const [availableSlots, setAvailableSlots] = useState<AvailabilitySlot[]>([]);
  const [availabilityLoading, setAvailabilityLoading] = useState(true);
  const [mentorReviews, setMentorReviews] = useState<Array<{
    id: string;
    rating: number;
    comment?: string;
    created_at: string;
    mentee_id: string;
  }>>([]);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [reviewsTotal, setReviewsTotal] = useState(0);

  // Load mentor from API
  useEffect(() => {
    // Check if viewer is a mentor
    const currentUser = auth.getCurrentUser();
    if (currentUser) {
      setIsViewerMentor(currentUser.role === 'mentor');
      setViewerId(currentUser.id);
      setIsOwnProfile(currentUser.id === mentorId);
    }

    let mounted = true;
    (async () => {
      setIsLoading(true);

      // Try backend API first
      const result = await mentorsApi.getMentorById(mentorId);

      if (result.success && result.data && mounted) {
        // Convert backend response to MentorProfile format
        const backendMentorData = result.data;
        setBackendMentor(backendMentorData);
        const convertedMentor: MentorProfile = {
          id: (backendMentorData as { id?: string }).id || mentorId,
          name: backendMentorData.profile?.full_name || 'Unknown Mentor',
          avatar: backendMentorData.profile?.avatar_url || '/mentor_fallback_1.jpg',
          title: backendMentorData.mentor_profile?.headline || 'Mentor',
          company: backendMentorData.mentor_profile?.current_company || '',
          location: 'Pakistan',
          bio: backendMentorData.profile?.bio || 'Passionate about sharing knowledge and helping others grow in their career journey.',
          fullBio: backendMentorData.profile?.bio || 'Passionate about sharing knowledge and helping others grow in their career journey. Book a session to learn more!',
          expertise: backendMentorData.mentor_profile?.skills?.length > 0
            ? backendMentorData.mentor_profile.skills
            : ['Mentorship', 'Career Guidance', 'Professional Development'],
          disciplines: ['General'],
          languages: backendMentorData.profile?.languages?.length > 0
            ? backendMentorData.profile.languages
            : ['English'],
          rating: backendMentorData.mentor_profile?.rating_avg || 0,
          reviewCount: backendMentorData.mentor_profile?.rating_count || 0,
          sessionsCompleted: backendMentorData.stats?.total_sessions || 0,
          totalMentoringTime: (backendMentorData.stats?.total_sessions || 0) * 60,
          experience: [
            {
              title: backendMentorData.mentor_profile?.current_role || 'Mentor',
              company: backendMentorData.mentor_profile?.current_company || 'Mentora',
              period: `${backendMentorData.mentor_profile?.experience_years || 0}+ years experience`,
              current: true
            }
          ],
          reviews: [],
          isOnline: false,
          responseTime: `${backendMentorData.stats?.response_time_hours || 24} hours`,
          availability: 'Check availability below',
        };
        setMentor(convertedMentor);
        setSimilarMentors([]); // No similar mentors from backend yet
      } else if (mounted) {
        // No mentor found - show not found state
        setMentor(null);
        setSimilarMentors([]);
      }

      if (mounted) setIsLoading(false);
    })();
    return () => { mounted = false; };
  }, [mentorId]);

  // Load available slots from backend API
  useEffect(() => {
    if (!mentor) return;
    let mounted = true;
    setAvailabilityLoading(true);
    (async () => {
      // Get date range for next 28 days
      const fromDate = new Date();
      const toDate = new Date();
      toDate.setDate(toDate.getDate() + 28);

      const fromDateStr = fromDate.toISOString().split('T')[0];
      const toDateStr = toDate.toISOString().split('T')[0];

      console.log('[Availability] Fetching from:', fromDateStr, 'to:', toDateStr);
      const result = await mentorsApi.getMentorAvailability(mentorId, fromDateStr, toDateStr);
      console.log('[Availability] API Response:', result);
      console.log('[Availability] These slots are generated from the mentor\'s availability templates');

      if (!mounted) return;

      if (result.success && result.data) {
        console.log('[Availability] ✓ Received', result.data.slots.length, 'slots from backend');
        if (result.data.slots.length > 0) {
          console.log('[Availability] Raw slots from backend:', result.data.slots);
          const slots = convertBackendSlots(result.data.slots);
          console.log('[Availability] Converted slots:', slots);
          setAvailableSlots(slots);
          if (slots.length > 0) {
            setSelectedDate(slots[0].date);
            if (slots[0].slots.length > 0) {
              setSelectedSlotIndex(0);
              setSelectedSlotStartTime(slots[0].slotTimes[0]);
              setSelectedSlotIsGroup(slots[0].slotGroupFlags ? !!slots[0].slotGroupFlags[0] : null);
            }
          }
        } else {
          // No availability from backend
          console.warn('[Availability] ⚠ Backend returned 0 slots. This means either:');
          console.warn('  1. No templates exist for this mentor');
          console.warn('  2. Backend slot generation failed to process is_recurring/specific_date fields');
          console.warn('  3. Date range doesn\'t match any templates');
          setAvailableSlots([]);
        }
      }
      setAvailabilityLoading(false);
    })();
    return () => { mounted = false; };
  }, [mentorId, mentor]);

  // Load reviews from backend API
  useEffect(() => {
    if (!mentor) return;
    let mounted = true;
    (async () => {
      setReviewsLoading(true);
      const result = await bookingsApi.getMentorReviews(mentorId, 1, 20);
      if (!mounted) return;

      if (result.success && result.data) {
        setMentorReviews(result.data.data);
        setReviewsTotal(result.data.total);
      }
      setReviewsLoading(false);
    })();
    return () => { mounted = false; };
  }, [mentorId, mentor]);

  // Handle message button click
  const handleMessage = async () => {
    const currentUser = auth.getCurrentUser();
    if (!currentUser) {
      router.push('/login');
      return;
    }

    try {
      // Create or get existing conversation with mentor
      const result = await messagingApi.createConversation([currentUser.id, mentorId]);
      if (result.success && result.data) {
        router.push(`/messages?conversation=${result.data.id}`);
      } else {
        // Still try to navigate to messages
        router.push('/messages');
      }
    } catch {
      router.push('/messages');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-brand mx-auto mb-4" />
          <p className="text-gray-600">Loading mentor profile...</p>
        </div>
      </div>
    );
  }

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
    if (!selectedDate || !selectedSlotStartTime) {
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
                        onClick={async () => {
                          const currentUser = auth.getCurrentUser();
                          if (!currentUser) { router.push('/login'); return; }
                          if (currentUser.role !== 'mentee') return; // mentees initiate
                          const result = await messagingApi.createConversation([currentUser.id, mentorId]);
                          if (result.success && result.data) {
                            router.push(`/messages?c=${result.data.id}`);
                          }
                        }}
                      >
                        <MessageCircle className="h-5 w-5" />
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
                  Reviews ({reviewsTotal > 0 ? reviewsTotal : mentor.reviewCount})
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
                                className={`h-4 w-4 ${i < Math.floor(mentor.rating)
                                  ? 'fill-yellow-400 text-yellow-400'
                                  : 'text-gray-300'
                                  }`}
                              />
                            ))}
                          </div>
                          <p className="text-sm text-gray-600 mt-1">
                            {reviewsTotal > 0 ? reviewsTotal : mentor.reviewCount} reviews
                          </p>
                        </div>
                      </div>
                    </div>

                    {reviewsLoading ? (
                      <div className="flex items-center justify-center py-8">
                        <Loader2 className="h-6 w-6 animate-spin text-brand" />
                      </div>
                    ) : mentorReviews.length > 0 ? (
                      <div className="space-y-6">
                        {mentorReviews.map((review) => (
                          <div key={review.id} className="border-t pt-6 first:border-t-0 first:pt-0">
                            <div className="flex items-start gap-4">
                              <Avatar className="h-12 w-12">
                                <AvatarFallback className="bg-brand-light/20 text-brand">
                                  {review.mentee_id.slice(0, 2).toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                  <h4 className="font-semibold text-gray-900">
                                    Mentee
                                  </h4>
                                  <span className="text-gray-400">•</span>
                                  <p className="text-sm text-gray-600">
                                    {new Date(review.created_at).toLocaleDateString('en-US', {
                                      year: 'numeric',
                                      month: 'short',
                                      day: 'numeric'
                                    })}
                                  </p>
                                </div>
                                <div className="flex items-center gap-1 mb-3">
                                  {[...Array(5)].map((_, i) => (
                                    <Star
                                      key={i}
                                      className={`h-4 w-4 ${i < review.rating
                                        ? 'fill-yellow-400 text-yellow-400'
                                        : 'text-gray-300'
                                        }`}
                                    />
                                  ))}
                                </div>
                                {review.comment && (
                                  <p className="text-gray-700 mb-3">{review.comment}</p>
                                )}
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
                                className={`w-24 h-24 mx-auto rounded-full flex items-center justify-center mb-3 ${badgeColors[badge.color as keyof typeof badgeColors]
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
            {/* Statistics */}
            {backendMentor && (backendMentor.stats?.total_sessions > 0 || backendMentor.mentor_profile?.rating_avg > 0) && (
              <Card className="rounded-2xl shadow-sm bg-white">
                <CardContent className="p-6">
                  <h3 className="text-lg font-bold text-brand-dark mb-4">Statistics</h3>
                  <div className="space-y-4">
                    {/* Sessions Completed */}
                    {backendMentor.stats && backendMentor.stats.total_sessions > 0 && (
                      <div className="flex items-center gap-4">
                        <div className="p-3 bg-blue-100 rounded-lg">
                          <Star className="h-6 w-6 text-blue-600" />
                        </div>
                        <div>
                          <p className="text-2xl font-bold text-brand-dark">
                            {backendMentor.stats.total_sessions}
                          </p>
                          <p className="text-sm text-gray-600">Sessions completed</p>
                        </div>
                      </div>
                    )}

                    {/* Rating */}
                    {backendMentor.mentor_profile?.rating_avg > 0 && (
                      <div className="flex items-center gap-4">
                        <div className="p-3 bg-yellow-100 rounded-lg">
                          <Star className="h-6 w-6 text-yellow-600 fill-yellow-600" />
                        </div>
                        <div>
                          <p className="text-2xl font-bold text-brand-dark">
                            {backendMentor.mentor_profile.rating_avg.toFixed(1)}
                          </p>
                          <p className="text-sm text-gray-600">Average rating</p>
                        </div>
                      </div>
                    )}

                    {/* Active Mentees */}
                    {backendMentor.stats?.active_mentees !== undefined && backendMentor.stats.active_mentees > 0 && (
                      <div className="flex items-center gap-4">
                        <div className="p-3 bg-green-100 rounded-lg">
                          <Rocket className="h-6 w-6 text-green-600" />
                        </div>
                        <div>
                          <p className="text-2xl font-bold text-brand-dark">
                            {backendMentor.stats.active_mentees}
                          </p>
                          <p className="text-sm text-gray-600">Active mentees</p>
                        </div>
                      </div>
                    )}

                    {/* Response Time */}
                    {backendMentor.stats?.response_time_hours && backendMentor.stats.response_time_hours < 72 && (
                      <div className="flex items-center gap-4">
                        <div className="p-3 bg-purple-100 rounded-lg">
                          <Clock className="h-6 w-6 text-purple-600" />
                        </div>
                        <div>
                          <p className="text-2xl font-bold text-brand-dark">
                            ~{backendMentor.stats.response_time_hours}h
                          </p>
                          <p className="text-sm text-gray-600">Response time</p>
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Booking Widget */}
            {availableSlots && availableSlots.length > 0 && !isViewerMentor && (
              <Card className="rounded-2xl shadow-sm bg-white">
                <CardContent className="p-6">
                  <h3 className="text-lg font-bold text-brand-dark mb-2">
                    Available sessions
                  </h3>
                  <p className="text-xs text-gray-500 mb-4">
                    These slots are set by the mentor in their availability schedule
                  </p>

                  {/* Date Selector */}
                  <div className="mb-6">
                    <h4 className="text-sm font-semibold text-gray-900 mb-3">Select a date</h4>
                    <div className="grid grid-cols-4 gap-2">
                      {availableSlots.map((slot) => {
                        const date = new Date(slot.date);
                        const day = date.getDate();
                        return (
                          <button
                            key={slot.date}
                            onClick={() => {
                              setSelectedDate(slot.date);
                              setSelectedSlotIndex(0);
                              setSelectedSlotStartTime(slot.slotTimes[0]);
                              setSelectedSlotIsGroup(slot.slotGroupFlags ? !!slot.slotGroupFlags[0] : null);
                              setSelectedSlotGroupTier(slot.slotGroupTiers ? slot.slotGroupTiers[0] ?? null : null);
                            }}
                            className={`p-3 rounded-lg border-2 text-center transition-colors ${selectedDate === slot.date
                              ? 'border-brand bg-brand-light/10'
                              : 'border-gray-200 hover:border-gray-300'
                              }`}
                          >
                            <div className="text-xs text-gray-600 font-medium mb-1">
                              {slot.dayName}
                            </div>
                            <div className="text-lg font-bold text-brand-dark mb-1">
                              {day} {date.toLocaleDateString('en-US', { month: 'short' })}
                            </div>
                            <div className="text-xs text-brand font-medium">
                              {slot.slots.length} slots
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Time Slots */}
                  {selectedDateSlots && (
                    <div className="mb-6">
                      <h4 className="font-semibold text-gray-900 mb-3">
                        Available time slots
                      </h4>
                      {selectedSlotIsGroup && (
                        <div className="mb-3 inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-semibold">
                          <span className="h-2 w-2 rounded-full bg-emerald-500" />
                          This slot supports group sessions
                        </div>
                      )}
                      <div className="grid grid-cols-2 gap-3">
                        {selectedDateSlots.slots.map((time, idx) => {
                          const groupTier = selectedDateSlots.slotGroupTiers?.[idx] ?? null;
                          // Solo = null or 1, Group = 2+ participants
                          const isGroup = groupTier !== null && groupTier !== undefined && groupTier > 1;
                          return (
                            <button
                              key={idx}
                              onClick={() => {
                                setSelectedSlotIndex(idx);
                                setSelectedSlotStartTime(selectedDateSlots.slotTimes[idx]);
                                setSelectedSlotIsGroup(selectedDateSlots.slotGroupFlags ? !!selectedDateSlots.slotGroupFlags[idx] : null);
                                setSelectedSlotGroupTier(groupTier);
                              }}
                              className={`p-3 rounded-lg border-2 text-left transition-colors ${
                                selectedSlotIndex === idx
                                  ? 'border-brand bg-brand-light/10'
                                  : 'border-gray-200 hover:border-gray-300'
                              }`}
                            >
                              <div className="flex items-center justify-between mb-1">
                                <span className={`text-sm font-semibold ${
                                  selectedSlotIndex === idx ? 'text-brand' : 'text-gray-900'
                                }`}>
                                  {time}
                                </span>
                                {isGroup ? (
                                  <Badge variant="secondary" className="text-xs bg-emerald-100 text-emerald-700 border-emerald-200">
                                    Group of {groupTier}
                                  </Badge>
                                ) : (
                                  <Badge variant="secondary" className="text-xs bg-blue-100 text-blue-700 border-blue-200">
                                    Solo
                                  </Badge>
                                )}
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Book Button */}
                  <Button
                    onClick={handleBooking}
                    className="w-full bg-brand hover:bg-brand/90 py-6 text-lg font-medium"
                  >
                    Book Session for{' '}
                    {selectedDate && new Date(selectedDate).toLocaleDateString('en-US', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric'
                    })}
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* No Availability Message */}
            {!availabilityLoading && availableSlots.length === 0 && !isViewerMentor && (
              <Card className="rounded-2xl shadow-sm bg-white border-dashed border-2 border-gray-200">
                <CardContent className="p-6 text-center">
                  <div className="mb-3">
                    <Clock className="h-10 w-10 text-gray-400 mx-auto" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-700 mb-2">
                    No availability set
                  </h3>
                  <p className="text-sm text-gray-500 mb-4">
                    This mentor hasn&apos;t configured their availability schedule yet. Check back later or send them a message.
                  </p>
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={handleMessage}
                  >
                    <MessageCircle className="h-4 w-4 mr-2" />
                    Send Message
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Mentor viewing another mentor */}
            {isViewerMentor && !isOwnProfile && (
              <Card className="rounded-2xl shadow-sm bg-white border-2 border-blue-200">
                <CardContent className="p-6 text-center">
                  <div className="mb-3">
                    <Briefcase className="h-10 w-10 text-blue-600 mx-auto" />
                  </div>
                  <h3 className="text-lg font-semibold text-blue-900 mb-2">
                    Mentor Profile View
                  </h3>
                  <p className="text-sm text-gray-600 mb-4">
                    You&apos;re viewing this profile as a mentor. Booking is only available for mentees.
                  </p>
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={handleMessage}
                  >
                    <MessageCircle className="h-4 w-4 mr-2" />
                    Send Message
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Own profile view */}
            {isOwnProfile && (
              <Card className="rounded-2xl shadow-sm bg-white border-2 border-brand">
                <CardContent className="p-6 text-center">
                  <div className="mb-3">
                    <Star className="h-10 w-10 text-brand mx-auto" />
                  </div>
                  <h3 className="text-lg font-semibold text-brand-dark mb-2">
                    This is Your Profile
                  </h3>
                  <p className="text-sm text-gray-600 mb-4">
                    This is how mentees see your profile. Manage your availability and profile settings.
                  </p>
                  <Button
                    variant="default"
                    className="w-full bg-brand hover:bg-brand/90"
                    onClick={() => router.push('/profile')}
                  >
                    Edit Profile
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Availability Loading */}
            {availabilityLoading && (
              <Card className="rounded-2xl shadow-sm bg-white">
                <CardContent className="p-6 text-center">
                  <div className="animate-spin h-8 w-8 border-2 border-brand border-t-transparent rounded-full mx-auto mb-3" />
                  <p className="text-sm text-gray-500">Loading availability...</p>
                </CardContent>
              </Card>
            )}
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
        selectedTimeSlot={selectedDateSlots?.slots[selectedSlotIndex ?? 0] ?? ''}
        selectedSlotStartTime={selectedSlotStartTime}
        selectedSlotIsGroup={selectedSlotIsGroup}
      />
    </div>
  );
}
