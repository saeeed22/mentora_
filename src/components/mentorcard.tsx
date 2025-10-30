import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Briefcase, MessageSquare } from 'lucide-react'; 

interface MentorCardProps {
  mentor: {
    id?: string;
    image: string;
    name: string;
    countryCode: string; 
    jobTitle: string;
    company: string; 
    sessions: number;
    reviews: number;
    attendance: number;
    experience: number; 
    isTopRated?: boolean;
    hasAdvanceOption?: boolean; 
    isAvailableASAP?: boolean; 
  };
}

const MentorCard: React.FC<MentorCardProps> = ({ mentor }) => {
  const cardContent = (
    <div className="rounded-xl border border-gray-200 bg-white shadow-sm w-[280px] flex flex-col hover:shadow-md transition-shadow cursor-pointer">

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

        {/* Job Title and Company */}
        <div className="flex items-center text-sm text-gray-700 mb-1">
          <Briefcase size={16} className="mr-2 text-gray-700 flex-shrink-0" />
          <p className="text-sm text-gray-700">
            {mentor.jobTitle} at {mentor.company}
          </p>
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
      <div className="bg-gray-100 p-3 rounded-b-xl flex justify-around items-center text-center mt-auto m-2"> 
        <div>
          <h6 className="text-gray-500 text-sm font-medium">Experience</h6>
          <p className="text-gray-700 text-left font-bold text-sm">
            {mentor.experience} years
          </p>
        </div>
        <div>
          <h6 className="text-gray-500 text-sm font-medium">Avg. Attendance</h6>
          <p className="font-bold text-gray-700 text-left text-sm">
            {mentor.attendance}%
          </p>
        </div>
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
