import LandingHeader from '@/components/landing/header';
import LandingFooter from '@/components/landing/footer';
import { Card, CardContent } from '@/components/ui/card';
import { Users, Target, Heart, Award } from 'lucide-react';

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-white flex flex-col">
      <LandingHeader />
      
      <div className="flex-1">
        {/* Hero Section */}
        <div className="bg-gradient-to-r from-purple-50 to-blue-50 py-16 md:py-20 px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl font-bold text-brand-dark mb-6">
              About Mentora
            </h1>
            <p className="text-lg md:text-xl text-gray-600 leading-relaxed">
              Democratizing mentorship for students and professionals at Karachi University and beyond
            </p>
          </div>
        </div>

        {/* Mission Section */}
        <div className="max-w-6xl mx-auto px-4 py-16">
          <div className="grid md:grid-cols-2 gap-12 items-center mb-20">
            <div>
              <h2 className="text-3xl font-bold text-brand-dark mb-6">Our Mission</h2>
              <p className="text-gray-600 text-lg leading-relaxed mb-4">
                Mentora was founded with a simple yet powerful vision: to make high-quality mentorship 
                accessible to every student at Karachi University, regardless of their background or connections.
              </p>
              <p className="text-gray-600 text-lg leading-relaxed">
                We believe that everyone deserves access to experienced professionals who can guide them 
                through their academic and career journey. Our platform bridges the gap between ambitious 
                students and industry experts who are passionate about giving back.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Card className="text-center p-6 bg-purple-50">
                <CardContent className="pt-6">
                  <Users className="w-12 h-12 text-brand mx-auto mb-4" />
                  <h3 className="text-2xl font-bold text-brand-dark mb-2">50+</h3>
                  <p className="text-gray-600">Expert Mentors</p>
                </CardContent>
              </Card>
              <Card className="text-center p-6 bg-blue-50">
                <CardContent className="pt-6">
                  <Target className="w-12 h-12 text-brand mx-auto mb-4" />
                  <h3 className="text-2xl font-bold text-brand-dark mb-2">200+</h3>
                  <p className="text-gray-600">Connections Made</p>
                </CardContent>
              </Card>
              <Card className="text-center p-6 bg-pink-50">
                <CardContent className="pt-6">
                  <Heart className="w-12 h-12 text-brand mx-auto mb-4" />
                  <h3 className="text-2xl font-bold text-brand-dark mb-2">89%</h3>
                  <p className="text-gray-600">Happy Members</p>
                </CardContent>
              </Card>
              <Card className="text-center p-6 bg-indigo-50">
                <CardContent className="pt-6">
                  <Award className="w-12 h-12 text-brand mx-auto mb-4" />
                  <h3 className="text-2xl font-bold text-brand-dark mb-2">3</h3>
                  <p className="text-gray-600">Countries</p>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Values Section */}
          <div className="mb-20">
            <h2 className="text-3xl font-bold text-brand-dark text-center mb-12">Our Values</h2>
            <div className="grid md:grid-cols-3 gap-8">
              <Card className="shadow-sm hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <h3 className="text-xl font-bold text-brand-dark mb-3">Accessibility</h3>
                  <p className="text-gray-600">
                    We believe quality mentorship should be accessible to everyone, breaking down traditional barriers.
                  </p>
                </CardContent>
              </Card>
              <Card className="shadow-sm hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <h3 className="text-xl font-bold text-brand-dark mb-3">Community</h3>
                  <p className="text-gray-600">
                    Building a supportive ecosystem where knowledge flows freely and connections last a lifetime.
                  </p>
                </CardContent>
              </Card>
              <Card className="shadow-sm hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <h3 className="text-xl font-bold text-brand-dark mb-3">Growth</h3>
                  <p className="text-gray-600">
                    Empowering both mentees and mentors to grow through meaningful exchanges and shared experiences.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Story Section */}
          <div className="bg-gray-50 rounded-2xl p-8 md:p-12">
            <h2 className="text-3xl font-bold text-brand-dark mb-6">Our Story</h2>
            <div className="space-y-4 text-gray-600 text-lg leading-relaxed">
              <p>
                Mentora began as a final year project at Karachi University, born from the observation 
                that many talented students struggled to find guidance and industry connections despite 
                their potential.
              </p>
              <p>
                Our founders, themselves students at KU, experienced firsthand how transformative the 
                right mentorship can be. They built Mentora to create a platform where students could 
                easily connect with alumni and professionals who understand their journey and are eager 
                to help.
              </p>
              <p>
                Today, Mentora connects students with mentors across multiple disciplines - from software 
                engineering to design, data science to marketing. We're proud to have facilitated hundreds 
                of meaningful connections that have helped shape careers and build lasting professional 
                relationships.
              </p>
            </div>
          </div>
        </div>
      </div>

      <LandingFooter />
    </div>
  );
}
