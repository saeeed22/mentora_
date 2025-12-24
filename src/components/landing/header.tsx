"use client"

import { useState, useEffect } from 'react'
import Link from "next/link"
import Image from "next/image"
import { usePathname } from 'next/navigation'
import { Button } from "@/components/ui/button"
import { Menu, X } from 'lucide-react'
import { auth } from '@/lib/api/auth'

export default function LandingHeader() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isCheckingAuth, setIsCheckingAuth] = useState(true)
  const pathname = usePathname()

  useEffect(() => {
    setIsCheckingAuth(true)
    setIsAuthenticated(auth.isAuthenticated())
    setIsCheckingAuth(false)
  }, [])

  // Determine which buttons to show based on current page
  const isLoginPage = pathname === '/login'
  const isSignupPage = pathname === '/signup'
  const showLoginButton = !isLoginPage && !isAuthenticated
  const showSignupButton = !isSignupPage && !isAuthenticated

  return (
    <header className="w-full bg-white shadow py-1 px-6 sticky top-0 z-50">
      <div className="mx-auto flex h-16 max-w-8xl items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <Image
            src="/logos/logo.png"
            alt="Mentora Logo"
            width={60}
            height={60}
            className="object-contain"
          />

        </Link>

        <div className="hidden lg:flex items-center gap-4">
          {isCheckingAuth ? (
            <div className="h-10 w-32 bg-gray-100 animate-pulse rounded-md"></div>
          ) : isAuthenticated ? (
            <>
              <Button
                variant="outline"
                size="lg"
                className="border-brand-dark hover:text-white hover:bg-brand-dark"
                asChild
              >
                <Link href="/">Home</Link>
              </Button>
              <Button
                variant="default"
                size="lg"
                className="bg-brand hover:bg-brand/90"
                asChild
              >
                <Link href="/home">Dashboard</Link>
              </Button>
            </>
          ) : (
            <>
              {showLoginButton && (
                <Button
                  variant="outline"
                  size="lg"
                  className="border-brand-dark hover:text-white hover:bg-brand-dark"
                  asChild
                >
                  <Link href="/login">Log in</Link>
                </Button>
              )}
              {showSignupButton && (
                <Button
                  variant="default"
                  size="lg"
                  className="bg-brand hover:bg-brand/90"
                  asChild
                >
                  <Link href="/signup">Get started today</Link>
                </Button>
              )}
            </>
          )}
        </div>

        {/* Hamburger Icon (visible on screens smaller than 1000px) */}
        <div className="lg:hidden">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            aria-label="Toggle menu"
          >
            <Menu size={24} />
          </Button>
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      <div
        className={`fixed inset-0 z-40 bg-gray-900 bg-opacity-70 transition-opacity duration-300 ${isMenuOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
          } lg:hidden`}
        onClick={() => setIsMenuOpen(false)}
      ></div>

      {/* Off-canvas Mobile Menu */}
      <div
        className={`fixed inset-y-0 left-0 z-50 h-full w-[280px] sm:w-[320px] bg-white shadow-xl transition-transform duration-300 ease-in-out transform ${isMenuOpen ? 'translate-x-0' : '-translate-x-full'
          } lg:hidden`}
      >
        <div className="flex justify-end p-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsMenuOpen(false)}
            aria-label="Close menu"
          >
            <X size={24} />
          </Button>
        </div>
        <div className="flex flex-col items-center gap-4 p-4">
          {isCheckingAuth ? (
            <div className="h-12 w-full bg-gray-100 animate-pulse rounded-md"></div>
          ) : isAuthenticated ? (
            <>
              <Button
                variant="outline"
                className="w-full border-brand-dark hover:text-white hover:bg-brand-dark py-6"
                asChild
              >
                <Link href="/">Home</Link>
              </Button>
              <Button
                variant="default"
                className="w-full bg-brand hover:bg-brand/90 py-6"
                asChild
              >
                <Link href="/home">Dashboard</Link>
              </Button>
            </>
          ) : (
            <>
              {showLoginButton && (
                <Button
                  variant="outline"
                  className="w-full border-brand-dark hover:text-white hover:bg-brand-dark py-6"
                  asChild
                >
                  <Link href="/login">Log in</Link>
                </Button>
              )}
              {showSignupButton && (
                <Button
                  variant="default"
                  className="w-full bg-brand hover:bg-brand/90 py-6"
                  asChild
                >
                  <Link href="/signup">Sign up</Link>
                </Button>
              )}
            </>
          )}
        </div>
      </div>
    </header>
  );
}
