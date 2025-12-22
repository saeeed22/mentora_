"use client"

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Search, ChevronRight, Mail, ArrowLeft, ArrowRight } from 'lucide-react';
import MentorCard from '@/components/mentorcard';
import TestimonialCard from '@/components/testimonialcard';
import LandingHeader from '@/components/landing/header';
import LandingFooter from '@/components/landing/footer';
import Link from 'next/link';
import Image from 'next/image';
import { mentorsApi } from '@/lib/api/mentors-api';
import { useRouter } from 'next/navigation';

const categories = ["Product", "Engineering", "Design", "Marketing", "Data Science", "Product Research"];

// Mentor card type for landing page
interface LandingMentor {
  id: string;
  image: string;
  name: string;
  countryCode: string;
  jobTitle: string;
  company: string;
  sessions: number;
  reviews: number;
  attendance: number;
  experience: number;
  isTopRated: boolean;
  isAvailableASAP: boolean;
}

const dummyTestimonials = [
  {
    mentorImage: "/mentor_fallback_2.jpg",
    mentorName: "Dr. Zainab Malik",
    mentorCountryCode: "PK",
    mentorJobTitle: "Data Scientist",
    mentorCompany: "Netflix",
    mentorSessions: 278,
    mentorReviews: 67,
    reviewText: "Great chat with Dr. Zainab! She helped me rethink about machine learning metrics when working on my capstone project. I liked that she had research papers & resources ready to share. The fact that she showed openness for future conversations is also amazing.",
    reviewerImage: "/mentor_fallback_2.jpg",
    reviewerName: "Usman Ahmed",
    reviewerRole: "Computer Engineering Student",
    reviewerCompany: "Karachi University",
  },
  {
    mentorImage: "/mentor_fallback_2.jpg",
    mentorName: "Ahmed Hassan",
    mentorCountryCode: "US",
    mentorJobTitle: "Product Manager",
    mentorCompany: "Microsoft",
    mentorSessions: 189,
    mentorReviews: 10,
    reviewText: "Ahmed is very knowledgeable, informative and super helpful Product Manager who has great ideas! Thank you Ahmed for your advice, dedication to mentoring aspiring PMs and willingness to share your knowledge & experiences!!",
    reviewerImage: "/mentor_fallback_2.jpg",
    reviewerName: "Fatima Ali",
    reviewerRole: "Business Student",
    reviewerCompany: "Karachi University",
  },
  {
    mentorImage: "/mentor_fallback_2.jpg",
    mentorName: "Sara Raza",
    mentorCountryCode: "PK",
    mentorJobTitle: "UX Designer",
    mentorCompany: "Airbnb",
    mentorSessions: 118,
    mentorReviews: 23,
    reviewText: "The conversation with Sara completely blew me out of the water. Sara is an amazing mentor and even offered to do some portfolio reviews with me. I can't wait to book another session with her. You rock, Sara!",
    reviewerImage: "/mentor_fallback_2.jpg",
    reviewerName: "Hassan Malik",
    reviewerRole: "Design Student",
    reviewerCompany: "Karachi University",
  },
];

const logos = ['/google.png', '/slack.png', '/grammarly.png', '/microsoft.png', '/paypal.png', '/amazon.png', '/nasa.png', '/liftpro.png'];

