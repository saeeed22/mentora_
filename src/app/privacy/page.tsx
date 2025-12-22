import LandingHeader from '@/components/landing/header';
import LandingFooter from '@/components/landing/footer';

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-white flex flex-col">
      <LandingHeader />
      
      <div className="flex-1">
        {/* Hero Section */}
        <div className="bg-gradient-to-r from-purple-50 to-blue-50 py-16 md:py-20 px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl font-bold text-brand-dark mb-6">
              Privacy Policy
            </h1>
            <p className="text-lg text-gray-600">
              Last updated: December 22, 2025
            </p>
          </div>
        </div>

        {/* Content */}
        <div className="max-w-4xl mx-auto px-4 py-16">
          <div className="prose prose-lg max-w-none space-y-8">
            <section>
              <h2 className="text-2xl font-bold text-brand-dark mb-4">Introduction</h2>
              <p className="text-gray-600 leading-relaxed">
                At Mentora, we take your privacy seriously. This Privacy Policy explains how we collect, 
                use, disclose, and safeguard your information when you use our mentorship platform. 
                Please read this privacy policy carefully.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-brand-dark mb-4">Information We Collect</h2>
              
              <h3 className="text-xl font-semibold text-brand-dark mb-3 mt-6">Personal Information</h3>
              <p className="text-gray-600 leading-relaxed mb-4">
                We collect information that you provide directly to us, including:
              </p>
              <ul className="list-disc pl-6 text-gray-600 space-y-2">
                <li>Name and contact information (email address, phone number)</li>
                <li>Profile information (bio, expertise, experience, avatar)</li>
                <li>Account credentials</li>
                <li>Payment information (processed securely by third-party providers)</li>
                <li>Communication preferences</li>
              </ul>

              <h3 className="text-xl font-semibold text-brand-dark mb-3 mt-6">Usage Information</h3>
              <p className="text-gray-600 leading-relaxed mb-4">
                We automatically collect certain information about your device and how you interact with our platform:
              </p>
              <ul className="list-disc pl-6 text-gray-600 space-y-2">
                <li>Device information (IP address, browser type, operating system)</li>
                <li>Usage data (pages visited, features used, time spent)</li>
                <li>Session information (booking history, messages, feedback)</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-brand-dark mb-4">How We Use Your Information</h2>
              <p className="text-gray-600 leading-relaxed mb-4">
                We use the information we collect to:
              </p>
              <ul className="list-disc pl-6 text-gray-600 space-y-2">
                <li>Provide, maintain, and improve our services</li>
                <li>Process and complete transactions</li>
                <li>Send you technical notices and support messages</li>
                <li>Respond to your comments and questions</li>
                <li>Match mentees with appropriate mentors</li>
                <li>Facilitate communication between users</li>
                <li>Monitor and analyze trends and usage</li>
                <li>Detect, prevent, and address technical issues</li>
                <li>Comply with legal obligations</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-brand-dark mb-4">Information Sharing and Disclosure</h2>
              <p className="text-gray-600 leading-relaxed mb-4">
                We may share your information in the following circumstances:
              </p>
              
              <h3 className="text-xl font-semibold text-brand-dark mb-3 mt-6">With Other Users</h3>
              <p className="text-gray-600 leading-relaxed">
                Your profile information is visible to other users to facilitate mentorship connections. 
                You control what information appears in your profile.
              </p>

              <h3 className="text-xl font-semibold text-brand-dark mb-3 mt-6">With Service Providers</h3>
              <p className="text-gray-600 leading-relaxed">
                We work with third-party service providers to help us operate our platform, such as 
                payment processors, hosting providers, and analytics services.
              </p>

              <h3 className="text-xl font-semibold text-brand-dark mb-3 mt-6">For Legal Reasons</h3>
              <p className="text-gray-600 leading-relaxed">
                We may disclose your information if required by law or in response to valid legal 
                requests by public authorities.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-brand-dark mb-4">Data Security</h2>
              <p className="text-gray-600 leading-relaxed">
                We implement appropriate technical and organizational measures to protect your personal 
                information against unauthorized access, alteration, disclosure, or destruction. However, 
                no method of transmission over the Internet is 100% secure.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-brand-dark mb-4">Your Rights and Choices</h2>
              <p className="text-gray-600 leading-relaxed mb-4">
                You have the right to:
              </p>
              <ul className="list-disc pl-6 text-gray-600 space-y-2">
                <li>Access and receive a copy of your personal information</li>
                <li>Correct or update your information</li>
                <li>Delete your account and associated data</li>
                <li>Opt-out of marketing communications</li>
                <li>Restrict or object to certain processing of your data</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-brand-dark mb-4">Cookies and Tracking</h2>
              <p className="text-gray-600 leading-relaxed">
                We use cookies and similar tracking technologies to collect usage information and improve 
                your experience. You can control cookies through your browser settings.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-brand-dark mb-4">Data Retention</h2>
              <p className="text-gray-600 leading-relaxed">
                We retain your personal information for as long as necessary to provide our services and 
                fulfill the purposes outlined in this policy, unless a longer retention period is required 
                by law.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-brand-dark mb-4">Children's Privacy</h2>
              <p className="text-gray-600 leading-relaxed">
                Our services are intended for users who are at least 16 years old. We do not knowingly 
                collect personal information from children under 16.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-brand-dark mb-4">Changes to This Policy</h2>
              <p className="text-gray-600 leading-relaxed">
                We may update this privacy policy from time to time. We will notify you of any changes 
                by posting the new policy on this page and updating the "Last updated" date.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-brand-dark mb-4">Contact Us</h2>
              <p className="text-gray-600 leading-relaxed">
                If you have questions about this Privacy Policy, please contact us at:
              </p>
              <div className="bg-gray-50 rounded-lg p-6 mt-4">
                <p className="text-gray-700">
                  <strong>Email:</strong> privacy@mentora.com<br />
                  <strong>Address:</strong> University of Karachi, University Road, Karachi, Pakistan
                </p>
              </div>
            </section>
          </div>
        </div>
      </div>

      <LandingFooter />
    </div>
  );
}
