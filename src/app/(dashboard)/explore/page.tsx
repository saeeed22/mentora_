'use client';

import React, { useState, useEffect } from 'react';
import { Search, Filter, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import MentorCard from '@/components/mentorcard';
import { mentorsApi } from '@/lib/api/mentors-api';
import type { MentorDetailResponse } from '@/lib/types';
import { auth } from '@/lib/api/auth';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

// Mentoring niche categories
const MENTORING_NICHES = [
  { value: 'web_dev', label: 'Web Development' },
  { value: 'mobile_dev', label: 'Mobile Development' },
  { value: 'backend', label: 'Backend' },
  { value: 'frontend', label: 'Frontend' },
  { value: 'fullstack', label: 'Full Stack' },
  { value: 'devops', label: 'DevOps' },
  { value: 'data_science', label: 'Data Science' },
  { value: 'machine_learning', label: 'Machine Learning' },
  { value: 'cloud', label: 'Cloud Computing' },
  { value: 'ai_llm', label: 'AI & LLM' },
  { value: 'blockchain', label: 'Blockchain' },
  { value: 'product', label: 'Product Management' },
  { value: 'design', label: 'Design (UI/UX)' },
  { value: 'entrepreneurship', label: 'Entrepreneurship' },
  { value: 'business', label: 'Business' },
  { value: 'marketing', label: 'Marketing' },
  { value: 'sales', label: 'Sales' },
  { value: 'hr', label: 'Human Resources' },
  { value: 'other', label: 'Other' },
];

// Convert backend mentor to card format
// Note: Backend returns { id, profile, mentor_profile } - no user or stats objects
const backendMentorToCard = (mentor: MentorDetailResponse) => ({
  id: mentor.profile?.user_id || (mentor as { id?: string }).id || mentor.user?.id || '',
  image: mentor.profile?.avatar_url || '/mentor_fallback_1.jpg',
  name: mentor.profile?.full_name || 'Unknown Mentor',
  // TODO: Get country from backend profile.timezone or location field
  countryCode: mentor.profile?.timezone?.includes('Asia/Karachi') ? 'PK' : 'US',
  jobTitle: mentor.mentor_profile?.headline || 'Mentor',
  company: '', // Deprecated - kept for backwards compatibility
  current_role: mentor.mentor_profile?.current_role || undefined,
  current_company: mentor.mentor_profile?.current_company || undefined,
  sessions: mentor.stats?.total_sessions ?? 0,
  reviews: mentor.mentor_profile?.rating_count ?? 0,
  attendance: mentor.stats?.total_sessions ? 95 : 0, // Default if has sessions, 0 if none
  experience: mentor.mentor_profile?.experience_years ?? 0,
  price_per_session_solo: mentor.mentor_profile?.price_per_session_solo,
  isTopRated: (mentor.mentor_profile?.rating_avg ?? 0) >= 4.8,
  isAvailableASAP: true,
});

type MentorCardData = ReturnType<typeof backendMentorToCard>;

export default function ExplorePage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedNiche, setSelectedNiche] = useState('all');
  const [sortBy, setSortBy] = useState<'experience' | 'price'>('experience');
  const [priceRange, setPriceRange] = useState<'all' | '0-1000' | '1000-2000' | '2000-5000' | '5000+'>('all');
  const [mentors, setMentors] = useState<MentorCardData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [isCurrentUserMentor, setIsCurrentUserMentor] = useState(false);

  // Load mentors from API
  const loadMentors = async (reset = false) => {
    if (reset) {
      setPage(1);
      setMentors([]);
    }

    setIsLoading(true);

    // Only send 'experience' or 'rating' to backend (price sorting done client-side)
    const backendSort = sortBy === 'price' ? 'experience' : sortBy;

    const result = await mentorsApi.searchMentors({
      page: reset ? 1 : page,
      limit: 20,
      sort: backendSort as 'rating' | 'experience',
    });

    if (result.success && result.data) {
      console.log('[Explore] API Response:', {
        total: result.data.total,
        dataLength: result.data.data.length,
        rawData: result.data.data,
      });

      // Filter mentors who meet listing criteria:
      // - Must have experience > 0 years
      // - Must have complete profile
      // - Must match selected niche (if not 'all')
      const qualifiedMentors = result.data.data.filter(mentor => {
        const experience = mentor.mentor_profile?.experience_years ?? 0;
        const hasHeadline = mentor.mentor_profile?.headline && mentor.mentor_profile.headline.length > 0;
        const hasSkills = mentor.mentor_profile?.skills && mentor.mentor_profile.skills.length > 0;
        const matchesNiche = selectedNiche === 'all' || mentor.mentor_profile?.mentoring_niche === selectedNiche;

        return experience > 0 && hasHeadline && hasSkills && matchesNiche;
      });

      const cardData = qualifiedMentors.map(backendMentorToCard);
      console.log('[Explore] Converted cards before sorting:', cardData);
      console.log('[Explore] Current sortBy:', sortBy);

      // Apply client-side sorting (in case backend doesn't support it)
      if (sortBy === 'price') {
        cardData.sort((a, b) => {
          const priceA = a.price_per_session_solo ?? Infinity; // No price = expensive (goes to end)
          const priceB = b.price_per_session_solo ?? Infinity;
          console.log(`[Explore] Comparing prices: ${a.name} (${priceA}) vs ${b.name} (${priceB})`);
          return priceA - priceB; // Low to high
        });
        console.log('[Explore] Cards after price sorting:', cardData.map(c => ({ name: c.name, price: c.price_per_session_solo })));
      } else if (sortBy === 'experience') {
        cardData.sort((a, b) => b.experience - a.experience); // High to low
        console.log('[Explore] Cards after experience sorting:', cardData.map(c => ({ name: c.name, experience: c.experience })));
      }

      // Filter by search query on client side
      let filtered = searchQuery
        ? cardData.filter(m =>
          m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          m.jobTitle.toLowerCase().includes(searchQuery.toLowerCase())
        )
        : cardData;

      // Filter by price range on client side
      if (priceRange !== 'all') {
        filtered = filtered.filter(m => {
          const price = m.price_per_session_solo || 0;
          switch (priceRange) {
            case '0-1000':
              return price >= 0 && price <= 1000;
            case '1000-2000':
              return price > 1000 && price <= 2000;
            case '2000-5000':
              return price > 2000 && price <= 5000;
            case '5000+':
              return price > 5000;
            default:
              return true;
          }
        });
      }

      // Move logged-in mentor to the top if they exist in the list and user is a mentor
      let finalList = filtered;
      if (isCurrentUserMentor && currentUserId) {
        const currentMentorIndex = filtered.findIndex(m => m.id === currentUserId);
        if (currentMentorIndex > 0) { // Only move if not already at top
          const currentMentor = filtered[currentMentorIndex];
          finalList = [currentMentor, ...filtered.slice(0, currentMentorIndex), ...filtered.slice(currentMentorIndex + 1)];
        }
      }

      // If API returns empty data, show empty state
      if (finalList.length === 0 && !searchQuery) {
        setMentors([]);
      } else {
        setMentors(prev => reset ? finalList : [...prev, ...finalList]);
      }
      setHasMore(result.data.hasNext);
    } else {
      // API error - show empty state
      setMentors([]);
      setHasMore(false);
    }

    setIsLoading(false);
  };

  // Initial load
  useEffect(() => {
    // Get current user info
    const user = auth.getCurrentUser();
    if (user) {
      setCurrentUserId(user.id);
      setIsCurrentUserMentor(user.role === 'mentor');
    }
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
  }, [searchQuery, selectedNiche, sortBy, priceRange]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-2xl sm:text-3xl font-bold text-brand-dark">Explore Mentors</h1>
        <p className="text-sm sm:text-base text-gray-600 mt-1">
          Discover experienced professionals ready to guide your journey
        </p>
        <p className="text-sm text-gray-500 mt-2">
          {mentors.length} mentors
        </p>
      </div>

      {/* Search and Filters */}
      <Card className="rounded-2xl shadow-sm">
        <CardContent className="p-4 sm:p-6">
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
              <Select value={selectedNiche} onValueChange={setSelectedNiche}>
                <SelectTrigger className="w-full sm:w-[200px]">
                  <SelectValue placeholder="Mentoring Niche" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Niches</SelectItem>
                  {MENTORING_NICHES.map((niche) => (
                    <SelectItem key={niche.value} value={niche.value}>
                      {niche.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={priceRange} onValueChange={(v) => setPriceRange(v as typeof priceRange)}>
                <SelectTrigger className="w-full sm:w-[180px]">
                  <SelectValue placeholder="Price Range" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Prices</SelectItem>
                  <SelectItem value="0-1000">PKR 0 - 1,000</SelectItem>
                  <SelectItem value="1000-2000">PKR 1,000 - 2,000</SelectItem>
                  <SelectItem value="2000-5000">PKR 2,000 - 5,000</SelectItem>
                  <SelectItem value="5000+">PKR 5,000+</SelectItem>
                </SelectContent>
              </Select>

              <Select value={sortBy} onValueChange={(v) => setSortBy(v as typeof sortBy)}>
                <SelectTrigger className="w-full sm:w-[180px]">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="experience">Most Experience</SelectItem>
                  <SelectItem value="price">Price</SelectItem>
                </SelectContent>
              </Select>
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
                <MentorCard
                  mentor={mentor}
                  showBookButton={true}
                  currentUserId={currentUserId}
                  isViewerMentor={isCurrentUserMentor}
                />
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
                setSelectedNiche('all');
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
