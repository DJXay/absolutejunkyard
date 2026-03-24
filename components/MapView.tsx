"use client"

import React, { useEffect, useRef, useState } from 'react'
import { MapPin } from 'lucide-react'

// CSS must be imported for Leaflet to render correctly
import 'leaflet/dist/leaflet.css'

interface ListingMapData {
  id: string
  title: string
  latitude: number | null
  longitude: number | null
  asking_price: number
  location_city: string
  location_state: string
}

interface MapViewProps {
  listings: ListingMapData[]
  center?: { lat: number; lng: number }
  zoom?: number
  height?: string
}

export default function MapView({ listings, center, zoom = 11, height = '400px' }: MapViewProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<any>(null)
  const [isMounted, setIsMounted] = useState(false)

  // Filter out any listings that don't have valid coordinates
  const validListings = listings.filter(
    (l) => l.latitude !== null && l.longitude !== null
  ) as (ListingMapData & { latitude: number; longitude: number })[]

  // Handle SSR: Only render map after component mounts on the client
  useEffect(() => {
    setIsMounted(true)
  },[])

  useEffect(() => {
    if (!isMounted || validListings.length === 0 || !mapContainerRef.current) return

    let L: any

    // Dynamically import leaflet to prevent "window is not defined" SSR errors
    import('leaflet').then((leaflet) => {
      L = leaflet.default || leaflet

      if (!mapInstanceRef.current) {
        // Determine map center
        let mapCenter = center
        if (!mapCenter && validListings.length > 0) {
          mapCenter = { lat: validListings[0].latitude, lng: validListings[0].longitude }
        } else if (!mapCenter) {
          mapCenter = { lat: 39.8283, lng: -98.5795 } // Center of US fallback
        }

        // Initialize map
        const map = L.map(mapContainerRef.current).setView([mapCenter.lat, mapCenter.lng], zoom)
        mapInstanceRef.current = map

        // Use CartoDB Dark Matter tiles (OpenStreetMap derived, no API key needed, matches brand)
        L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
          subdomains: 'abcd',
          maxZoom: 20
        }).addTo(map)

        // Fix Leaflet's default icon path issues in Next.js/Webpack
        delete L.Icon.Default.prototype._getIconUrl
        L.Icon.Default.mergeOptions({
          iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
          iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
          shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
        })

        // Add markers and bounds
        const bounds = L.latLngBounds()
        
        validListings.forEach((listing) => {
          const marker = L.marker([listing.latitude, listing.longitude]).addTo(map)
          bounds.extend([listing.latitude, listing.longitude])
          
          // Inject raw HTML for the popup. Styled with Tailwind utility classes.
          const popupContent = `
            <div class="p-1 min-w-[160px] font-sans">
              <h4 class="font-bold text-gray-900 leading-tight mb-1 text-sm">${listing.title}</h4>
              <div class="text-[#c2440e] font-bold mb-1">$${listing.asking_price.toFixed(2)}</div>
              <div class="text-gray-500 text-xs mb-3">${listing.location_city}, ${listing.location_state}</div>
              <a href="/listing/${listing.id}" class="block w-full text-center bg-[#c2440e] text-white text-xs font-bold py-2 px-3 rounded hover:bg-opacity-90 transition-colors no-underline uppercase tracking-wider">
                View Listing
              </a>
            </div>
          `
          marker.bindPopup(popupContent)
        })

        // Auto-fit map bounds if no specific center was provided and there are multiple listings
        if (!center && validListings.length > 1) {
          map.fitBounds(bounds, { padding: [50, 50] })
        }
      }
    })

    return () => {
      // Cleanup map instance on unmount to prevent memory leaks and HMR issues
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove()
        mapInstanceRef.current = null
      }
    }
  }, [isMounted, validListings, center, zoom])

  // SSR Placeholder
  if (!isMounted) {
    return (
      <div style={{ height }} className="w-full bg-[#111] border border-[#333] rounded-xl flex items-center justify-center">
        <div className="text-[var(--color-mid-gray)] text-sm animate-pulse">Loading map...</div>
      </div>
    )
  }

  // Fallback when no valid coordinate data exists
  if (validListings.length === 0) {
    return (
      <div style={{ height }} className="w-full bg-[#1a1a1a] border border-[#333] rounded-xl flex flex-col items-center justify-center p-6 text-center">
        <div className="w-12 h-12 rounded-full bg-[#222] flex items-center justify-center mb-3">
          <MapPin size={24} className="text-[var(--color-mid-gray)]" />
        </div>
        <h3 className="text-[var(--color-cream)] font-bold mb-1">No Location Data</h3>
        <p className="text-[var(--color-mid-gray)] text-sm max-w-xs">
          None of the current listings have valid map coordinates available to display.
        </p>
      </div>
    )
  }

  return (
    <div 
      style={{ height }} 
      className="w-full relative rounded-xl overflow-hidden border border-[#333] bg-[#1a1a1a] z-0"
    >
      {/* Container for Leaflet injection */}
      <div ref={mapContainerRef} className="w-full h-full" style={{ zIndex: 1 }} />
      
      {/* Minimal CSS override to make the Leaflet popup bubble blend slightly better */}
      <style dangerouslySetInnerHTML={{ __html: `
        .leaflet-popup-content-wrapper {
          border-radius: 0.5rem;
          padding: 0;
          box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.5);
        }
        .leaflet-popup-content {
          margin: 0.5rem;
        }
        .leaflet-container a.leaflet-popup-close-button {
          color: #999;
          padding: 4px;
        }
      `}} />
    </div>
  )
}