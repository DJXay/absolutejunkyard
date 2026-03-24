import React from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import CategoryGrid from '@/components/CategoryGrid'
import ListingCard from '@/components/ListingCard'
import type { ListingCardProps } from '@/types'

export default async function HomePage() {
  const supabase = await createClient()

  // Fetch stats and recent listings concurrently for performance
  const[
    { count: listingsCount },
    { count: usersCount },
    { count: categoriesCount },
    { data: recentListingsData }
  ] = await Promise.all([
    supabase.from('listings').select('*', { count: 'exact', head: true }).eq('status', 'active'),
    supabase.from('users').select('*', { count: 'exact', head: true }),
    supabase.from('categories').select('*', { count: 'exact', head: true }),
    supabase
      .from('listings')
      .select(`
        id,
        title,
        asking_price,
        condition,
        location_city,
        location_state,
        status,
        is_free,
        is_shippable,
        categories ( name ),
        listing_images ( public_url, is_primary )
      `)
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(12)
  ])

  // Transform raw data to match ListingCardProps
  const recentListings: ListingCardProps[] = (recentListingsData ||[]).map((listing: any) => {
    // Prefer the primary image, otherwise fallback to the first image available
    const primaryImage = listing.listing_images?.find((img: any) => img.is_primary) || listing.listing_images?.[0]
    
    return {
      id: listing.id,
      title: listing.title,
      asking_price: listing.asking_price,
      condition: listing.condition,
      location_city: listing.location_city,
      location_state: listing.location_state,
      status: listing.status,
      is_free: listing.is_free,
      is_shippable: listing.is_shippable,
      primary_image_url: primaryImage?.public_url || null,
      category_name: listing.categories?.name || 'Uncategorized',
    }
  })

  return (
    <div className="flex flex-col min-h-screen">
      
      {/* HERO SECTION */}
      <section className="relative w-full py-24 md:py-32 flex items-center justify-center overflow-hidden border-b border-[#333]">
        {/* Subtle CSS Dot Pattern Background */}
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_center,_var(--color-cream)_1px,_transparent_1px)] bg-[size:24px_24px]"></div>
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-[var(--color-charcoal)]"></div>

        <div className="container relative z-10 mx-auto px-4 text-center flex flex-col items-center">
          <h1 className="font-bebas-neue text-7xl md:text-9xl text-[var(--color-rust)] tracking-wider uppercase leading-none mb-2 drop-shadow-lg">
            Junk Happens.
          </h1>
          <p className="font-bebas-neue text-3xl md:text-5xl text-[var(--color-cream)] tracking-wide mb-10 drop-shadow-md">
            Don't Let It Haunt a Landfill.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
            <Link 
              href="/browse" 
              className="w-full sm:w-auto px-8 py-4 bg-[var(--color-cream)] text-[var(--color-charcoal)] font-bold uppercase tracking-wider rounded-lg hover:bg-gray-200 transition-colors text-center"
            >
              Browse Junk
            </Link>
            <Link 
              href="/list-item" 
              className="w-full sm:w-auto px-8 py-4 bg-[var(--color-rust)] text-[var(--color-cream)] font-bold uppercase tracking-wider rounded-lg hover:bg-opacity-90 transition-colors text-center"
            >
              Post an Item
            </Link>
          </div>
        </div>
      </section>

      {/* STATS BAR */}
      <section className="bg-[#111] border-b border-[#333] py-8">
        <div className="container mx-auto px-4 grid grid-cols-1 md:grid-cols-3 gap-8 text-center divide-y md:divide-y-0 md:divide-x divide-[#333]">
          <div className="flex flex-col items-center pt-4 md:pt-0">
            <span className="font-bebas-neue text-5xl md:text-6xl text-[var(--color-olive)] tracking-wide">
              {(listingsCount || 0).toLocaleString()}
            </span>
            <span className="text-[var(--color-mid-gray)] text-sm font-bold uppercase tracking-widest mt-1">
              Items Listed
            </span>
          </div>
          <div className="flex flex-col items-center pt-8 md:pt-0">
            <span className="font-bebas-neue text-5xl md:text-6xl text-[var(--color-olive)] tracking-wide">
              {(usersCount || 0).toLocaleString()}
            </span>
            <span className="text-[var(--color-mid-gray)] text-sm font-bold uppercase tracking-widest mt-1">
              Junkers
            </span>
          </div>
          <div className="flex flex-col items-center pt-8 md:pt-0">
            <span className="font-bebas-neue text-5xl md:text-6xl text-[var(--color-olive)] tracking-wide">
              {(categoriesCount || 0).toLocaleString()}
            </span>
            <span className="text-[var(--color-mid-gray)] text-sm font-bold uppercase tracking-widest mt-1">
              Categories
            </span>
          </div>
        </div>
      </section>

      {/* CATEGORIES SECTION */}
      <section className="py-20 container mx-auto px-4">
        <div className="flex items-center justify-between mb-10">
          <h2 className="font-bebas-neue text-4xl md:text-5xl text-[var(--color-cream)] tracking-wide uppercase">
            What Kind of Junk?
          </h2>
        </div>
        <CategoryGrid />
      </section>

      {/* HOW IT WORKS SECTION */}
      <section className="py-20 bg-[#111] border-y border-[#333]">
        <div className="container mx-auto px-4">
          <h2 className="font-bebas-neue text-4xl md:text-5xl text-[var(--color-cream)] tracking-wide uppercase text-center mb-12">
            How It Works
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {/* Step 1 */}
            <div className="bg-[var(--color-charcoal)] border border-[#333] p-8 rounded-xl flex flex-col items-center text-center relative overflow-hidden group">
              <div className="absolute -top-6 -right-6 font-bebas-neue text-[120px] text-[#222] leading-none select-none group-hover:text-[var(--color-olive)] transition-colors duration-500">
                1
              </div>
              <div className="w-16 h-16 rounded-full bg-[var(--color-olive)] flex items-center justify-center mb-6 relative z-10">
                <span className="text-2xl">🔍</span>
              </div>
              <h3 className="font-bold text-[var(--color-cream)] text-xl mb-3 relative z-10">
                Find something worth saving
              </h3>
              <p className="text-[var(--color-mid-gray)] text-sm relative z-10">
                Dig through your garage, closet, or that one weird drawer. If it's too good for the trash but you don't need it, we want it.
              </p>
            </div>

            {/* Step 2 */}
            <div className="bg-[var(--color-charcoal)] border border-[#333] p-8 rounded-xl flex flex-col items-center text-center relative overflow-hidden group">
              <div className="absolute -top-6 -right-6 font-bebas-neue text-[120px] text-[#222] leading-none select-none group-hover:text-[var(--color-rust)] transition-colors duration-500">
                2
              </div>
              <div className="w-16 h-16 rounded-full bg-[var(--color-rust)] flex items-center justify-center mb-6 relative z-10">
                <span className="text-2xl">💵</span>
              </div>
              <h3 className="font-bold text-[var(--color-cream)] text-xl mb-3 relative z-10">
                Pay a buck to list it
              </h3>
              <p className="text-[var(--color-mid-gray)] text-sm relative z-10">
                Snap a few photos, tell us why it's glorious junk, and pay a flat $1.00 fee to keep the spammers out.
              </p>
            </div>

            {/* Step 3 */}
            <div className="bg-[var(--color-charcoal)] border border-[#333] p-8 rounded-xl flex flex-col items-center text-center relative overflow-hidden group">
              <div className="absolute -top-6 -right-6 font-bebas-neue text-[120px] text-[#222] leading-none select-none group-hover:text-[#6b7280] transition-colors duration-500">
                3
              </div>
              <div className="w-16 h-16 rounded-full bg-[#444] flex items-center justify-center mb-6 relative z-10">
                <span className="text-2xl">🤝</span>
              </div>
              <h3 className="font-bold text-[var(--color-cream)] text-xl mb-3 relative z-10">
                Someone picks it up
              </h3>
              <p className="text-[var(--color-mid-gray)] text-sm relative z-10">
                Chat with locals, arrange a meetup, and hand it off. You just saved an item from the landfill. High five.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* RECENT LISTINGS SECTION */}
      <section className="py-20 container mx-auto px-4">
        <div className="flex items-center justify-between mb-10">
          <h2 className="font-bebas-neue text-4xl md:text-5xl text-[var(--color-cream)] tracking-wide uppercase">
            Fresh Junk
          </h2>
          <Link 
            href="/browse"
            className="text-[var(--color-rust)] font-bold text-sm uppercase tracking-wider hover:text-[var(--color-cream)] transition-colors"
          >
            View All &rarr;
          </Link>
        </div>
        
        {recentListings.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {recentListings.map((listing) => (
              <ListingCard key={listing.id} {...listing} />
            ))}
          </div>
        ) : (
          <div className="text-center py-12 bg-[#111] border border-[#333] rounded-xl">
            <p className="text-[var(--color-mid-gray)]">No fresh junk available right now. Be the first!</p>
            <Link 
              href="/list-item"
              className="inline-block mt-4 px-6 py-2 bg-[var(--color-rust)] text-[var(--color-cream)] font-bold uppercase tracking-wider rounded text-sm hover:bg-opacity-90 transition-colors"
            >
              Post an Item
            </Link>
          </div>
        )}
      </section>

    </div>
  )
}