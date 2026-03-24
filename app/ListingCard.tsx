"use client"

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { Heart, MapPin, Truck, Image as ImageIcon } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import type { ListingCardProps } from '@/types'

export default function ListingCard({
  id,
  title,
  asking_price,
  condition,
  location_city,
  location_state,
  is_free,
  is_shippable,
  primary_image_url,
  category_name,
}: ListingCardProps) {
  const router = useRouter()
  const supabase = createClient()
  const[isSaved, setIsSaved] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  // Format condition text for badge (e.g., 'surprisingly_good' -> 'Surprisingly Good')
  const formatCondition = (cond: string) => {
    return cond.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')
  }

  const getConditionStyles = (cond: string) => {
    switch (cond) {
      case 'junk':
        return 'bg-red-950/40 text-red-400 border-red-800/50'
      case 'fair':
        return 'bg-yellow-950/40 text-yellow-400 border-yellow-800/50'
      case 'surprisingly_good':
        return 'bg-green-950/40 text-green-400 border-green-800/50'
      default:
        return 'bg-gray-800 text-gray-300 border-gray-600'
    }
  }

  const handleSaveToWatchlist = async (e: React.MouseEvent) => {
    e.preventDefault() // Prevent navigation to the listing page
    e.stopPropagation()

    if (isSaving) return

    setIsSaving(true)
    const { data: { session } } = await supabase.auth.getSession()

    if (!session) {
      // Not authenticated, redirect to login with return path
      router.push(`/login?redirect_to=/listing/${id}`)
      return
    }

    try {
      if (isSaved) {
        // Remove from watchlist
        await supabase
          .from('saved_listings')
          .delete()
          .match({ user_id: session.user.id, listing_id: id })
        setIsSaved(false)
      } else {
        // Add to watchlist
        await supabase
          .from('saved_listings')
          .insert({ user_id: session.user.id, listing_id: id })
        setIsSaved(true)
      }
    } catch (error) {
      console.error('Error toggling watchlist:', error)
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Link 
      href={`/listing/${id}`}
      className="group flex flex-col rounded-xl overflow-hidden bg-[var(--color-charcoal)] border border-[#333] hover:border-[var(--color-olive)] transition-all duration-200 h-full relative"
    >
      {/* Image Container */}
      <div className="relative aspect-square w-full bg-[#111] overflow-hidden">
        {primary_image_url ? (
          <Image
            src={primary_image_url}
            alt={title}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-300"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
        ) : (
          <div className="flex items-center justify-center w-full h-full text-[var(--color-mid-gray)]">
            <ImageIcon size={48} opacity={0.5} />
          </div>
        )}

        {/* Absolute Overlays */}
        {is_free && (
          <div className="absolute top-3 left-3 bg-[var(--color-olive)] text-[var(--color-cream)] text-xs font-bold px-2.5 py-1 rounded shadow-md uppercase tracking-wide">
            Free
          </div>
        )}

        <button
          onClick={handleSaveToWatchlist}
          disabled={isSaving}
          className="absolute top-3 right-3 p-2 rounded-full bg-black/40 backdrop-blur-sm hover:bg-black/60 transition-colors z-10"
          aria-label="Save to watchlist"
        >
          <Heart 
            size={20} 
            className={`transition-colors ${isSaved ? 'fill-[var(--color-rust)] text-[var(--color-rust)]' : 'text-[var(--color-cream)]'}`} 
          />
        </button>
      </div>

      {/* Content Container */}
      <div className="flex flex-col flex-grow p-4">
        <div className="flex justify-between items-start mb-2 gap-2">
          <h3 className="font-bold text-[var(--color-cream)] text-lg line-clamp-2 leading-tight flex-grow uppercase font-sans tracking-tight">
            {title}
          </h3>
          <span className="font-bold text-[var(--color-rust)] text-lg whitespace-nowrap">
            {is_free ? '$0.00' : `$${asking_price.toFixed(2)}`}
          </span>
        </div>

        <div className="mt-auto pt-3 space-y-3">
          {/* Location & Badges */}
          <div className="flex items-center text-sm text-[var(--color-mid-gray)]">
            <MapPin size={14} className="mr-1.5 flex-shrink-0" />
            <span className="truncate">{location_city}, {location_state}</span>
          </div>

          <div className="flex items-center justify-between mt-3 pt-3 border-t border-[#333]">
            <span className={`text-xs font-medium px-2 py-1 rounded border ${getConditionStyles(condition)}`}>
              {formatCondition(condition)}
            </span>

            {is_shippable && (
              <div className="flex items-center text-[var(--color-mid-gray)] text-xs" title="Shippable">
                <Truck size={16} className="mr-1" />
                <span>Shippable</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </Link>
  )
}