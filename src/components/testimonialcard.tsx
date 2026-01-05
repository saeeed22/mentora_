import React from 'react';
import Image from 'next/image';
import { Briefcase, MessageSquare } from 'lucide-react';

interface TestimonialCardProps {
  testimonial: {
    mentorImage: string;
    mentorName: string;
    mentorCountryCode: string;
    mentorJobTitle: string;
    mentorCompany: string;
    mentorSessions: number;
    mentorReviews: number;
    reviewText: string;
    reviewerImage: string;
    reviewerName: string;
    reviewerRole: string;
    reviewerCompany: string;
  };
}

const TestimonialCard: React.FC<TestimonialCardProps> = ({ testimonial }) => {
  return (
    <div className="rounded-xl border border-gray-200 bg-white shadow-sm flex flex-col">
      {/* Mentor Info */}
      <div className="flex items-center p-5 rounded-t-xl bg-gray-100 h-32">
        <Image
          src={testimonial.mentorImage}
          alt={testimonial.mentorName}
          width={48}
          height={48}
          className="rounded-full object-cover mr-3"
        />
        <div className="flex-grow">
          <div className="flex items-baseline mb-1">
            <h6 className="text-gray-900 mr-2 font-semibold">{testimonial.mentorName}</h6>
            <span className="text-sm text-gray-900 font-semibold">{testimonial.mentorCountryCode}</span>
          </div>
          <div className="flex items-center text-sm text-gray-700 mb-1">
            <Briefcase size={14} className="mr-1 flex-shrink-0" />
            <p className="leading-tight text-gray-700 text-xs">
              {testimonial.mentorJobTitle} at {testimonial.mentorCompany}
            </p>
          </div>
          <div className="flex items-center text-sm text-gray-700">
            <MessageSquare size={14} className="mr-1 flex-shrink-0" />
            <p className="leading-tight text-gray-700 text-xs">
              {testimonial.mentorSessions} sessions ({testimonial.mentorReviews} reviews)
            </p>
          </div>
        </div>
      </div>

      {/* Review Text */}
      <div className="p-5">
        <p className="text-gray-900 flex-grow leading-relaxed text-sm md:text-base">
          {testimonial.reviewText}
        </p>
      </div>
    </div>
  );
};

export default TestimonialCard;
