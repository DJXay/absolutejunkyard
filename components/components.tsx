"use client"

import React, { useState, useEffect } from 'react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { Heart, MessageSquare, ImageIcon, Loader2 } from 'lucide-react'
import MessageModal from '@/components/MessageModal'
import { createClient } from '@/lib/supabase/client'

// --- 1. IMAGE GALLERY COMPONENT ---
interface ImageGalleryProps {
  images: Array<{
    id: string
    public_url: string
    is_primary: boolean
    sort_order: number
  }>
}

export function ImageGallery({ images }: ImageGalleryProps) {
  const [selectedIndex, setSelectedIndex] = useState(0)

  // Sort images so primary is first, then by sort_order
  const sortedImages = [...images].sort((a, b) => {
    if (a.is_primary && !b.is_primary) return -1
    if (!a.is_primary && b.is_primary) return 1
    return a.sort_order - b.sort_order
  })

  const currentImage = sortedImages[selectedIndex]

  if (!images || images.length === 0) {
    return (
      <div className="w-full aspect-square bg-[#111] border border-[#333] rounded-xl flex flex-col items-center justify-center text-[var(--color-mid-gray)]">
        <ImageIcon size={64} className="mb-4 opacity-50" />
        <span className="text-sm font-bold uppercase tracking-wider">No Images</span>
      </div>
    )
  }

  return (
    <div className="flex flex-col space-y-4 w-full">
      {/* Main Image Viewport */}
      <div className="relative w-full aspect-square bg-[#111] rounded-xl overflow-hidden border border-[#333] group">
        {/* Count Indicator */}
        <div className="absolute top-4 right-4 z-10 bg-black/60 backdrop-blur-sm text-[var(--color-cream)] text-xs font-bold px-3 py-1.5 rounded-full shadow-lg">
          {selectedIndex + 1} / {sortedImages.length}
        </div>

        <Image
          key={currentImage.id} // Forces re-render for smooth transition animation if desired
          src={currentImage.public_url}
          alt={`Listing image ${selectedIndex + 1}`}
          fill
          priority
          className="object-cover animate-in fade-in duration-300 ease-in-out"
          sizes="(max-width: 1024px) 100vw, 55vw"
        />
      </div>

      {/* Thumbnail Strip */}
      {sortedImages.length > 1 && (
        <div className="flex gap-3 overflow-x-auto pb-2 custom-scrollbar">
          {sortedImages.map((img, index) => (
            <button
              key={img.id}
              onClick={() => setSelectedIndex(index)}
              className={`relative flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden transition-all duration-200 ${
                selectedIndex === index 
                  ? 'border-2 border-[var(--color-rust)] scale-95 opacity-100' 
                  : 'border-2 border-transparent opacity-60 hover:opacity-100 hover:border-[#444]'
              }`}
            >
              <Image 
                src={img.public_url} 
                alt={`Thumbnail ${index + 1}`} 
                fill 
                className="object-cover"
                sizes="80px"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}


// --- 2. LISTING ACTIONS COMPONENT ---
interface ListingActionsProps {
  listingId: string
  listingTitle: string
  sellerId: string
  sellerUsername: string
  initialIsSaved: boolean
  isAuthenticated: boolean
}

export function ListingActions({
  listingId,
  listingTitle,
  sellerId,
  sellerUsername,
  initialIsSaved,
  isAuthenticated
}: ListingActionsProps) {
  const router = useRouter()
  const supabase = createClient()
  
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isSaved, setIsSaved] = useState(initialIsSaved)
  const[isSaving, setIsSaving] = useState(false)
  const [isMessageLoading, setIsMessageLoading] = useState(false)

  const handleMessageClick = () => {
    if (!isAuthenticated) {
      setIsMessageLoading(true)
      router.push(`/login?redirect_to=/listing/${listingId}`)
    } else {
      setIsModalOpen(true)
    }
  }

  const handleToggleWatchlist = async () => {
    if (!isAuthenticated) {
      router.push(`/login?redirect_to=/listing/${listingId}`)
      return
    }

    if (isSaving) return
    setIsSaving(true)

    // Optimistic UI Update
    const previousState = isSaved
    setIsSaved(!isSaved)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error("Not authenticated")

      if (previousState) {
        // Was saved, now unsave
        const { error } = await supabase
          .from('saved_listings')
          .delete()
          .match({ user_id: user.id, listing_id: listingId })
        if (error) throw error
      } else {
        // Was not saved, now save
        const { error } = await supabase
          .from('saved_listings')
          .insert({ user_id: user.id, listing_id: listingId })
        if (error) throw error
      }
    } catch (error) {
      console.error("Failed to toggle watchlist:", error)
      // Revert optimistic update on failure
      setIsSaved(previousState)
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <>
      <div className="flex items-stretch gap-4">
        <button
          onClick={handleMessageClick}
          disabled={isMessageLoading}
          className="flex-1 flex items-center justify-center py-4 bg-[var(--color-rust)] hover:bg-opacity-90 disabled:opacity-70 disabled:cursor-not-allowed text-[var(--color-cream)] font-bold rounded-xl uppercase tracking-wider transition-colors"
        >
          {isMessageLoading ? (
            <Loader2 size={20} className="mr-2 animate-spin" />
          ) : (
            <MessageSquare size={20} className="mr-2" />
          )}
          Send Message
        </button>
        
        <button
          onClick={handleToggleWatchlist}
          disabled={isSaving}
          className={`px-6 border rounded-xl transition-all duration-200 flex items-center justify-center ${
            isSaved 
              ? 'border-[var(--color-rust)] bg-red-950/20 text-[var(--color-rust)]' 
              : 'border-[#444] hover:bg-[#222] text-[var(--color-mid-gray)] hover:text-[var(--color-cream)]'
          } disabled:opacity-50`}
          aria-label={isSaved ? "Remove from watchlist" : "Save to watchlist"}
        >
          {isSaving ? (
            <Loader2 size={24} className="animate-spin text-[var(--color-mid-gray)]" />
          ) : (
            <Heart 
              size={24} 
              className={`transition-colors ${isSaved ? 'fill-[var(--color-rust)] text-[var(--color-rust)]' : ''}`} 
            />
          )}
        </button>
      </div>

      <MessageModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        listingId={listingId}
        listingTitle={listingTitle}
        sellerId={sellerId}
        sellerUsername={sellerUsername}
      />
    </>
  )
}