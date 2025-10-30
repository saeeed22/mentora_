import Link from "next/link";

export default function Footer() {
  return (
    <footer className="bg-[#FAFAFA] py-10">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-6">
        <div className="grid grid-cols-1 gap-14 md:grid-cols-[35%_65%]">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <span className="font-bold text-3xl">Mentora</span>
            </div>
            <p className="text-md text-gray-600 max-w-sm">
              On a mission to democratize mentorship for all. Designed and made
              with ❤️ by Mentora Team
            </p>
            <p className="text-sm text-gray-500">
              © Copyright 2025 - Mentora
            </p>
          </div>


          <div className="space-y-10">
            <div className="grid grid-cols-2 gap-8 lg:grid-cols-4">
              <div>
                <h4 className="font-bold mb-5 text-2xl">Company</h4>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li><Link href="#">About us</Link></li>
                  <li><Link href="#">Contact</Link></li>
                  <li><Link href="#">Partnership</Link></li>
                  <li><Link href="#">Blog</Link></li>
                </ul>
              </div>

              <div>
                <h4 className="font-bold mb-5 text-2xl">Product</h4>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li><Link href="#">Find a mentor</Link></li>
                  <li><Link href="#">Become a mentor</Link></li>
                  <li><Link href="#">AI Design Masterclass</Link></li>
                </ul>
              </div>

              <div>
                <h4 className="font-bold mb-5 text-2xl">Support</h4>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li><Link href="#">FAQs</Link></li>
                  <li><Link href="#">Help center</Link></li>
                  <li><Link href="#">Terms of service</Link></li>
                  <li><Link href="#">Privacy policy</Link></li>
                  <li><Link href="#">Site map</Link></li>
                </ul>
              </div>
              
              <div>
                <h4 className="font-bold mb-5 text-2xl">Follow us</h4>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li><Link href="#">LinkedIn</Link></li>
                  <li><Link href="#">X</Link></li>
                  <li><Link href="#">Instagram</Link></li>
                  <li><Link href="#">YouTube</Link></li>
                </ul>
              </div>
            </div>

            <div className="md:mt-12">
              <h4 className="font-bold mb-5 text-2xl">Resources</h4>
              <ul className="space-y-2 text-sm text-gray-600">
                <li><Link href="#">AI Design Guide</Link></li>
                <li><Link href="#">Free resume AI tool</Link></li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}