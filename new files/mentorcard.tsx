// src/components/ui/card.tsx
import React from 'react';
import Image from 'next/image';
import { Briefcase, Calendar, MessageSquare, Zap } from 'lucide-react'; 

interface MentorCardProps {
  mentor: {
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
  return (
    <div className="rounded-xl border border-gray-200 bg-white shadow-sm w-[280px] flex flex-col">

      {/* Image + Badges */}
      <div className="relative mb-4">
        <Image
          src={mentor.image}
          alt={mentor.name}
          width={280}
          height={280}
          className="rounded-t-xl object-cover"
        />
        {mentor.isTopRated && (
          <span className="absolute top-2 left-2 bg-white text-gray-800 text-xs font-medium px-2 py-1 rounded-full">
            Top rated
          </span>
        )}
        {mentor.hasAdvanceOption && (
          <span className="absolute bottom-2 left-1/2 -translate-x-1/2 flex items-center bg-yellow-400 text-gray-900 text-xs font-semibold px-3 py-1 rounded-full">
            <Calendar size={14} className="mr-1" /> Advance
          </span>
        )}
        {mentor.isAvailableASAP && (
          <span className="absolute bottom-2 left-2 flex items-center bg-blue-100 text-blue-800 text-xs font-semibold px-3 py-1 rounded-full">
            <Zap size={14} className="mr-1" /> Available ASAP
          </span>
        )}
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
};

export default MentorCard;
