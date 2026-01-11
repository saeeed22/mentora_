'use client';

import React, { useState, useEffect } from 'react';
import { Search, Filter, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import MentorCard from '@/components/mentorcard';
import { mentorsApi } from '@/lib/api/mentors-api';
import type { MentorDetailResponse } from '@/lib/types';
import LandingHeader from '@/components/landing/header';
import LandingFooter from '@/components/landing/footer';
import Link from 'next/link';
import { auth } from '@/lib/api/auth';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

// Mentoring niche categories (same as explore page)
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
const backendMentorToCard = (mentor: MentorDetailResponse) => ({
  id: mentor.profile?.user_id || (mentor as { id?: string }).id || mentor.user?.id || '',
  image: mentor.profile?.avatar_url || '/mentor_fallback_1.jpg',
  name: mentor.profile?.full_name || 'Unknown Mentor',
  countryCode: mentor.profile?.timezone?.includes('Asia/Karachi') ? 'PK' : 'US',
  jobTitle: mentor.mentor_profile?.headline || 'Mentor',
  company: '', // Deprecated - kept for backwards compatibility
  current_role: mentor.mentor_profile?.current_role,
  current_company: mentor.mentor_profile?.current_company,
  sessions: mentor.stats?.total_sessions ?? 0,
  reviews: mentor.mentor_profile?.rating_count ?? 0,
  attendance: mentor.stats?.total_sessions ? 95 : 0,
  experience: mentor.mentor_profile?.experience_years ?? 0,
  price_per_session_solo: mentor.mentor_profile?.price_per_session_solo,
  isTopRated: (mentor.mentor_profile?.rating_avg ?? 0) >= 4.8,
  isAvailableASAP: true,
  groupEnabled: !!mentor.mentor_profile?.group_enabled,
  mentoring_niche: mentor.mentor_profile?.mentoring_niche || undefined,
});

type MentorCardData = ReturnType<typeof backendMentorToCard>;

export default function BrowseMentorsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedNiche, setSelectedNiche] = useState('all');
  const [priceRange, setPriceRange] = useState<'all' | '0-1000' | '1000-2000' | '2000-5000' | '5000+'>('all');
  const [experienceRange, setExperienceRange] = useState<'all' | '1-2' | '2-4' | '4-7' | '7-10' | '10+'>('all');
  const [mentors, setMentors] = useState<MentorCardData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  // Check if user is logged in on mount
  useEffect(() => {
    const currentUser = auth.getCurrentUser();
    setIsLoggedIn(!!currentUser);
  }, []);

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
    });

    if (result.success && result.data) {
      // Filter mentors who meet listing criteria:
      // - Must have experience > 0 years
      // - Must have complete profile
      const qualifiedMentors = result.data.data.filter(mentor => {
        const experience = mentor.mentor_profile?.experience_years ?? 0;
        const hasHeadline = mentor.mentor_profile?.headline && mentor.mentor_profile.headline.length > 0;
        const hasSkills = mentor.mentor_profile?.skills && mentor.mentor_profile.skills.length > 0;

        return experience > 0 && hasHeadline && hasSkills;
      });

      const cardData = qualifiedMentors.map(backendMentorToCard);

      // Filter by search query on client side
      let filtered = searchQuery
        ? cardData.filter(m =>
          m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          m.jobTitle.toLowerCase().includes(searchQuery.toLowerCase())
        )
        : cardData;

      // Filter by niche on client side
      if (selectedNiche !== 'all') {
        filtered = filtered.filter(m => m.mentoring_niche === selectedNiche);
      }

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

      // Filter by experience range on client side
      if (experienceRange !== 'all') {
        filtered = filtered.filter(m => {
          const exp = m.experience || 0;
          switch (experienceRange) {
            case '1-2':
              return exp >= 1 && exp <= 2;
            case '2-4':
              return exp > 2 && exp <= 4;
            case '4-7':
              return exp > 4 && exp <= 7;
            case '7-10':
              return exp > 7 && exp <= 10;
            case '10+':
              return exp > 10;
            default:
              return true;
          }
        });
      }

      if (filtered.length === 0 && !searchQuery && priceRange === 'all') {
        setMentors([]);
      } else {
        setMentors(prev => reset ? filtered : [...prev, ...filtered]);
      }
      setHasMore(result.data.hasNext);
    } else {
      setMentors([]);
      setHasMore(false);
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
    }, 300);

    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery, selectedNiche, priceRange, experienceRange]);

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <LandingHeader />

      <div className="flex-1 px-4 md:px-8 lg:px-16 py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div className="text-center sm:text-left">
            <h1 className="text-3xl md:text-4xl font-bold text-brand-dark">Browse Mentors</h1>
            <p className="text-gray-600 mt-2">
              Discover experienced professionals ready to guide your journey
            </p>
          </div>
          <div className="text-sm text-gray-500 text-center sm:text-right">
            {mentors.length} mentors available
          </div>
        </div>

        {/* CTA Banner - Only show for non-logged-in users */}
        {!isLoggedIn && (
          <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-xl p-6 mb-8">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-2">
                  Ready to connect with a mentor?
                </h2>
                <p className="text-gray-600">
                  Sign up now to book sessions and start your mentorship journey
                </p>
              </div>
              <Button
                className="bg-brand hover:bg-brand/90 whitespace-nowrap"
                asChild
              >
                <Link href="/signup">Signup Now</Link>
              </Button>
            </div>
          </div>
        )}

        {/* Search and Filters */}
        <Card className="rounded-2xl shadow-sm mb-8">
          <CardContent className="p-4 md:p-6">
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

              {/* Niche Filter */}
              <Select value={selectedNiche} onValueChange={setSelectedNiche}>
                <SelectTrigger className="w-full lg:w-48">
                  <SelectValue placeholder="All Niches" />
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

              {/* Price Range Filter */}
              <Select value={priceRange} onValueChange={(v) => setPriceRange(v as typeof priceRange)}>
                <SelectTrigger className="w-full lg:w-48">
                  <SelectValue placeholder="All Prices" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Prices</SelectItem>
                  <SelectItem value="0-1000">PKR 0 - 1,000</SelectItem>
                  <SelectItem value="1000-2000">PKR 1,000 - 2,000</SelectItem>
                  <SelectItem value="2000-5000">PKR 2,000 - 5,000</SelectItem>
                  <SelectItem value="5000+">PKR 5,000+</SelectItem>
                </SelectContent>
              </Select>

              {/* Experience Range Filter */}
              <Select value={experienceRange} onValueChange={(v) => setExperienceRange(v as typeof experienceRange)}>
                <SelectTrigger className="w-full lg:w-48">
                  <SelectValue placeholder="All Experience" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Any Experience</SelectItem>
                  <SelectItem value="1-2">1-2 years</SelectItem>
                  <SelectItem value="2-4">2-4 years</SelectItem>
                  <SelectItem value="4-7">4-7 years</SelectItem>
                  <SelectItem value="7-10">7-10 years</SelectItem>
                  <SelectItem value="10+">10+ years</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Mentors Grid */}
        {isLoading && page === 1 ? (
          <div className="flex justify-center items-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-brand" />
          </div>
        ) : mentors.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-gray-500 text-lg">No mentors found matching your criteria.</p>
            <p className="text-gray-400 mt-2">Try adjusting your filters or search query.</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 justify-items-center sm:justify-items-stretch">
              {mentors.map((mentor) => (
                <div key={mentor.id}>
                  <MentorCard mentor={mentor} showBookButton={true} />
                </div>
              ))}
            </div>

            {/* Load More */}
            {hasMore && (
              <div className="mt-8 text-center">
                <Button
                  variant="outline"
                  onClick={() => {
                    setPage(p => p + 1);
                    loadMentors(false);
                  }}
                  disabled={isLoading}
                  className="border-brand text-brand hover:bg-brand hover:text-white"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Loading...
                    </>
                  ) : (
                    'Load More Mentors'
                  )}
                </Button>
              </div>
            )}
          </>
        )}
      </div>

      <LandingFooter />
    </div>
  );
}
