"use client"

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import type { Category } from '@/types'
import { AlertCircle } from 'lucide-react'

export default function CategoryGrid() {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  const supabase = createClient()

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const { data, error } = await supabase
          .from('categories')
          .select('*')
          // Optional: order by name or a specific sort column if added later
          .order('name')

        if (error) throw error

        setCategories(data ||[])
      } catch (err: any) {
        console.error('Error fetching categories:', err)
        setError('Failed to load categories.')
      } finally {
        setLoading(false)
      }
    }

    fetchCategories()
  }, [supabase])

  if (loading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {[...Array(10)].map((_, i) => (
          <div 
            key={i} 
            className="flex flex-col items-center justify-center p-6 bg-[var(--color-charcoal)] border border-[#333] rounded-xl animate-pulse h-[140px]"
          >
            <div className="w-12 h-12 bg-[#333] rounded-full mb-4"></div>
            <div className="w-20 h-4 bg-[#333] rounded"></div>
          </div>
        ))}
      </div>
    )
  }

  if (error || categories.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-8 bg-[var(--color-charcoal)] border border-[#333] rounded-xl text-center">
        <AlertCircle size={40} className="text-[var(--color-mid-gray)] mb-3" />
        <p className="text-[var(--color-cream)] font-bold">No categories found</p>
        <p className="text-[var(--color-mid-gray)] text-sm">{error || "Check back later for updates."}</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
      {categories.map((category) => (
        <Link
          key={category.id}
          href={`/category/${category.slug}`}
          className="group flex flex-col items-center justify-center p-6 bg-[var(--color-charcoal)] border border-[#333] rounded-xl hover:border-[var(--color-rust)] hover:scale-105 transition-all duration-300 text-center"
        >
          <span className="text-4xl mb-3 block group-hover:scale-110 transition-transform duration-300">
            {category.icon}
          </span>
          <span className="text-[var(--color-cream)] font-bold text-sm tracking-wide line-clamp-2">
            {category.name}
          </span>
        </Link>
      ))}
    </div>
  )
}