const LandingPage = () => {
  const [activeTab, setActiveTab] = useState('mentee');
  const [activeCategory, setActiveCategory] = useState("Product");
  const [mentors, setMentors] = useState<LandingMentor[]>([]);
  const [mentorsLoading, setMentorsLoading] = useState(true);
  const [testimonials, setTestimonials] = useState<typeof dummyTestimonials>([]);
  const [testimonialsLoading, setTestimonialsLoading] = useState(false);
  const [getStartedEmail, setGetStartedEmail] = useState('');
  const router = useRouter();

  // Fetch real mentors from API
  useEffect(() => {
    (async () => {
      setMentorsLoading(true);
      const result = await mentorsApi.searchMentors({ page: 1, limit: 4 });

      if (result.success && result.data && result.data.data.length > 0) {
        // Convert backend data to landing page mentor format
        const apiMentors: LandingMentor[] = result.data.data.map((mentor) => ({
          id: mentor.profile?.user_id || (mentor as { id?: string }).id || mentor.user?.id || '',
          image: mentor.profile?.avatar_url || '/mentor_fallback_1.jpg',
          name: mentor.profile?.full_name || 'Mentor',
          countryCode: mentor.profile?.timezone?.includes('Asia/Karachi') ? 'PK' : 'US',
          jobTitle: mentor.mentor_profile?.headline || 'Mentor',
          company: '', // Not available from backend currently
          sessions: mentor.stats?.total_sessions ?? 0,
          reviews: mentor.mentor_profile?.rating_count ?? 0,
          attendance: mentor.stats?.total_sessions ? 95 : 0,
          experience: mentor.mentor_profile?.experience_years ?? 0,
          isTopRated: (mentor.mentor_profile?.rating_avg ?? 0) >= 4.5,
          isAvailableASAP: true,
        }));
        setMentors(apiMentors);
      } else {
        // No mentors from API - show empty state
        setMentors([]);
      }
      setMentorsLoading(false);
    })();
  }, []);

  // Fetch testimonials based on category
  useEffect(() => {
    (async () => {
      setTestimonialsLoading(true);
      // Filter mentors by category (using skills as categories)
      const result = await mentorsApi.searchMentors({ 
        page: 1, 
        limit: 3,
        skills: activeCategory !== "Product Research" ? [activeCategory] : undefined
      });

      if (result.success && result.data && result.data.data.length > 0) {
        // Convert to testimonial format - for now use dummy reviews
        setTestimonials(dummyTestimonials.slice(0, 3));
      } else {
        setTestimonials(dummyTestimonials.slice(0, 3));
      }
      setTestimonialsLoading(false);
    })();
  }, [activeCategory]);

  const handleGetStarted = () => {
    if (getStartedEmail) {
      // Store email in sessionStorage to pre-fill signup form
      sessionStorage.setItem('signup_email', getStartedEmail);
    }
    router.push('/signup');
  };

  return (
    <div className="min-h-screen bg-white">
      <LandingHeader />

      <div className="relative bg-white overflow-hidden">
        {/* Hero Section */}
        <div className="relative pb-0 px-4 md:px-12 lg:px-20 pt-12">
          {/* Left decorative images - hidden on mobile */}
          <div className="hidden lg:block absolute left-0 top-1/2 -translate-y-1/2">
            <Image
              src="/hero_section.png"
              alt="Mentors"
              width={250}
              height={400}
              className="object-contain h-[400px] w-auto"
              priority
            />
          </div>

          {/* Right decorative images - hidden on mobile */}
          <div className="hidden lg:block absolute right-0 top-1/2 -translate-y-1/2">
            <Image
              src="/hero_section.png"
              alt="Mentors"
              width={250}
              height={400}
              className="object-contain h-[400px] w-auto scale-x-[-1]"
              priority
            />
          </div>

          <div className="flex flex-col items-center justify-center text-center relative z-10">
            <div className="mb-8">
              <nav className="inline-flex rounded-lg p-1" role="tablist">
                <button
                  onClick={() => setActiveTab('mentee')}
                  className={`relative px-6 py-2 text-md font-medium transition-all duration-200 
                    ${activeTab === 'mentee'
                      ? 'text-brand after:w-full'
                      : 'text-brand-dark hover:text-brand after:w-0'}
                    after:absolute after:left-0 after:-bottom-1 after:h-0.5 after:bg-brand after:transition-all after:duration-200`}
                  role="tab"
                  aria-selected={activeTab === 'mentee'}
                >
                  Mentee
                </button>
                <button
                  onClick={() => setActiveTab('mentor')}
                  className={`relative px-6 py-2 text-md font-medium transition-all duration-200 
                    ${activeTab === 'mentor'
                      ? 'text-brand after:w-full'
                      : 'text-brand-dark hover:text-brand after:w-0'}
                    after:absolute after:left-0 after:-bottom-1 after:h-0.5 after:bg-brand after:transition-all after:duration-200`}
                  role="tab"
                  aria-selected={activeTab === 'mentor'}
                >
                  Mentor
                </button>
              </nav>
            </div>

            {/* Tab Content */}
            <div className="tab-content">
              {activeTab === 'mentee' && (
                <div className="fade-in">
                  <h1 className="mb-6 text-brand-dark font-bold leading-tight max-w-2xl mx-auto text-balance text-4xl md:text-5xl">
                    Reach your goals faster with <span className="text-brand">Expert Mentors</span>
                  </h1>
                  <p className="px-6 mx-auto mb-8 text-gray-600 max-w-lg md:text-lg lg:max-w-xl">
                    Accelerate your professional growth with 1:1 expert guidance from
                     mentors in our community.
                  </p>
                </div>
              )}
              {activeTab === 'mentor' && (
                <div className="fade-in">
                  <h1 className="mb-6 text-brand-dark font-bold leading-tight max-w-2xl mx-auto text-balance text-4xl md:text-5xl">
                    Your next chapter, made possible by <span className="text-brand">Mentoring</span>
                  </h1>
                  <p className="px-6 mx-auto mb-8 text-gray-600 max-w-xl md:text-lg">
                    Build confidence as a leader, grow your network, and define your legacy in the community.
                  </p>
     
                </div>
              )}
            </div>
          </div>

          <div className="flex flex-col items-center justify-center text-center p-4 pt-7 relative z-10">
            <p className="px-6 mx-auto mb-8 text-gray-900 max-w-lg md:text-lg lg:max-w-xl">
              Trusted by students and professionals from top organizations
            </p>
          </div>
        </div>

        {/* Logos */}
        <div className="relative w-full overflow-hidden py-12">
          <div className="flex animate-marquee whitespace-nowrap">
            {[...Array(8)].map((_, repeatIndex) =>
              logos.map((logo, index) => (
                <Image
                  key={`${repeatIndex}-${index}`}
                  src={logo}
                  alt="Company Logo"
                  height={48}
                  width={120}
                  className="h-12 mx-12 w-auto inline-block opacity-60 hover:opacity-100 transition-opacity"
                  priority={repeatIndex === 0 && index < 3} // optimize LCP for first few
                />
              ))
            )}
          </div>
        </div>


        {/* Steps Section */}
        <div className="px-4 md:px-12 lg:px-20 py-12">
          <div className="flex flex-col md:flex-row items-center md:items-start md:space-x-8 space-y-8 md:space-y-0 text-center md:text-left">
            <div className="flex-1">
              <div className="flex items-start gap-4">
                <div className="flex items-center justify-center h-10 w-20 rounded-full bg-red-100">
                  <span className="font-bold text-lg text-red-500">1</span>
                </div>
                <div>
                  <h3 className="mb-2 text-gray-700 font-bold">Access to the world&apos;s best from KU.</h3>
                  <small className="text-gray-400 font-bold">From Design to AI, connect with top KU alumni and industry experts for guidance.</small>
                </div>
              </div>
            </div>

            <div className="flex-1">
              <div className="flex items-start gap-4">
                <div className="flex items-center justify-center h-10 w-20 rounded-full bg-purple-100">
                  <span className="font-bold text-lg text-purple-500">2</span>
                </div>
                <div>
                  <h3 className="mb-2 text-gray-700 font-bold">Personalized advice to accelerate your success.</h3>
                  <small className="text-gray-400 font-bold">Book 1:1 mentorship sessions &amp; get advice, insights to move faster with your career goals.</small>
                </div>
              </div>
            </div>

            <div className="flex-1">
              <div className="flex items-start gap-4">
                <div className="flex items-center justify-center h-10 w-20 rounded-full bg-blue-100">
                  <span className="font-bold text-lg text-blue-500">3</span>
                </div>
                <div>
                  <h3 className="mb-2 text-gray-700 font-bold">Achieve your long term goals, easily.</h3>
                  <small className="text-gray-400 font-bold">Connect with mentors for recurring sessions and work towards long-term career objectives.</small>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Mentors */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 px-4 md:px-16 pt-12 pb-8">
          <h2 className="text-3xl font-bold mb-4 md:mb-0">Discover top mentors</h2>
          <div className="flex flex-col-reverse md:flex-row items-center gap-4 w-full md:w-auto">
            <Button variant="outline" className="px-4 border-[#05051B] hover:text-white hover:bg-[#05051B] w-full md:w-auto" asChild>
              <Link href="/browse">Explore all</Link>
            </Button>
          </div>
        </div>

        <div className="px-4 md:px-12 lg:px-20">
          <div className="overflow-x-auto mb-30 scrollbar-hide">
            {mentorsLoading ? (
              <div className="flex justify-center py-12">
                <div className="animate-spin h-8 w-8 border-2 border-brand border-t-transparent rounded-full"></div>
              </div>
            ) : mentors.length > 0 ? (
              <div className="flex space-x-8 pb-4 items-stretch">
                {mentors.map((mentor, index) => (
                  <div key={mentor.id || index} className="flex-shrink-0">
                    <MentorCard mentor={mentor} />
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-gray-500">No mentors available yet. Check back soon!</p>
              </div>
            )}
          </div>
        </div>

        {/* Stats Section */}
        <div className="px-4 md:px-12 lg:px-20 py-20 bg-gradient-to-r from-red-50 via-pink-200 to-blue-300 my-18">
          <div className="flex flex-col items-center text-center">
            <h2 className="mb-12 font-bold text-brand-dark text-3xl">A platform that delivers results</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-4 lg:gap-6">
            <div className="bg-white/40 p-6 py-18 rounded-2xl shadow-md backdrop-blur-lg">
              <p className="text-gray-800 mb-3 text-center text-sm">Career enhanced for</p>
              <h1 className="text-violet-900 font-extrabold text-center mb-3 text-4xl">89%</h1>
              <p className="mt-2 text-gray-700 text-center">Happy Members</p>
            </div>
            <div className="bg-white/40 p-6 py-18 rounded-2xl shadow-md backdrop-blur-lg">
              <p className="text-gray-800 mb-3 text-center text-sm">Empowered by</p>
              <h1 className="text-violet-900 font-extrabold text-center mb-3 text-4xl">50+</h1>
              <p className="mt-2 text-gray-700 text-center">Expert Mentors</p>
            </div>
            <div className="bg-white/40 p-6 py-18 rounded-2xl shadow-md backdrop-blur-lg">
              <p className="text-gray-800 mb-3 text-center text-sm">Global community from</p>
              <h1 className="text-violet-900 font-extrabold text-center mb-3 text-4xl">3</h1>
              <p className="mt-2 text-gray-700 text-center">Countries</p>
            </div>
            <div className="bg-white/40 p-6 py-18 rounded-2xl shadow-md backdrop-blur-lg">
              <p className="text-gray-800 mb-3 text-center text-sm">We have built over</p>
              <h1 className="text-violet-900 font-extrabold text-center mb-3 text-4xl">200+</h1>
              <p className="mt-2 text-gray-700 text-center">Connections</p>
            </div>
          </div>
        </div>

        {/* Testimonials */}
        <div className="px-4 md:px-12 lg:px-20 py-12">
          <div className="text-center mb-12">
            <h1 className="text-gray-900 text-4xl font-bold">Loved by our community</h1>
          </div>
          <div className="flex flex-wrap justify-center gap-5 mb-12">
            {categories.map((category) => (
              <Button
                key={category}
                variant={activeCategory === category ? "default" : "outline"}
                className={activeCategory === category ? "bg-gray-900 text-white" : "border-gray-300 text-gray-700 hover:text-white hover:bg-[#05051B] "}
                onClick={() => setActiveCategory(category)}
              >
                {category}
              </Button>
            ))}
          </div>
          {testimonialsLoading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin h-8 w-8 border-2 border-brand border-t-transparent rounded-full"></div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12">
              {testimonials.map((testimonial, index) => (
                <TestimonialCard key={index} testimonial={testimonial} />
              ))}
            </div>
          )}
        </div>

        {/* CTA */}
        <div className="px-4 md:px-12 lg:px-20 py-20 text-center">
          <div className="flex flex-col items-center">
            <h1 className="max-w-3xl mb-8 text-3xl md:text-4xl font-bold">Ready to accelerate your growth?</h1>
            <p className="max-w-2xl mb-8 text-gray-600 leading-8 text-base md:text-lg">
              Join hundreds of students and professionals who are already growing their careers with expert mentorship. 
              Start your journey today - it's free to sign up and explore.
            </p>
          </div>
          <div className="relative flex flex-col items-center gap-4 pb-10">
            <div className="flex flex-col sm:flex-row gap-4 w-full max-w-md">
              <Button
                variant="default"
                size="lg"
                className="bg-brand hover:bg-brand/90 w-full sm:flex-1"
                asChild
              >
                <Link href="/signup">Get Started Free</Link>
              </Button>
              <Button
                variant="outline"
                size="lg"
                className="border-brand text-brand hover:bg-brand hover:text-white w-full sm:flex-1"
                asChild
              >
                <Link href="/browse">Browse Mentors</Link>
              </Button>
            </div>
            <p className="text-sm text-gray-500 mt-2">
              No credit card required • Free to join • Cancel anytime
            </p>
          </div>
        </div>

        <style jsx>{`
          .fade-in {
            animation: fadeInUp 0.5s ease-out forwards;
          }
          @keyframes fadeInUp {
            from {
              opacity: 0;
              transform: translateY(20px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
          .animate-marquee {
            animation: marquee 25s linear infinite;
          }
          @keyframes marquee {
            0% {
              transform: translateX(0%);
            }
            100% {
              transform: translateX(-100%);
            }
          }
          .scrollbar-hide {
            -ms-overflow-style: none;
            scrollbar-width: none;
          }
          .scrollbar-hide::-webkit-scrollbar {
            display: none;
          }
        `}</style>
      </div>

      <LandingFooter />
    </div>
  );
};

export default LandingPage;
