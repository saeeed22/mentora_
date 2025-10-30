'use client';

import React, { useState } from 'react';
import { Search, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import MentorCard from '@/components/mentorcard';
import { mockMentorProfiles } from '@/lib/mock-mentors';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

// Helper function to calculate years of experience from period string
const calculateExperience = (period: string): number => {
  const parts = period.split(' - ');
  if (parts.length !== 2) return 5; // Default
  
  const startYear = parseInt(parts[0]);
  const endPart = parts[1].trim();
  const endYear = endPart === 'Present' ? new Date().getFullYear() : parseInt(endPart);
  
  return Math.max(1, endYear - startYear);
};

// Convert mentor profiles to card format
const mockMentors = mockMentorProfiles.map(mentor => ({
  id: mentor.id,
  image: mentor.avatar,
  name: mentor.name,
  countryCode: mentor.location.includes('US') ? 'US' : 'NP',
  jobTitle: mentor.title,
  company: mentor.company,
  sessions: mentor.sessionsCompleted,
  reviews: mentor.reviewCount,
  attendance: 95 + Math.floor(Math.random() * 5), // Random 95-99%
  experience: mentor.experience.length > 0 ? calculateExperience(mentor.experience[0].period) : 10,
  isTopRated: mentor.rating >= 4.8,
  isAvailableASAP: mentor.isOnline,
}));

export default function ExplorePage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedExpertise, setSelectedExpertise] = useState('all');
  const [selectedAvailability, setSelectedAvailability] = useState('all');
  const [sortBy, setSortBy] = useState('rating');
  const [filteredMentors, setFilteredMentors] = useState(mockMentors);

  // Get unique expertise areas from all mentors
  const expertiseAreas = Array.from(
    new Set(mockMentorProfiles.flatMap(mentor => mentor.expertise))
  ).sort();

  // Filter and sort mentors
  const filterMentors = () => {
    let filtered = mockMentors.filter(mentor => {
      const mentorProfile = mockMentorProfiles.find(m => m.id === mentor.id);
      if (!mentorProfile) return false;

      const matchesSearch = mentor.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           mentor.jobTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           mentor.company.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           mentorProfile.expertise.some(skill => skill.toLowerCase().includes(searchQuery.toLowerCase()));
      
      const matchesExpertise = selectedExpertise === 'all' || 
                              mentorProfile.expertise.includes(selectedExpertise);
      
      const matchesAvailability = selectedAvailability === 'all' ||
                                 (selectedAvailability === 'online' && mentorProfile.isOnline) ||
                                 (selectedAvailability === 'available-today' && mentorProfile.availability.includes('today')) ||
                                 (selectedAvailability === 'available-week' && mentorProfile.availability.includes('week'));
      
      return matchesSearch && matchesExpertise && matchesAvailability;
    });

    // Sort mentors
    filtered.sort((a, b) => {
      const profileA = mockMentorProfiles.find(m => m.id === a.id);
      const profileB = mockMentorProfiles.find(m => m.id === b.id);
      if (!profileA || !profileB) return 0;

      switch (sortBy) {
        case 'rating':
          return profileB.rating - profileA.rating;
        case 'sessions':
          return profileB.sessionsCompleted - profileA.sessionsCompleted;
        case 'response-time':
          return parseInt(profileA.responseTime) - parseInt(profileB.responseTime);
        case 'name':
          return a.name.localeCompare(b.name);
        default:
          return 0;
      }
    });

    setFilteredMentors(filtered);
  };

  // Apply filters whenever dependencies change
  React.useEffect(() => {
    filterMentors();
  }, [searchQuery, selectedExpertise, selectedAvailability, sortBy]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Explore Mentors</h1>
          <p className="text-gray-600 mt-1">
            Discover experienced professionals ready to guide your journey
          </p>
        </div>
        <div className="text-sm text-gray-500">
          {filteredMentors.length} mentors available
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
                  placeholder="Search by name, company, or expertise..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-3">
              <Select value={selectedExpertise} onValueChange={setSelectedExpertise}>
                <SelectTrigger className="w-full sm:w-[180px]">
                  <SelectValue placeholder="Expertise" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Expertise</SelectItem>
                  {expertiseAreas.map((skill) => (
                    <SelectItem key={skill} value={skill}>
                      {skill}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={selectedAvailability} onValueChange={setSelectedAvailability}>
                <SelectTrigger className="w-full sm:w-[180px]">
                  <SelectValue placeholder="Availability" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Availability</SelectItem>
                  <SelectItem value="online">Online Now</SelectItem>
                  <SelectItem value="available-today">Available Today</SelectItem>
                  <SelectItem value="available-week">Available This Week</SelectItem>
                </SelectContent>
              </Select>

              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-full sm:w-[180px]">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="rating">Highest Rated</SelectItem>
                  <SelectItem value="sessions">Most Sessions</SelectItem>
                  <SelectItem value="response-time">Fastest Response</SelectItem>
                  <SelectItem value="name">Name A-Z</SelectItem>
                </SelectContent>
              </Select>

              <Button variant="outline" size="icon">
                <Filter className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Mentors Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 justify-items-center">
        {filteredMentors.map((mentor) => (
          <MentorCard key={mentor.id} mentor={mentor} />
        ))}
      </div>

      {/* Empty State */}
      {filteredMentors.length === 0 && (
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
                setSelectedExpertise('all');
                setSelectedAvailability('all');
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
