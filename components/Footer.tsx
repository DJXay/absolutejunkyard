"use client"

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

const CATEGORIES =[
  { name: 'Electronics & Adapters', slug: 'electronics-adapters' },
  { name: 'Yard & Garden', slug: 'yard-garden' },
  { name: 'Tools & Hardware', slug: 'tools-hardware' },
  { name: 'Appliances', slug: 'appliances' },
  { name: 'Kids & Toys', slug: 'kids-toys' },
  { name: 'Furniture & Home', slug: 'furniture-home' },
  { name: 'Auto & Garage', slug: 'auto-garage' },
  { name: 'Office & School', slug: 'office-school' },
  { name: 'Clothing & Accessories', slug: 'clothing-accessories' },
  { name: 'Everything Else', slug: 'everything-else' },
]

export default function Footer() {
  const[activeListingsCount, setActiveListingsCount] = useState<number>(0)
  const supabase = createClient()

  useEffect(() => {
    const fetchListingCount = async () => {
      // Fetch exact count of active listings without returning row data for performance
      const { count, error } = await supabase
        .from('listings')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'active')

      if (!error && count !== null) {
        setActiveListingsCount(count)
      }
    }

    fetchListingCount()
  }, [supabase])

  const currentYear = new Date().getFullYear()

  return (
    <footer className="bg-[var(--color-charcoal)] border-t border-[#333] pt-16 pb-8 mt-auto">
      <div className="container mx-auto px-4">
        {/* Top 4-Column Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-16">
          
          {/* Column 1: Brand & Counter */}
          <div className="flex flex-col">
            <Link href="/" className="flex flex-col items-start leading-none mb-4 group inline-block">
              <span className="font-bebas-neue text-[var(--color-cream)] text-xl tracking-widest uppercase">
                Absolute
              </span>
              <span className="font-bebas-neue text-[var(--color-rust)] text-4xl tracking-widest uppercase mt-[-0.15em]">
                Junkyard
              </span>
            </Link>
            
            <p className="text-[var(--color-mid-gray)] text-sm mb-8 leading-relaxed pr-4">
              One person's junk drawer is another person's fix. Keeping perfectly good trash out of the landfill, one buck at a time.
            </p>

            {/* Landfill Counter */}
            <div className="bg-[#222] border border-[#333] rounded-lg p-4 mt-auto">
              <span className="block text-xs text-[var(--color-mid-gray)] uppercase tracking-wider mb-1">
                Active Landfill Diversions
              </span>
              <div className="font-bebas-neue text-4xl text-[var(--color-olive)] tracking-wide">
                {activeListingsCount.toLocaleString()}
              </div>
            </div>
          </div>

          {/* Column 2: Browse Links */}
          <div>
            <h3 className="font-bebas-neue text-2xl text-[var(--color-cream)] tracking-wide mb-6">
              Browse
            </h3>
            <ul className="space-y-3">
              <li>
                <Link href="/browse" className="text-sm text-[var(--color-mid-gray)] hover:text-[var(--color-rust)] transition-colors font-bold">
                  All Listings
                </Link>
              </li>
              {CATEGORIES.map((category) => (
                <li key={category.slug}>
                  <Link 
                    href={`/category/${category.slug}`}
                    className="text-sm text-[var(--color-mid-gray)] hover:text-[var(--color-cream)] transition-colors"
                  >
                    {category.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 3: Company Links */}
          <div>
            <h3 className="font-bebas-neue text-2xl text-[var(--color-cream)] tracking-wide mb-6">
              Company
            </h3>
            <ul className="space-y-3">
              <li>
                <Link href="/about" className="text-sm text-[var(--color-mid-gray)] hover:text-[var(--color-cream)] transition-colors">
                  About
                </Link>
              </li>
              <li>
                <Link href="/how-it-works" className="text-sm text-[var(--color-mid-gray)] hover:text-[var(--color-cream)] transition-colors">
                  How It Works
                </Link>
              </li>
              <li>
                <Link href="/safety" className="text-sm text-[var(--color-mid-gray)] hover:text-[var(--color-cream)] transition-colors">
                  Safety Tips
                </Link>
              </li>
              <li>
                <Link href="/contact" className="text-sm text-[var(--color-mid-gray)] hover:text-[var(--color-cream)] transition-colors">
                  Contact
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 4: Legal Links */}
          <div>
            <h3 className="font-bebas-neue text-2xl text-[var(--color-cream)] tracking-wide mb-6">
              Legal
            </h3>
            <ul className="space-y-3">
              <li>
                <Link href="/privacy" className="text-sm text-[var(--color-mid-gray)] hover:text-[var(--color-cream)] transition-colors">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/terms" className="text-sm text-[var(--color-mid-gray)] hover:text-[var(--color-cream)] transition-colors">
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link href="/cookies" className="text-sm text-[var(--color-mid-gray)] hover:text-[var(--color-cream)] transition-colors">
                  Cookie Policy
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="flex flex-col md:flex-row items-center justify-between pt-8 border-t border-[#333] text-sm gap-4 text-center md:text-left">
          <div className="text-[var(--color-mid-gray)]">
            &copy; {currentYear} AbsoluteJunkyard. All rights reserved.
          </div>
          <div className="font-bold text-[var(--color-cream)] tracking-wide">
            Post it. Pay a buck. Someone wants it.
          </div>
        </div>
      </div>
    </footer>
  )
}