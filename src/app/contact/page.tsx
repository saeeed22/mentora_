import LandingHeader from '@/components/landing/header';
import LandingFooter from '@/components/landing/footer';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Mail, MapPin, Phone } from 'lucide-react';

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-white flex flex-col">
      <LandingHeader />
      
      <div className="flex-1">
        {/* Hero Section */}
        <div className="bg-gradient-to-r from-purple-50 to-blue-50 py-16 md:py-20 px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl font-bold text-brand-dark mb-6">
              Get In Touch
            </h1>
            <p className="text-lg md:text-xl text-gray-600">
              Have questions? We'd love to hear from you. Send us a message and we'll respond as soon as possible.
            </p>
          </div>
        </div>

        {/* Contact Section */}
        <div className="max-w-6xl mx-auto px-4 py-16">
          <div className="grid md:grid-cols-2 gap-12">
            {/* Contact Form */}
            <div>
              <h2 className="text-2xl font-bold text-brand-dark mb-6">Send us a message</h2>
              <form className="space-y-6">
                <div>
                  <Label htmlFor="name">Full Name</Label>
                  <Input
                    id="name"
                    type="text"
                    placeholder="Enter your name"
                    className="mt-2"
                  />
                </div>

                <div>
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="your.email@example.com"
                    className="mt-2"
                  />
                </div>

                <div>
                  <Label htmlFor="subject">Subject</Label>
                  <Input
                    id="subject"
                    type="text"
                    placeholder="How can we help?"
                    className="mt-2"
                  />
                </div>

                <div>
                  <Label htmlFor="message">Message</Label>
                  <Textarea
                    id="message"
                    placeholder="Tell us more about your inquiry..."
                    className="mt-2"
                    rows={6}
                  />
                </div>

                <Button type="submit" className="w-full bg-brand hover:bg-brand/90">
                  Send Message
                </Button>
              </form>
            </div>

            {/* Contact Information */}
            <div className="space-y-8">
              <div>
                <h2 className="text-2xl font-bold text-brand-dark mb-6">Contact Information</h2>
                <p className="text-gray-600 mb-8">
                  Feel free to reach out to us through any of these channels. We're here to help!
                </p>
              </div>

              <div className="space-y-6">
                <Card className="shadow-sm">
                  <CardContent className="p-6 flex items-start gap-4">
                    <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <Mail className="w-6 h-6 text-brand" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-brand-dark mb-2">Email</h3>
                      <p className="text-gray-600">support@mentora.com</p>
                      <p className="text-gray-600">info@mentora.com</p>
                    </div>
                  </CardContent>
                </Card>

                <Card className="shadow-sm">
                  <CardContent className="p-6 flex items-start gap-4">
                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <Phone className="w-6 h-6 text-brand" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-brand-dark mb-2">Phone</h3>
                      <p className="text-gray-600">+92 21 1234 5678</p>
                      <p className="text-gray-500 text-sm mt-1">Mon-Fri, 9am-6pm PKT</p>
                    </div>
                  </CardContent>
                </Card>

                <Card className="shadow-sm">
                  <CardContent className="p-6 flex items-start gap-4">
                    <div className="w-12 h-12 bg-pink-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <MapPin className="w-6 h-6 text-brand" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-brand-dark mb-2">Address</h3>
                      <p className="text-gray-600">
                        University of Karachi<br />
                        University Road<br />
                        Karachi, Pakistan
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>

            </div>
          </div>
        </div>
      </div>

      <LandingFooter />
    </div>
  );
}
