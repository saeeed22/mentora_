import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Briefcase, MessageSquare, Building2, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { auth } from '@/lib/api/auth';

interface MentorCardProps {
  mentor: {
    id?: string;
    image: string;
    name: string;
    countryCode: string;
    jobTitle?: string; // Deprecated - use current_role
    company?: string; // Deprecated - use current_company
    current_role?: string;
    current_company?: string;
    sessions: number;
    reviews: number;
    attendance: number;
    experience: number;
    price_per_session_solo?: number; // Pricing in PKR
    isTopRated?: boolean;
    hasAdvanceOption?: boolean;
    isAvailableASAP?: boolean;
    groupEnabled?: boolean;
  };
  showBookButton?: boolean; // Show book button instead of link
  currentUserId?: string | null; // Current logged-in user's ID
  isViewerMentor?: boolean; // Whether the viewer is a mentor
}

const MentorCard: React.FC<MentorCardProps> = ({
  mentor,
  showBookButton = false,
  currentUserId = null,
  isViewerMentor = false
}) => {
  const router = useRouter();

  // Determine if this is the viewer's own card
  const isOwnCard = currentUserId && mentor.id === currentUserId;

  // Determine button text and behavior
  // Case 1: Viewing own card -> "View My Profile"
  // Case 2: Mentor viewing another mentor -> "View Profile" (no booking)
  // Case 3: Mentee or logged out -> "Book Now" (normal flow)
  const buttonText = isOwnCard
    ? 'View My Profile'
    : (isViewerMentor ? 'View Profile' : 'Book Now');

  const buttonIcon = isOwnCard || isViewerMentor ? null : <Calendar className="w-4 h-4 mr-2" />;

  const handleBookNow = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    // Check if user is logged in
    const currentUser = auth.getCurrentUser();
    if (!currentUser) {
      // Redirect to login
      router.push('/login');
      return;
    }

    // If viewing own card, go to profile page
    if (isOwnCard) {
      router.push('/profile');
      return;
    }

    // Go to mentor detail page
    if (mentor.id) {
      router.push(`/mentor/${mentor.id}`);
    }
  };

  const cardContent = (
    <div
      className={`rounded-xl border ${isOwnCard ? 'border-brand/30 bg-brand-light/5' : 'border-gray-200 bg-white'} shadow-sm w-[260px] h-full flex flex-col hover:shadow-md transition-shadow cursor-pointer`}
    >

      {/* Image */}
      <div className="relative">
        <Image
          src={mentor.image}
          alt={mentor.name}
          width={260}
          height={200}
          className="rounded-t-xl object-cover w-full h-[200px]"
        />
      </div>

      {/* Content */}
      <div className="p-3 flex-grow flex flex-col">
        <div className="flex items-baseline mb-2">
          <h3 className="text-base text-gray-900 mr-2 font-semibold">
            {mentor.name}
          </h3>
          <span className="text-sm text-gray-900 font-semibold">{mentor.countryCode}</span>
        </div>

        {mentor.groupEnabled && (
          <div className="mb-2 inline-flex items-center gap-1.5 px-2 py-0.5 bg-emerald-50 text-emerald-700 text-xs font-semibold rounded-full">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            Group sessions available
          </div>
        )}

        {/* Job Title and Company - Enhanced Styling */}
        <div className="mb-2 p-2 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-100">
          {/* Designation */}
          {(mentor.current_role || mentor.jobTitle) && (
            <div className="flex items-center gap-1.5 mb-1">
              <Briefcase size={13} className="text-blue-600 flex-shrink-0" />
              <p className="text-sm font-semibold text-gray-900">
                {mentor.current_role || mentor.jobTitle}
              </p>
            </div>
          )}

          {/* Company */}
          {(mentor.current_company || mentor.company) && (
            <div className="flex items-center gap-1.5 pl-0.5">
              <Building2 size={13} className="text-indigo-600 flex-shrink-0" />
              <p className="text-xs text-gray-700 font-medium">
                {mentor.current_company || mentor.company}
              </p>
            </div>
          )}
        </div>

        {/* Sessions and Reviews */}
        <div className="flex items-center text-sm text-gray-700 mb-1.5">
          <MessageSquare size={15} className="mr-1.5 text-gray-700" />
          <p className="text-sm text-gray-700">
            {mentor.sessions} sessions ({mentor.reviews} reviews)
          </p>
        </div>

        <div className="flex-grow" />
      </div>

      {/* Footer Stats */}
      <div className="bg-gray-100 p-2.5 rounded-b-xl mt-auto m-2">
        {/* Experience and Attendance/Status Row */}
        <div className="flex justify-around items-center text-center mb-3">
          <div>
            <h6 className="text-gray-500 text-xs font-medium">Experience</h6>
            <p className="text-gray-700 font-bold text-sm">
              {mentor.experience} years
            </p>
          </div>

          {/* Vertical Divider */}
          <div className="w-px h-8 bg-gray-300"></div>

          {mentor.sessions > 0 ? (
            <div>
              <h6 className="text-gray-500 text-xs font-medium">Avg. Attendance</h6>
              <p className="font-bold text-gray-700 text-sm">
                {mentor.attendance}%
              </p>
            </div>
          ) : (
            <div>
              <h6 className="text-gray-500 text-xs font-medium">Status</h6>
              <p className="font-bold text-brand text-sm">
                New Mentor
              </p>
            </div>
          )}
        </div>

        {/* Price Row */}
        {mentor.price_per_session_solo && (
          <div className="pt-2.5 border-t border-gray-200 text-center">
            <h6 className="text-gray-500 text-xs font-medium mb-0.5">Price</h6>
            <div className="flex items-center justify-center gap-1 font-bold text-gray-700 text-sm">
              <p className="text-xs text-gray-600 font-semibold">PKR</p>
              <p>{mentor.price_per_session_solo}</p>
              <p className="text-xs text-gray-500 font-normal">/session</p>
            </div>
          </div>
        )}
      </div>

      {/* Book Now Button - Only shown when showBookButton is true */}
      {showBookButton && (
        <div className="p-2.5 m-2 mt-0">
          <Button
            onClick={handleBookNow}
            className="w-full bg-brand hover:bg-brand/90"
            size="sm"
            variant={isOwnCard ? 'outline' : 'default'}
          >
            {buttonIcon}
            {buttonText}
          </Button>
        </div>
      )}
    </div>
  );

  // If showBookButton is true, don't wrap in Link (button handles navigation)
  if (showBookButton) {
    return cardContent;
  }

  // If mentor has an ID, wrap in Link, otherwise return card as-is
  if (mentor.id) {
    return (
      <Link href={`/mentor/${mentor.id}`}>
        {cardContent}
      </Link>
    );
  }

  return cardContent;
};

// Wrap with React.memo to prevent unnecessary re-renders
export default React.memo(MentorCard, (prevProps, nextProps) => {
  // Custom comparison: only re-render if mentor ID or key props change
  return (
    prevProps.mentor.id === nextProps.mentor.id &&
    prevProps.showBookButton === nextProps.showBookButton &&
    prevProps.currentUserId === nextProps.currentUserId &&
    prevProps.isViewerMentor === nextProps.isViewerMentor
  );
});

