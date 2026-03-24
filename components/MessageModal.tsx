"use client"

import React, { useState, useEffect } from 'react'
import { X, Send, CheckCircle, AlertCircle, Loader2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

interface MessageModalProps {
  isOpen: boolean
  onClose: () => void
  listingId: string
  listingTitle: string
  sellerId: string
  sellerUsername: string
}

export default function MessageModal({
  isOpen,
  onClose,
  listingId,
  listingTitle,
  sellerId,
  sellerUsername
}: MessageModalProps) {
  const supabase = createClient()

  const [body, setBody] = useState('')
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [currentUsername, setCurrentUsername] = useState<string | null>(null)
  
  const [isSubmitting, setIsSubmitting] = useState(false)
  const[isSuccess, setIsSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Fetch current user details when modal opens
  useEffect(() => {
    if (!isOpen) return

    const fetchUser = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (session?.user) {
        setCurrentUserId(session.user.id)
        
        // Fetch username from public.users for the email notification
        const { data: profile } = await supabase
          .from('users')
          .select('username, display_name')
          .eq('id', session.user.id)
          .single()
          
        setCurrentUsername(
          profile?.username || 
          profile?.display_name || 
          session.user.email?.split('@')[0] || 
          'A user'
        )
      }
    }

    fetchUser()
    
    // Reset state when opening
    setBody('')
    setError(null)
    setIsSuccess(false)
    setIsSubmitting(false)
  }, [isOpen, supabase])

  // Handle Escape key to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown)
      // Prevent body scrolling behind modal
      document.body.style.overflow = 'hidden'
    }
    
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = 'unset'
    }
  },[isOpen, onClose])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (body.trim().length < 10) {
      setError('Message must be at least 10 characters long.')
      return
    }
    if (!currentUserId) {
      setError('You must be logged in to send a message.')
      return
    }

    setIsSubmitting(true)
    setError(null)

    try {
      // 1. Insert into Supabase messages table
      const { error: dbError } = await supabase
        .from('messages')
        .insert({
          listing_id: listingId,
          sender_id: currentUserId,
          recipient_id: sellerId,
          body: body.trim(),
          is_read: false
        })

      if (dbError) throw dbError

      // 2. Trigger email notification via Netlify Function
      const { data: { session } } = await supabase.auth.getSession()
      if (session?.access_token) {
        await fetch('/.netlify/functions/send-message-notification', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`
          },
          body: JSON.stringify({
            recipientId: sellerId,
            listingTitle,
            senderUsername: currentUsername,
            messagePreview: body.trim().substring(0, 100),
            listingId
          })
        }).catch(err => {
          // Log email failure but don't fail the message submission for the user
          console.error('Failed to trigger email notification:', err)
        })
      }

      // 3. Show success state
      setIsSuccess(true)
      
      // 4. Auto-close after 2 seconds
      setTimeout(() => {
        onClose()
      }, 2000)

    } catch (err: any) {
      console.error('Message submission error:', err)
      setError(err.message || 'Failed to send message. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!isOpen) return null

  const isOwnListing = currentUserId === sellerId

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm transition-opacity"
      onClick={onClose}
    >
      <div 
        className="w-full max-w-lg bg-[var(--color-charcoal)] border border-[#333] rounded-xl shadow-2xl overflow-hidden relative"
        onClick={e => e.stopPropagation()} // Prevent clicks inside modal from closing it
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-[#333] bg-[#222]">
          <h2 className="font-bebas-neue text-2xl text-[var(--color-cream)] tracking-wide mt-1">
            Message Seller
          </h2>
          <button 
            onClick={onClose}
            className="p-2 text-[var(--color-mid-gray)] hover:text-[var(--color-cream)] transition-colors rounded-full hover:bg-[#333]"
            aria-label="Close modal"
          >
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="p-6">
          {isOwnListing ? (
             <div className="text-center py-8">
               <AlertCircle size={48} className="mx-auto text-[var(--color-mid-gray)] mb-4" />
               <h3 className="text-lg font-bold text-[var(--color-cream)] mb-2">This is your listing</h3>
               <p className="text-[var(--color-mid-gray)] text-sm">
                 You cannot send a message to yourself. Go to your dashboard to manage your listings.
               </p>
             </div>
          ) : isSuccess ? (
            <div className="text-center py-8 animate-in fade-in zoom-in duration-300">
              <CheckCircle size={64} className="mx-auto text-[var(--color-olive)] mb-4" />
              <h3 className="text-2xl font-bebas-neue tracking-wide text-[var(--color-cream)] mb-2">
                Message Sent!
              </h3>
              <p className="text-[var(--color-mid-gray)] text-sm">
                {sellerUsername} has been notified.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="mb-4">
                <div className="text-sm text-[var(--color-mid-gray)] mb-1">Regarding:</div>
                <div className="font-bold text-[var(--color-cream)]">{listingTitle}</div>
              </div>

              {error && (
                <div className="flex items-center p-3 text-sm text-red-400 bg-red-950/30 border border-red-900/50 rounded-lg">
                  <AlertCircle size={16} className="mr-2 flex-shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <div className="relative">
                <textarea
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  placeholder={`Hi ${sellerUsername}, is this still available?`}
                  className="w-full h-32 p-3 rounded-lg bg-[#2a2a2a] text-[var(--color-cream)] border border-[#444] focus:border-[var(--color-olive)] focus:outline-none resize-none placeholder:text-[#666]"
                  maxLength={500}
                  disabled={isSubmitting}
                />
                <div className="absolute bottom-3 right-3 text-xs font-medium text-[var(--color-mid-gray)]">
                  <span className={body.length < 10 || body.length === 500 ? 'text-[var(--color-rust)]' : ''}>
                    {body.length}
                  </span>
                  /500
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting || body.trim().length < 10}
                className="w-full flex items-center justify-center py-3 px-4 bg-[var(--color-rust)] hover:bg-opacity-90 disabled:opacity-50 disabled:cursor-not-allowed text-[var(--color-cream)] font-bold rounded-lg uppercase tracking-wide transition-all"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 size={18} className="animate-spin mr-2" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Send size={18} className="mr-2" />
                    Send Message
                  </>
                )}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}