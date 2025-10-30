"use client"

import { useState } from 'react'
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Menu, X } from 'lucide-react'

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  return (
    <header className="w-full bg-white shadow py-1 px-6 sticky top-0 z-50">
      <div className="mx-auto flex h-16 max-w-8xl items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <span className="font-bold text-2xl">Mentora</span>
        </Link>

        <div className="hidden lg:flex items-center gap-4">
          <Button variant="outline" size="lg" className="border-[#05051B] hover:text-white hover:bg-[#05051B]">
            Log in
          </Button>
          <Button variant="default" size="lg" className="hover:bg-[#077E7E]">
            Get started today
          </Button>
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
        className={`fixed inset-0 z-40 bg-gray-900 bg-opacity-70 transition-opacity duration-300 ${
          isMenuOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        } lg:hidden`}
        onClick={() => setIsMenuOpen(false)}
      ></div>

      {/* Off-canvas Mobile Menu */}
      <div
        className={`fixed inset-y-0 left-0 z-50 h-full w-[40vw] bg-white shadow-xl transition-transform duration-300 ease-in-out transform ${
          isMenuOpen ? 'translate-x-0' : '-translate-x-full'
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
          <Button variant="outline" className="w-full border-[#05051B] hover:text-white hover:bg-[#05051B] py-6">
            Log in
          </Button>
          <Button variant="default" className="w-full hover:bg-[#077E7E] py-6">
            Sign up
          </Button>
        </div>
      </div>
    </header>
  );
}