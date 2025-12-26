import Link from "next/link";
import Image from "next/image";

export default function LandingFooter() {
  return (
    <footer className="bg-[#FAFAFA] py-10 sm:py-12 lg:py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Main Grid: Logo/Brand + Links */}
        <div className="grid grid-cols-1 gap-8 sm:gap-10 lg:gap-14 lg:grid-cols-[1fr_2fr]">
          {/* Brand Section */}
          <div className="space-y-4 max-w-sm">
            <div className="flex items-center gap-2">
              <Image 
                src="/logos/logo.svg" 
                alt="Mentora Logo" 
                width={48} 
                height={48}
                className="object-contain"
              />
            </div>
            <p className="text-sm sm:text-base text-gray-600 leading-relaxed">
              On a mission to democratize mentorship for all.
            </p>
            <p className="text-xs sm:text-sm text-gray-500 pt-2">
              © Copyright 2025 - Mentora
            </p>
          </div>

          {/* Links Section */}
          <div className="space-y-8 sm:space-y-10">
            {/* Top Row: 4 Columns */}
            <div className="grid grid-cols-2 gap-6 sm:gap-8 md:grid-cols-4">
              {/* Company */}
              <div className="space-y-3 sm:space-y-4">
                <h4 className="font-bold text-lg sm:text-xl lg:text-2xl text-gray-900">Company</h4>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li><Link href="/about" className="hover:text-gray-900 transition-colors inline-block">About us</Link></li>
                  <li><Link href="/contact" className="hover:text-gray-900 transition-colors inline-block">Contact</Link></li>              
                </ul>
              </div>

              {/* Product */}
              <div className="space-y-3 sm:space-y-4">
                <h4 className="font-bold text-lg sm:text-xl lg:text-2xl text-gray-900">Product</h4>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li><Link href="/browse" className="hover:text-gray-900 transition-colors inline-block">Find a mentor</Link></li>
                  <li><Link href="/signup" className="hover:text-gray-900 transition-colors inline-block">Become a mentor</Link></li>
                </ul>
              </div>

              {/* Support */}
              <div className="space-y-3 sm:space-y-4">
                <h4 className="font-bold text-lg sm:text-xl lg:text-2xl text-gray-900">Support</h4>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li><Link href="/contact" className="hover:text-gray-900 transition-colors inline-block">FAQs</Link></li>
                  <li><Link href="/terms" className="hover:text-gray-900 transition-colors inline-block">Terms of service</Link></li>
                  <li><Link href="/privacy" className="hover:text-gray-900 transition-colors inline-block">Privacy policy</Link></li>
                </ul>
              </div>
              
         
            </div>

        
          </div>
        </div>
      </div>
    </footer>
  );
}
