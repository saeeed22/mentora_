'use client';

import React, { useState, useEffect } from 'react';
import { Search, Filter, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import MentorCard from '@/components/mentorcard';
import { mentorsApi } from '@/lib/api/mentors-api';
import { mockMentorProfiles } from '@/lib/mock-mentors';
import type { MentorDetailResponse } from '@/lib/types';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

// Convert backend mentor to card format
// Note: Backend returns { id, profile, mentor_profile } - no user or stats objects
const backendMentorToCard = (mentor: MentorDetailResponse) => ({
  id: (mentor as { id?: string }).id || mentor.user?.id || '',
  image: mentor.profile?.avatar_url || '',
  name: mentor.profile?.full_name || 'Unknown Mentor',
  countryCode: 'PK',
  jobTitle: mentor.mentor_profile?.headline || 'Mentor',
  company: '',
  sessions: mentor.stats?.total_sessions || 0,
  reviews: mentor.mentor_profile?.rating_count || 0,
  attendance: 95,
  experience: mentor.mentor_profile?.experience_years || 0,
  isTopRated: (mentor.mentor_profile?.rating_avg || 0) >= 4.8,
  isAvailableASAP: false,
});

// Fallback: Convert mock mentor profiles to card format
const mockMentorToCard = (mentor: typeof mockMentorProfiles[0]) => ({
  id: mentor.id,
  image: mentor.avatar,
  name: mentor.name,
  countryCode: mentor.location.includes('US') ? 'US' : 'NP',
  jobTitle: mentor.title,
  company: mentor.company,
  sessions: mentor.sessionsCompleted,
  reviews: mentor.reviewCount,
  attendance: 95,
  experience: 10,
  isTopRated: mentor.rating >= 4.8,
  isAvailableASAP: mentor.isOnline,
});

type MentorCardData = ReturnType<typeof backendMentorToCard>;

export default function ExplorePage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSkill, setSelectedSkill] = useState('all');
  const [sortBy, setSortBy] = useState<'rating' | 'experience' | 'price'>('rating');
  const [mentors, setMentors] = useState<MentorCardData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [usingMockData, setUsingMockData] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [skills, setSkills] = useState<string[]>([]);

  // Load mentors from API
  const loadMentors = async (reset = false) => {
    if (reset) {
      setPage(1);
      setMentors([]);
    }

    setIsLoading(true);

    const result = await mentorsApi.searchMentors({
      page: reset ? 1 : page,
      limit: 20,
      sort: sortBy,
      skills: selectedSkill !== 'all' ? [selectedSkill] : undefined,
    });

    if (result.success && result.data) {
      console.log('[Explore] API Response - Full Data:', JSON.stringify(result.data, null, 2));
      console.log('[Explore] Total mentors returned:', result.data.data.length);
      result.data.data.forEach((mentor, i) => {
        console.log(`[Explore] Mentor ${i + 1}:`, {
          user_id: mentor.user?.id,
          email: mentor.user?.email,
          name: mentor.profile?.full_name,
          headline: mentor.mentor_profile?.headline,
          skills: mentor.mentor_profile?.skills,
          rating: mentor.mentor_profile?.rating_avg,
        });
      });
      const cardData = result.data.data.map(backendMentorToCard);

      // Filter by search query on client side
      const filtered = searchQuery
        ? cardData.filter(m =>
          m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          m.jobTitle.toLowerCase().includes(searchQuery.toLowerCase())
        )
        : cardData;

      // If API returns empty data, fallback to mock
      if (filtered.length === 0 && !searchQuery) {
        console.log('[Explore] API returned empty, using mock data');
        const mockCards = mockMentorProfiles.map(mockMentorToCard);
        setMentors(mockCards);
        setSkills(Array.from(new Set(mockMentorProfiles.flatMap(m => m.expertise))).sort());
        setUsingMockData(true);
      } else {
        setMentors(prev => reset ? filtered : [...prev, ...filtered]);
        // Extract unique skills from mentors
        const allSkills = result.data.data.flatMap(m => m.mentor_profile.skills);
        setSkills(Array.from(new Set(allSkills)).sort());
        setUsingMockData(false);
      }
      setHasMore(result.data.hasNext);
    } else {
      // Fallback to mock data
      console.log('Using mock mentor data:', result.error);
      const mockCards = mockMentorProfiles.map(mockMentorToCard);

      const filtered = searchQuery
        ? mockCards.filter(m =>
          m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          m.jobTitle.toLowerCase().includes(searchQuery.toLowerCase())
        )
        : mockCards;

      setMentors(filtered);
      setHasMore(false);
      setSkills(Array.from(new Set(mockMentorProfiles.flatMap(m => m.expertise))).sort());
      setUsingMockData(true);
    }

    setIsLoading(false);
  };

  // Initial load
  useEffect(() => {
    loadMentors(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Reload when filters change
  useEffect(() => {
    const timer = setTimeout(() => {
      loadMentors(true);
    }, 300); // Debounce

    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery, selectedSkill, sortBy]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-brand-dark">Explore Mentors</h1>
          <p className="text-gray-600 mt-1">
            Discover experienced professionals ready to guide your journey
          </p>
        </div>
        <div className="text-sm text-gray-500">
          {mentors.length} mentors {usingMockData && '(demo data)'}
        </div>
      </div>

      {/* Search and Filters */}
      <Card className="rounded-2xl shadow-sm">
        <CardContent className="p-6">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  type="search"
                  placeholder="Search by name or expertise..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-3">
              <Select value={selectedSkill} onValueChange={setSelectedSkill}>
                <SelectTrigger className="w-full sm:w-[180px]">
                  <SelectValue placeholder="Skills" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Skills</SelectItem>
                  {skills.map((skill) => (
                    <SelectItem key={skill} value={skill}>
                      {skill}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={sortBy} onValueChange={(v) => setSortBy(v as typeof sortBy)}>
                <SelectTrigger className="w-full sm:w-[180px]">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="rating">Highest Rated</SelectItem>
                  <SelectItem value="experience">Most Experience</SelectItem>
                  <SelectItem value="price">Price</SelectItem>
                </SelectContent>
              </Select>

              <Button variant="outline" size="icon">
                <Filter className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Loading State */}
      {isLoading && mentors.length === 0 && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-brand" />
        </div>
      )}

      {/* Mentors Grid */}
      {!isLoading && mentors.length > 0 && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 auto-rows-fr">
            {mentors.map((mentor) => (
              <div key={mentor.id} className="flex justify-center items-stretch">
                <MentorCard mentor={mentor} />
              </div>
            ))}
          </div>

          {/* Load More */}
          {hasMore && (
            <div className="flex justify-center">
              <Button
                variant="outline"
                onClick={() => {
                  setPage(p => p + 1);
                  loadMentors();
                }}
                disabled={isLoading}
              >
                {isLoading ? 'Loading...' : 'Load More'}
              </Button>
            </div>
          )}
        </>
      )}

      {/* Empty State */}
      {!isLoading && mentors.length === 0 && (
        <Card className="rounded-2xl shadow-sm">
          <CardContent className="p-12 text-center">
            <Search className="mx-auto h-12 w-12 text-gray-300 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No mentors found</h3>
            <p className="text-gray-600 mb-4">
              Try adjusting your search criteria or browse all mentors.
            </p>
            <Button
              variant="outline"
              onClick={() => {
                setSearchQuery('');
                setSelectedSkill('all');
              }}
            >
              Clear Filters
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
