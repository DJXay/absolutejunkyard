import React from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import ListingCard from '@/components/ListingCard'
import MapView from '@/components/MapView'
import { Filter, Map as MapIcon, Grid, X, Search, AlertCircle, ChevronLeft, ChevronRight } from 'lucide-react'
import type { ListingCardProps } from '@/types'

// Helper to safely extract single string from search params
const getParam = (param: string | string[] | undefined): string => {
  if (Array.isArray(param)) return param[0]
  return param || ''
}

export default async function BrowsePage({
  searchParams,
}: {
  searchParams: {[key: string]: string | string[] | undefined }
}) {
  const supabase = await createClient()

  // 1. Parse all search params
  const q = getParam(searchParams.q)
  const categorySlug = getParam(searchParams.category)
  const condition = getParam(searchParams.condition)
  const minPrice = getParam(searchParams.min_price)
  const maxPrice = getParam(searchParams.max_price)
  const isFree = getParam(searchParams.is_free) === 'true'
  const isShippable = getParam(searchParams.is_shippable) === 'true'
  const sort = getParam(searchParams.sort) || 'newest'
  const view = getParam(searchParams.view) || 'grid'
  
  const pageParam = parseInt(getParam(searchParams.page))
  const currentPage = isNaN(pageParam) || pageParam < 1 ? 1 : pageParam
  const limit = 12
  const offset = (currentPage - 1) * limit

  // 2. Fetch Categories for the sidebar dropdown
  const { data: categoriesData } = await supabase
    .from('categories')
    .select('name, slug')
    .order('name')

  // 3. Build Supabase Query
  let query = supabase
    .from('listings')
    .select(`
      *,
      categories!inner ( name, slug ),
      listing_images ( public_url, is_primary )
    `, { count: 'exact' })
    .eq('status', 'active')

  // Apply Filters
  if (q) query = query.ilike('title', `%${q}%`)
  if (categorySlug) query = query.eq('categories.slug', categorySlug)
  if (condition) query = query.eq('condition', condition)
  if (minPrice) query = query.gte('asking_price', parseFloat(minPrice))
  if (maxPrice) query = query.lte('asking_price', parseFloat(maxPrice))
  if (isFree) query = query.eq('is_free', true)
  if (isShippable) query = query.eq('is_shippable', true)

  // Apply Sorting
  if (sort === 'price_asc') query = query.order('asking_price', { ascending: true })
  else if (sort === 'price_desc') query = query.order('asking_price', { ascending: false })
  else query = query.order('created_at', { ascending: false }) // 'newest' default

  // Apply Pagination
  query = query.range(offset, offset + limit - 1)

  // Execute Query
  const { data: listingsData, count, error } = await query

  const totalPages = count ? Math.ceil(count / limit) : 1

  // 4. Map data for components
  const listings: ListingCardProps[] = (listingsData ||[]).map((listing: any) => {
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

  // Data mapping specifically for MapView
  const mapListings = (listingsData ||[]).map((listing: any) => ({
    id: listing.id,
    title: listing.title,
    latitude: listing.latitude,
    longitude: listing.longitude,
    asking_price: listing.asking_price,
    location_city: listing.location_city,
    location_state: listing.location_state,
  }))

  // 5. URL Builder Helper for active filters & pagination
  const buildUrl = (updates: Record<string, string | null>) => {
    const params = new URLSearchParams()
    // Populate existing params
    Object.entries(searchParams).forEach(([key, val]) => {
      if (val) params.set(key, getParam(val))
    })
    // Apply updates
    Object.entries(updates).forEach(([key, value]) => {
      if (value === null) params.delete(key)
      else params.set(key, value)
    })
    return `/browse?${params.toString()}`
  }

  // Generate list of active filter chips
  const activeFilters =[]
  if (q) activeFilters.push({ label: `Search: "${q}"`, key: 'q' })
  if (categorySlug) {
    const catName = categoriesData?.find(c => c.slug === categorySlug)?.name || categorySlug
    activeFilters.push({ label: `Category: ${catName}`, key: 'category' })
  }
  if (condition) activeFilters.push({ label: `Condition: ${condition.replace('_', ' ')}`, key: 'condition' })
  if (minPrice) activeFilters.push({ label: `Min: $${minPrice}`, key: 'min_price' })
  if (maxPrice) activeFilters.push({ label: `Max: $${maxPrice}`, key: 'max_price' })
  if (isFree) activeFilters.push({ label: 'Free Items Only', key: 'is_free' })
  if (isShippable) activeFilters.push({ label: 'Shippable Only', key: 'is_shippable' })

  return (
    <div className="container mx-auto px-4 py-8 flex flex-col lg:flex-row gap-8">
      
      {/* SIDEBAR: FILTERS */}
      <aside className="w-full lg:w-1/4 lg:flex-shrink-0">
        {/* Mobile Accordion Wrapper (Tailwind hidden on desktop) */}
        <details className="group lg:hidden bg-[#1a1a1a] border border-[#333] rounded-xl mb-6 overflow-hidden">
          <summary className="flex items-center justify-between p-4 cursor-pointer font-bold text-[var(--color-cream)] select-none list-none marker:hidden">
            <div className="flex items-center">
              <Filter size={20} className="mr-2 text-[var(--color-rust)]" />
              Filter & Sort
            </div>
            <span className="text-[var(--color-mid-gray)] text-xl group-open:rotate-180 transition-transform">&#9662;</span>
          </summary>
          <div className="p-4 border-t border-[#333]">
            {/* The actual form is extracted below so it can be reused */}
            <FilterForm 
              categories={categoriesData ||[]}
              currentParams={{ q, categorySlug, condition, minPrice, maxPrice, isFree, isShippable, sort, view }}
            />
          </div>
        </details>

        {/* Desktop Fixed Sidebar */}
        <div className="hidden lg:block sticky top-24 bg-[#1a1a1a] border border-[#333] rounded-xl p-6">
          <div className="flex items-center mb-6 border-b border-[#333] pb-4">
            <Filter size={20} className="mr-2 text-[var(--color-rust)]" />
            <h2 className="font-bebas-neue text-2xl text-[var(--color-cream)] tracking-wide pt-1">
              Filters
            </h2>
          </div>
          <FilterForm 
            categories={categoriesData ||[]}
            currentParams={{ q, categorySlug, condition, minPrice, maxPrice, isFree, isShippable, sort, view }}
          />
        </div>
      </aside>

      {/* MAIN CONTENT: RESULTS */}
      <main className="w-full lg:w-3/4 flex flex-col">
        
        {/* Header: Title, Count, and View Toggles */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="font-bebas-neue text-4xl text-[var(--color-cream)] tracking-wide uppercase">
              Browse Junk
            </h1>
            <p className="text-[var(--color-mid-gray)] text-sm font-bold uppercase tracking-wider mt-1">
              {count || 0} listings found
            </p>
          </div>

          {/* View Toggles */}
          <div className="flex items-center bg-[#222] rounded-lg p-1 border border-[#333]">
            <Link
              href={buildUrl({ view: 'grid', page: '1' })}
              className={`flex items-center px-4 py-2 rounded-md text-sm font-bold transition-colors ${view === 'grid' ? 'bg-[var(--color-rust)] text-[var(--color-cream)]' : 'text-[var(--color-mid-gray)] hover:text-[var(--color-cream)]'}`}
            >
              <Grid size={16} className="mr-2" /> Grid
            </Link>
            <Link
              href={buildUrl({ view: 'map', page: '1' })}
              className={`flex items-center px-4 py-2 rounded-md text-sm font-bold transition-colors ${view === 'map' ? 'bg-[var(--color-rust)] text-[var(--color-cream)]' : 'text-[var(--color-mid-gray)] hover:text-[var(--color-cream)]'}`}
            >
              <MapIcon size={16} className="mr-2" /> Map
            </Link>
          </div>
        </div>

        {/* Active Filter Chips */}
        {activeFilters.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-6">
            {activeFilters.map(filter => (
              <Link
                key={filter.key}
                href={buildUrl({ [filter.key]: null, page: '1' })}
                className="flex items-center px-3 py-1 bg-[var(--color-olive)] bg-opacity-20 border border-[var(--color-olive)] text-[var(--color-cream)] text-xs rounded-full hover:bg-opacity-40 transition-colors"
                title={`Remove ${filter.label}`}
              >
                {filter.label}
                <X size={12} className="ml-2 text-[var(--color-rust)]" />
              </Link>
            ))}
            <Link
              href="/browse"
              className="flex items-center px-3 py-1 text-[var(--color-mid-gray)] hover:text-[var(--color-rust)] text-xs transition-colors font-bold underline"
            >
              Clear All
            </Link>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="bg-red-950/40 border border-red-900/50 p-6 rounded-xl flex items-center text-red-400 mb-8">
            <AlertCircle size={24} className="mr-4 flex-shrink-0" />
            <div>
              <h3 className="font-bold mb-1">Error loading listings</h3>
              <p className="text-sm">{error.message}</p>
            </div>
          </div>
        )}

        {/* Results Body */}
        {!error && listings.length === 0 ? (
          <div className="flex flex-col items-center justify-center bg-[#111] border border-[#333] rounded-xl py-24 text-center px-4">
            <Search size={48} className="text-[var(--color-mid-gray)] mb-4" />
            <h3 className="font-bold text-2xl text-[var(--color-cream)] mb-2">No junk found</h3>
            <p className="text-[var(--color-mid-gray)] mb-6 max-w-md">
              Try removing some filters, changing your search terms, or broadening your price range to find what you're looking for.
            </p>
            <Link 
              href="/browse"
              className="bg-[var(--color-rust)] text-[var(--color-cream)] px-6 py-2 rounded font-bold uppercase tracking-wide text-sm hover:bg-opacity-90 transition-colors"
            >
              Clear All Filters
            </Link>
          </div>
        ) : (
          <>
            {view === 'map' ? (
              <div className="w-full animate-in fade-in duration-500">
                <MapView listings={mapListings} height="600px" />
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6 animate-in fade-in duration-500">
                {listings.map((listing) => (
                  <ListingCard key={listing.id} {...listing} />
                ))}
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center space-x-2 mt-12 border-t border-[#333] pt-8">
                <Link
                  href={buildUrl({ page: (currentPage - 1).toString() })}
                  className={`p-2 border border-[#444] rounded hover:bg-[#222] transition-colors ${currentPage <= 1 ? 'pointer-events-none opacity-50' : 'text-[var(--color-cream)]'}`}
                  aria-disabled={currentPage <= 1}
                >
                  <ChevronLeft size={20} />
                </Link>
                
                <span className="text-[var(--color-mid-gray)] text-sm font-bold px-4">
                  Page {currentPage} of {totalPages}
                </span>

                <Link
                  href={buildUrl({ page: (currentPage + 1).toString() })}
                  className={`p-2 border border-[#444] rounded hover:bg-[#222] transition-colors ${currentPage >= totalPages ? 'pointer-events-none opacity-50' : 'text-[var(--color-cream)]'}`}
                  aria-disabled={currentPage >= totalPages}
                >
                  <ChevronRight size={20} />
                </Link>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  )
}

// --- Helper Component for the Form ---
// Kept in the same file to share logic without prop drilling across multiple files.
function FilterForm({ 
  categories, 
  currentParams 
}: { 
  categories: { name: string, slug: string }[],
  currentParams: any
}) {
  return (
    <form method="GET" action="/browse" className="flex flex-col space-y-5">
      
      {/* Hidden inputs to preserve view mode. Note: intentionally dropping 'page' so applying a filter resets to page 1 */}
      <input type="hidden" name="view" value={currentParams.view} />

      {/* Search */}
      <div className="flex flex-col">
        <label htmlFor="q" className="text-xs font-bold text-[var(--color-mid-gray)] uppercase tracking-wider mb-2">Search Terms</label>
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-mid-gray)]" />
          <input
            type="text"
            id="q"
            name="q"
            defaultValue={currentParams.q}
            placeholder="e.g. Broken toaster"
            className="w-full pl-9 pr-3 py-2 bg-[#2a2a2a] border border-[#444] rounded text-sm text-[var(--color-cream)] focus:border-[var(--color-olive)] focus:outline-none placeholder:text-[#666]"
          />
        </div>
      </div>

      {/* Sort */}
      <div className="flex flex-col">
        <label htmlFor="sort" className="text-xs font-bold text-[var(--color-mid-gray)] uppercase tracking-wider mb-2">Sort By</label>
        <select
          id="sort"
          name="sort"
          defaultValue={currentParams.sort}
          className="w-full p-2 bg-[#2a2a2a] border border-[#444] rounded text-sm text-[var(--color-cream)] focus:border-[var(--color-olive)] focus:outline-none appearance-none"
        >
          <option value="newest">Newest First</option>
          <option value="price_asc">Price: Low to High</option>
          <option value="price_desc">Price: High to Low</option>
        </select>
      </div>

      {/* Category */}
      <div className="flex flex-col">
        <label htmlFor="category" className="text-xs font-bold text-[var(--color-mid-gray)] uppercase tracking-wider mb-2">Category</label>
        <select
          id="category"
          name="category"
          defaultValue={currentParams.categorySlug}
          className="w-full p-2 bg-[#2a2a2a] border border-[#444] rounded text-sm text-[var(--color-cream)] focus:border-[var(--color-olive)] focus:outline-none appearance-none"
        >
          <option value="">All Categories</option>
          {categories.map(cat => (
            <option key={cat.slug} value={cat.slug}>{cat.name}</option>
          ))}
        </select>
      </div>

      {/* Condition */}
      <div className="flex flex-col">
        <label htmlFor="condition" className="text-xs font-bold text-[var(--color-mid-gray)] uppercase tracking-wider mb-2">Condition</label>
        <select
          id="condition"
          name="condition"
          defaultValue={currentParams.condition}
          className="w-full p-2 bg-[#2a2a2a] border border-[#444] rounded text-sm text-[var(--color-cream)] focus:border-[var(--color-olive)] focus:outline-none appearance-none"
        >
          <option value="">Any Condition</option>
          <option value="junk">Junk</option>
          <option value="fair">Fair</option>
          <option value="surprisingly_good">Surprisingly Good</option>
        </select>
      </div>

      {/* Price Range */}
      <div className="flex flex-col">
        <label className="text-xs font-bold text-[var(--color-mid-gray)] uppercase tracking-wider mb-2">Price Range</label>
        <div className="flex items-center space-x-2">
          <input
            type="number"
            name="min_price"
            defaultValue={currentParams.minPrice}
            placeholder="Min"
            min="0"
            step="1"
            className="w-1/2 p-2 bg-[#2a2a2a] border border-[#444] rounded text-sm text-[var(--color-cream)] focus:border-[var(--color-olive)] focus:outline-none"
          />
          <span className="text-[#666]">-</span>
          <input
            type="number"
            name="max_price"
            defaultValue={currentParams.maxPrice}
            placeholder="Max"
            min="0"
            step="1"
            className="w-1/2 p-2 bg-[#2a2a2a] border border-[#444] rounded text-sm text-[var(--color-cream)] focus:border-[var(--color-olive)] focus:outline-none"
          />
        </div>
      </div>

      {/* Checkboxes */}
      <div className="flex flex-col space-y-3 pt-2">
        <label className="flex items-center cursor-pointer group">
          <input
            type="checkbox"
            name="is_free"
            value="true"
            defaultChecked={currentParams.isFree}
            className="w-4 h-4 rounded border-[#444] bg-[#2a2a2a] text-[var(--color-rust)] focus:ring-[var(--color-rust)] focus:ring-offset-[#1a1a1a] cursor-pointer"
          />
          <span className="ml-3 text-sm font-medium text-[var(--color-cream)] group-hover:text-white transition-colors">Free Items Only</span>
        </label>
        
        <label className="flex items-center cursor-pointer group">
          <input
            type="checkbox"
            name="is_shippable"
            value="true"
            defaultChecked={currentParams.isShippable}
            className="w-4 h-4 rounded border-[#444] bg-[#2a2a2a] text-[var(--color-rust)] focus:ring-[var(--color-rust)] focus:ring-offset-[#1a1a1a] cursor-pointer"
          />
          <span className="ml-3 text-sm font-medium text-[var(--color-cream)] group-hover:text-white transition-colors">Shippable Only</span>
        </label>
      </div>

      {/* Submit Button */}
      <button 
        type="submit"
        className="mt-4 w-full py-3 bg-[var(--color-rust)] text-[var(--color-cream)] rounded font-bold uppercase tracking-wider text-sm hover:bg-opacity-90 transition-colors"
      >
        Apply Filters
      </button>
    </form>
  )
}