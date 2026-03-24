export type ItemCondition = 'junk' | 'fair' | 'surprisingly_good'
export type ListingStatus = 'pending_payment' | 'active' | 'sold' | 'removed' | 'flagged'
export type ReportStatus = 'open' | 'reviewed' | 'dismissed'

export interface User {
  id: string
  username: string | null
  display_name: string | null
  avatar_url: string | null
  location_city: string | null
  location_state: string | null
  location_zip: string | null
  bio: string | null
  total_listings: number
  reputation_score: number
  is_banned: boolean
  created_at: string
}

export interface Category {
  id: string
  name: string
  slug: string
  icon: string
  description: string | null
}

export interface Listing {
  id: string
  seller_id: string
  title: string
  description: string | null
  category_id: string
  condition: ItemCondition
  asking_price: number
  is_free: boolean
  location_city: string
  location_state: string
  location_zip: string
  latitude: number | null
  longitude: number | null
  is_local_pickup: boolean
  is_shippable: boolean
  estimated_shipping_cost: number | null
  status: ListingStatus
  view_count: number
  stripe_session_id: string | null
  listing_fee_paid: boolean
  ai_moderation_flag: boolean
  ai_moderation_reason: string | null
  expires_at: string
  created_at: string
  updated_at: string
}

export interface ListingImage {
  id: string
  listing_id: string
  storage_path: string
  public_url: string
  is_primary: boolean
  sort_order: number
  created_at: string
}

export interface Message {
  id: string
  listing_id: string
  sender_id: string
  recipient_id: string
  body: string
  is_read: boolean
  created_at: string
}

export interface SavedListing {
  user_id: string
  listing_id: string
  created_at: string
}

export interface Report {
  id: string
  reporter_id: string
  listing_id: string
  reason: string
  details: string | null
  status: ReportStatus
  created_at: string
}

export interface ListingWithDetails extends Listing {
  seller: User
  category: Category
  images: ListingImage[]
}

export interface MessageWithParticipants extends Message {
  sender: User
  recipient: User
  listing: Listing
}

export interface ListingCardProps {
  id: string
  title: string
  asking_price: number
  condition: ItemCondition
  location_city: string
  location_state: string
  status: ListingStatus
  is_free: boolean
  is_shippable: boolean
  primary_image_url: string | null
  category_name: string
}