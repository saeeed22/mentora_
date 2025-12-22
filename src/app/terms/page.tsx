import LandingHeader from '@/components/landing/header';
import LandingFooter from '@/components/landing/footer';

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-white flex flex-col">
      <LandingHeader />
      
      <div className="flex-1">
        {/* Hero Section */}
        <div className="bg-gradient-to-r from-purple-50 to-blue-50 py-16 md:py-20 px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl font-bold text-brand-dark mb-6">
              Terms of Service
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
              <h2 className="text-2xl font-bold text-brand-dark mb-4">Agreement to Terms</h2>
              <p className="text-gray-600 leading-relaxed">
                By accessing or using Mentora, you agree to be bound by these Terms of Service and all 
                applicable laws and regulations. If you do not agree with any of these terms, you are 
                prohibited from using this platform.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-brand-dark mb-4">Description of Service</h2>
              <p className="text-gray-600 leading-relaxed">
                Mentora is a platform that connects students and professionals with mentors for guidance, 
                skill development, and career advice. We provide tools for scheduling sessions, video calls, 
                messaging, and payment processing.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-brand-dark mb-4">User Accounts</h2>
              
              <h3 className="text-xl font-semibold text-brand-dark mb-3 mt-6">Account Creation</h3>
              <p className="text-gray-600 leading-relaxed mb-4">
                To use our services, you must:
              </p>
              <ul className="list-disc pl-6 text-gray-600 space-y-2">
                <li>Be at least 16 years old</li>
                <li>Provide accurate and complete information</li>
                <li>Maintain the security of your account credentials</li>
                <li>Promptly update any changes to your information</li>
              </ul>

              <h3 className="text-xl font-semibold text-brand-dark mb-3 mt-6">Account Responsibilities</h3>
              <p className="text-gray-600 leading-relaxed">
                You are responsible for all activities that occur under your account. You must notify us 
                immediately of any unauthorized use of your account.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-brand-dark mb-4">User Conduct</h2>
              <p className="text-gray-600 leading-relaxed mb-4">
                You agree not to:
              </p>
              <ul className="list-disc pl-6 text-gray-600 space-y-2">
                <li>Use the platform for any illegal or unauthorized purpose</li>
                <li>Harass, abuse, or harm other users</li>
                <li>Impersonate any person or entity</li>
                <li>Upload or transmit viruses or malicious code</li>
                <li>Interfere with the proper functioning of the platform</li>
                <li>Collect or store personal data of other users without consent</li>
                <li>Use the platform for commercial solicitation without permission</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-brand-dark mb-4">Mentorship Sessions</h2>
              
              <h3 className="text-xl font-semibold text-brand-dark mb-3 mt-6">Booking and Cancellation</h3>
              <p className="text-gray-600 leading-relaxed">
                Mentees can book sessions with mentors through the platform. Cancellation policies are set 
                by individual mentors and should be respected. Last-minute cancellations may result in fees.
              </p>

              <h3 className="text-xl font-semibold text-brand-dark mb-3 mt-6">Mentor Responsibilities</h3>
              <p className="text-gray-600 leading-relaxed mb-4">
                Mentors agree to:
              </p>
              <ul className="list-disc pl-6 text-gray-600 space-y-2">
                <li>Provide accurate information about their experience and expertise</li>
                <li>Honor scheduled sessions or provide adequate notice of cancellation</li>
                <li>Maintain professional conduct during all interactions</li>
                <li>Respect mentee confidentiality</li>
              </ul>

              <h3 className="text-xl font-semibold text-brand-dark mb-3 mt-6">Mentee Responsibilities</h3>
              <p className="text-gray-600 leading-relaxed mb-4">
                Mentees agree to:
              </p>
              <ul className="list-disc pl-6 text-gray-600 space-y-2">
                <li>Attend scheduled sessions on time</li>
                <li>Come prepared with questions and goals</li>
                <li>Respect mentor time and expertise</li>
                <li>Provide honest feedback after sessions</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-brand-dark mb-4">Payments and Refunds</h2>
              <p className="text-gray-600 leading-relaxed mb-4">
                All payments are processed securely through our third-party payment providers. By making 
                a payment, you agree to:
              </p>
              <ul className="list-disc pl-6 text-gray-600 space-y-2">
                <li>Provide accurate payment information</li>
                <li>Pay all applicable fees for services</li>
                <li>Accept our refund policy as determined by individual mentor policies</li>
              </ul>
              <p className="text-gray-600 leading-relaxed mt-4">
                Mentora takes a service fee from each transaction to maintain and improve the platform.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-brand-dark mb-4">Intellectual Property</h2>
              <p className="text-gray-600 leading-relaxed">
                The platform and its original content, features, and functionality are owned by Mentora 
                and are protected by international copyright, trademark, and other intellectual property laws.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-brand-dark mb-4">Content Guidelines</h2>
              <p className="text-gray-600 leading-relaxed mb-4">
                Users may post content on the platform (profiles, messages, reviews). You grant us a 
                license to use, display, and distribute this content as necessary to provide our services.
              </p>
              <p className="text-gray-600 leading-relaxed">
                You retain ownership of your content but represent that you have the right to share it 
                and that it doesn't violate any third-party rights.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-brand-dark mb-4">Disclaimer of Warranties</h2>
              <p className="text-gray-600 leading-relaxed">
                The platform is provided "as is" without warranties of any kind. We do not guarantee 
                specific results from mentorship sessions. Users engage with mentors at their own risk.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-brand-dark mb-4">Limitation of Liability</h2>
              <p className="text-gray-600 leading-relaxed">
                Mentora shall not be liable for any indirect, incidental, special, or consequential damages 
                arising from your use of the platform or inability to use the platform.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-brand-dark mb-4">Termination</h2>
              <p className="text-gray-600 leading-relaxed">
                We reserve the right to terminate or suspend your account at our sole discretion, without 
                notice, for conduct that we believe violates these Terms or is harmful to other users or 
                the platform.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-brand-dark mb-4">Dispute Resolution</h2>
              <p className="text-gray-600 leading-relaxed">
                Any disputes arising from these Terms or use of the platform shall be resolved through 
                arbitration in Karachi, Pakistan, in accordance with Pakistani law.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-brand-dark mb-4">Changes to Terms</h2>
              <p className="text-gray-600 leading-relaxed">
                We reserve the right to modify these terms at any time. We will notify users of material 
                changes via email or platform notification. Continued use after changes constitutes 
                acceptance of the new terms.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-brand-dark mb-4">Contact Information</h2>
              <p className="text-gray-600 leading-relaxed">
                If you have questions about these Terms, please contact us:
              </p>
              <div className="bg-gray-50 rounded-lg p-6 mt-4">
                <p className="text-gray-700">
                  <strong>Email:</strong> legal@mentora.com<br />
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
