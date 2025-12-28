import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Briefcase, MessageSquare, Building2 } from 'lucide-react';

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
}

const MentorCard: React.FC<MentorCardProps> = ({ mentor }) => {
  const cardContent = (
    <div
      className="rounded-xl border border-gray-200 bg-white shadow-sm w-[280px] h-full flex flex-col hover:shadow-md transition-shadow cursor-pointer"
    >

      {/* Image */}
      <div className="relative mb-4">
        <Image
          src={mentor.image}
          alt={mentor.name}
          width={280}
          height={280}
          className="rounded-t-xl object-cover"
        />
      </div>

      {/* Content */}
      <div className="p-4 flex-grow flex flex-col">
        <div className="flex items-baseline mb-3">
          <h3 className="text-lg text-gray-900 mr-2 font-semibold">
            {mentor.name}
          </h3>
          <span className="text-sm text-gray-900 font-semibold">{mentor.countryCode}</span>
        </div>

        {mentor.groupEnabled && (
          <div className="mb-3 inline-flex items-center gap-2 px-2 py-1 bg-emerald-50 text-emerald-700 text-xs font-semibold rounded-full">
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
            Group sessions available
          </div>
        )}

        {/* Job Title and Company - Enhanced Styling */}
        <div className="mb-3 p-2.5 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-100">
          {/* Designation */}
          {(mentor.current_role || mentor.jobTitle) && (
            <div className="flex items-center gap-2 mb-1.5">
              <Briefcase size={14} className="text-blue-600 flex-shrink-0" />
              <p className="text-sm font-semibold text-gray-900">
                {mentor.current_role || mentor.jobTitle}
              </p>
            </div>
          )}
          
          {/* Company */}
          {(mentor.current_company || mentor.company) && (
            <div className="flex items-center gap-2 pl-0.5">
              <Building2 size={14} className="text-indigo-600 flex-shrink-0" />
              <p className="text-xs text-gray-700 font-medium">
                {mentor.current_company || mentor.company}
              </p>
            </div>
          )}
        </div>

        {/* Sessions and Reviews */}
        <div className="flex items-center text-sm text-gray-700 mb-2">
          <MessageSquare size={16} className="mr-2 text-gray-700" />
          <p className="text-sm text-gray-700">
            {mentor.sessions} sessions ({mentor.reviews} reviews)
          </p>
        </div>

        <div className="flex-grow" />
      </div>

      {/* Footer Stats */}
      <div className="bg-gray-100 p-3 rounded-b-xl mt-auto m-2">
        {/* Experience and Attendance/Status Row */}
        <div className="flex justify-around items-center text-center mb-4">
          <div>
            <h6 className="text-gray-500 text-sm font-medium">Experience</h6>
            <p className="text-gray-700 font-bold text-sm">
              {mentor.experience} years
            </p>
          </div>
          
          {/* Vertical Divider */}
          <div className="w-px h-10 bg-gray-300"></div>
          
          {mentor.sessions > 0 ? (
            <div>
              <h6 className="text-gray-500 text-sm font-medium">Avg. Attendance</h6>
              <p className="font-bold text-gray-700 text-sm">
                {mentor.attendance}%
              </p>
            </div>
          ) : (
            <div>
              <h6 className="text-gray-500 text-sm font-medium">Status</h6>
              <p className="font-bold text-brand text-sm">
                New Mentor
              </p>
            </div>
          )}
        </div>

        {/* Price Row */}
        {mentor.price_per_session_solo && (
          <div className="pt-3 border-t border-gray-200 text-center">
            <h6 className="text-gray-500 text-sm font-medium mb-1">Price</h6>
            <div className="flex items-center justify-center gap-1 font-bold text-gray-700 text-sm">
              <p className="text-xs text-gray-600 font-semibold">PKR</p>
              <p>{mentor.price_per_session_solo}</p>
              <p className="text-xs text-gray-500 font-normal">/session</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );

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

export default MentorCard;
