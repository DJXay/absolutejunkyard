"use client"

import React, { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import {
  Menu,
  X,
  Search,
  Bell,
  LayoutDashboard,
  MessageSquareText,
  Settings,
  LogOut,
  PlusSquare,
  User as UserIcon // Renamed to avoid conflict with User type
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import type { User as DBUser } from '@/types' // Renamed to avoid conflict with internal User state

export default function Navbar() {
  const router = useRouter()
  const supabase = createClient()

  const [user, setUser] = useState<DBUser | null>(null)
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)

  const dropdownRef = useRef<HTMLDivElement>(null);
  // No explicit ref for mobile menu closing logic, relying on X button and link clicks

  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user: supabaseAuthUser } } = await supabase.auth.getUser()
      if (supabaseAuthUser) {
        // Fetch full user profile from our public.users table
        const { data: profile, error } = await supabase
          .from('users')
          .select('*')
          .eq('id', supabaseAuthUser.id)
          .single()

        if (profile && !error) {
          setUser(profile)
        } else {
          // Fallback to basic auth user info if public.users profile not found/error
          // This case might happen right after signup before profile is fully propagated or if profile creation failed.
          setUser({
            id: supabaseAuthUser.id,
            username: supabaseAuthUser.user_metadata?.username || supabaseAuthUser.email,
            display_name: supabaseAuthUser.user_metadata?.display_name || supabaseAuthUser.user_metadata?.username || supabaseAuthUser.email?.split('@')[0],
            avatar_url: supabaseAuthUser.user_metadata?.avatar_url || null,
            location_city: null, location_state: null, location_zip: null, bio: null,
            total_listings: 0, reputation_score: 5.0, is_banned: false,
            created_at: supabaseAuthUser.created_at,
          });
        }
      } else {
        setUser(null)
      }
      setLoading(false)
    }

    fetchUser()

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        // Re-fetch user profile on auth state change (e.g., after login/signup)
        supabase
          .from('users')
          .select('*')
          .eq('id', session.user.id)
          .single()
          .then(({ data: profile, error }) => {
            if (profile && !error) {
              setUser(profile)
            } else {
                setUser({
                    id: session.user.id,
                    username: session.user.user_metadata?.username || session.user.email,
                    display_name: session.user.user_metadata?.display_name || session.user.user_metadata?.username || session.user.email?.split('@')[0],
                    avatar_url: session.user.user_metadata?.avatar_url || null,
                    location_city: null, location_state: null, location_zip: null, bio: null,
                    total_listings: 0, reputation_score: 5.0, is_banned: false,
                    created_at: session.user.created_at,
                });
            }
          })
      } else {
        setUser(null)
      }
    })

    return () => subscription.unsubscribe()
  }, [supabase])

  const handleSearch = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && searchQuery.trim()) {
      router.push(`/browse?q=${encodeURIComponent(searchQuery.trim())}`)
      setSearchQuery('')
      if (isMobileMenuOpen) setIsMobileMenuOpen(false); // Close mobile menu after search
    }
  }

  const handleSignOut = async () => {
    setIsDropdownOpen(false)
    await supabase.auth.signOut()
    router.push('/login')
  }

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen)
  }

  const toggleDropdown = () => {
    setIsDropdownOpen(!isDropdownOpen)
  }

  // Close dropdown if clicked outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []); // Empty dependency array means this runs once on mount and cleanup on unmount


  // When mobile menu is open, prevent body scroll
  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isMobileMenuOpen]);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-[var(--color-charcoal)] border-b border-[#333] shadow-lg">
      <div className="container mx-auto px-4 py-3 flex items-center justify-between h-16">
        {/* Left - Logo */}
        <Link href="/" className="flex flex-col items-start leading-none group" onClick={() => setIsMobileMenuOpen(false)}>
          <span className="font-bebas-neue text-[var(--color-cream)] text-sm md:text-base tracking-widest uppercase">Absolute</span>
          <span className="font-bebas-neue text-[var(--color-rust)] text-xl md:text-2xl tracking-widest uppercase mt-[-0.2em]">Junkyard</span>
        </Link>

        {/* Center - Search Bar (Desktop) */}
        <div className="hidden md:flex flex-grow max-w-md mx-8 relative">
          <input
            type="text"
            placeholder="Search for junk..."
            className="w-full pl-10 pr-4 py-2 rounded-lg bg-[#2a2a2a] text-[var(--color-cream)] border border-[#444] focus:border-[var(--color-olive)] focus:outline-none placeholder:text-[var(--color-mid-gray)]"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyPress={handleSearch}
            aria-label="Search listings"
          />
          <Search size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-mid-gray)]" />
        </div>

        {/* Right - Desktop Menu */}
        <div className="hidden md:flex items-center space-x-4">
          <Link
            href="/list-item"
            className="bg-[var(--color-rust)] text-[var(--color-cream)] px-4 py-2 rounded-lg font-bold hover:bg-opacity-90 transition-colors uppercase tracking-wide text-sm"
          >
            Post Item <PlusSquare size={16} className="inline-block ml-1 relative -top-[1px]" />
          </Link>

          {!loading && !user ? (
            <Link
              href="/login"
              className="text-[var(--color-cream)] px-4 py-2 rounded-lg border border-[#444] hover:bg-[#2a2a2a] transition-colors text-sm"
            >
              Login
            </Link>
          ) : (
            !loading && user && (
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={toggleDropdown}
                  className="flex items-center space-x-2 text-[var(--color-cream)] hover:text-[var(--color-rust)] transition-colors relative"
                  aria-label="User menu"
                >
                  <Bell size={20} className="mr-2" /> {/* Notification Bell */}
                  {user.avatar_url ? (
                    <Image
                      src={user.avatar_url}
                      alt={user.display_name || user.username || 'User'}
                      width={32}
                      height={32}
                      className="rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-[var(--color-olive)] flex items-center justify-center text-sm font-bold uppercase text-[var(--color-cream)]">
                      {(user.display_name || user.username || 'U').charAt(0)}
                    </div>
                  )}
                </button>

                {isDropdownOpen && (
                  <div className="absolute right-0 mt-3 w-48 bg-[#2a2a2a] rounded-lg shadow-xl overflow-hidden z-20 border border-[#444]">
                    <div className="px-4 py-2 border-b border-[#444] text-[var(--color-mid-gray)] text-sm">
                      {user.display_name || user.username || 'User'}
                    </div>
                    <Link href="/dashboard" onClick={() => setIsDropdownOpen(false)} className="flex items-center px-4 py-2 text-[var(--color-cream)] hover:bg-[#3a3a3a] transition-colors text-sm">
                      <LayoutDashboard size={16} className="mr-2" /> Dashboard
                    </Link>
                    <Link href="/messages" onClick={() => setIsDropdownOpen(false)} className="flex items-center px-4 py-2 text-[var(--color-cream)] hover:bg-[#3a3a3a] transition-colors text-sm">
                      <MessageSquareText size={16} className="mr-2" /> Messages
                    </Link>
                    <Link href="/settings" onClick={() => setIsDropdownOpen(false)} className="flex items-center px-4 py-2 text-[var(--color-cream)] hover:bg-[#3a3a3a] transition-colors text-sm">
                      <Settings size={16} className="mr-2" /> Settings
                    </Link>
                    <button
                      onClick={handleSignOut}
                      className="flex items-center w-full text-left px-4 py-2 text-red-400 hover:bg-[#3a3a3a] transition-colors text-sm"
                    >
                      <LogOut size={16} className="mr-2" /> Sign Out
                    </button>
                  </div>
                )}
              </div>
            )
          )}
        </div>

        {/* Mobile Menu Button & Post Item CTA */}
        <div className="md:hidden flex items-center space-x-4">
          <Link
            href="/list-item"
            onClick={() => setIsMobileMenuOpen(false)} // Close mobile menu if Post Item is clicked
            className="bg-[var(--color-rust)] text-[var(--color-cream)] px-3 py-1.5 rounded-lg font-bold hover:bg-opacity-90 transition-colors uppercase text-xs"
          >
            Post Item
          </Link>
          <button
            onClick={toggleMobileMenu}
            className="text-[var(--color-cream)] focus:outline-none"
            aria-label="Toggle mobile menu"
          >
            {isMobileMenuOpen ? <X size={28} /> : <Menu size={28} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu Content (slide-down) */}
      {isMobileMenuOpen && (
        <div 
          className="md:hidden absolute top-16 left-0 w-full h-[calc(100vh-4rem)] bg-[var(--color-charcoal)] overflow-y-auto pb-4 transition-transform duration-300 ease-in-out"
        >
          <div className="px-4 py-4 border-b border-[#333]">
            <div className="relative mb-4">
              <input
                type="text"
                placeholder="Search for junk..."
                className="w-full pl-10 pr-4 py-2 rounded-lg bg-[#2a2a2a] text-[var(--color-cream)] border border-[#444] focus:border-[var(--color-olive)] focus:outline-none placeholder:text-[var(--color-mid-gray)]"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={handleSearch}
                aria-label="Search listings"
              />
              <Search size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-mid-gray)]" />
            </div>

            {!loading && !user ? (
              <Link
                href="/login"
                onClick={() => setIsMobileMenuOpen(false)}
                className="block w-full text-center bg-[#2a2a2a] text-[var(--color-cream)] px-4 py-2 rounded-lg border border-[#444] hover:bg-[#3a3a3a] transition-colors mt-2"
              >
                Login
              </Link>
            ) : (
              !loading && user && (
                <div className="flex flex-col space-y-2 mt-2">
                  <Link href="/dashboard" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center px-4 py-2 text-[var(--color-cream)] hover:bg-[#3a3a3a] transition-colors rounded-lg">
                    <LayoutDashboard size={20} className="mr-3" /> Dashboard
                  </Link>
                  <Link href="/messages" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center px-4 py-2 text-[var(--color-cream)] hover:bg-[#3a3a3a] transition-colors rounded-lg">
                    <MessageSquareText size={20} className="mr-3" /> Messages
                  </Link>
                  <Link href="/settings" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center px-4 py-2 text-[var(--color-cream)] hover:bg-[#3a3a3a] transition-colors rounded-lg">
                    <Settings size={20} className="mr-3" /> Settings
                  </Link>
                  <button
                    onClick={handleSignOut} // Sign out also closes the menu
                    className="flex items-center w-full text-left px-4 py-2 text-red-400 hover:bg-[#3a3a3a] transition-colors rounded-lg"
                  >
                    <LogOut size={20} className="mr-3" /> Sign Out
                  </button>
                </div>
              )
            )}
          </div>
        </div>
      )}
    </nav>
  )
}