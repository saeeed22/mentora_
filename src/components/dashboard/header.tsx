'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { CurrentUser } from '@/lib/api/auth';

interface HeaderProps {
  user: CurrentUser;
}

export function Header({ user }: HeaderProps) {
  const [logoSrc, setLogoSrc] = useState('/logos/logo.png')

  return (
    <header className="bg-white border-b border-gray-200 px-6 py-4">
      <div className="flex items-center justify-between">
        {/* Branding */}
        <Link href="/" className="flex items-center gap-2 shrink-0">
          <Image
            src={logoSrc}
            alt="Mentora Logo"
            width={60}
            height={60}
            className="object-contain"
            onError={() => setLogoSrc('/logos/logo.svg')}
          />
        </Link>

        {/* Right Section */}
        <div className="flex items-center space-x-4 ml-auto">
          {/* Book Session Button - Only for mentees */}
          {user.role === 'mentee' && (
            <Button className="bg-brand hover:bg-brand/90" asChild aria-label="Book a session">
              <Link href="/explore">
                <Calendar className="w-4 h-4 mr-2" />
                Book Session
              </Link>
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
