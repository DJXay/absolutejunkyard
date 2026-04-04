"use client";

import React, { useState, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Search, Package, Image as ImageIcon, Loader2 } from 'lucide-react';

export default function BrowsePage() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClientComponentClient();

  // Fetch items from Supabase on page load
  useEffect(() => {
    async function fetchItems() {
      try {
        const { data, error } = await supabase
          .from('items')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) throw error;
        setItems(data || []);
      } catch (error) {
        console.error('Error fetching junk:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchItems();
  }, [supabase]);

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Top Search Bar Area */}
      <div className="bg-white border-b border-slate-200 p-6 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row gap-4 items-center">
          <h2 className="text-2xl font-bold text-slate-800 shrink-0">Browse Junk</h2>
          <div className="relative w-full">
            <input 
              type="text" 
              placeholder="Search for treasures..." 
              className="w-full p-3 pl-10 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none text-slate-900"
            />
            <Search className="absolute left-3 top-3.5 text-slate-400" size={20} />
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto flex flex-col md:flex-row gap-8 p-6">
        
        {/* Sidebar Filters */}
        <aside className="w-full md:w-64 space-y-8 shrink-0">
          <div>
            <h3 className="font-bold text-slate-700 mb-4 uppercase text-xs tracking-widest">Categories</h3>
            <ul className="space-y-2 text-slate-600">
              {['General', 'Electronics', 'Tools', 'Auto Parts', 'Household'].map(cat => (
                <li key={cat} className="hover:text-blue-600 cursor-pointer flex justify-between">
                  {cat}
                </li>
              ))}
            </ul>
          </div>
        </aside>

        {/* Results Grid */}
        <main className="flex-1">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <Loader2 className="animate-spin text-blue-600 mb-2" size={40} />
              <p className="text-slate-500">Scanning the junkyard...</p>
            </div>
          ) : items.length === 0 ? (
            <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-slate-300">
              <Package className="mx-auto text-slate-300 mb-4" size={48} />
              <p className="text-slate-500 font-medium">The yard is empty right now.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {items.map((item) => (
                <div key={item.id} className="group bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden hover:shadow-md transition">
                  {/* Image Display */}
                  <div className="h-48 bg-slate-100 overflow-hidden flex items-center justify-center relative">
                    {item.image_urls && item.image_urls.length > 0 ? (
                      <img 
                        src={item.image_urls[0]} 
                        alt={item.title}
                        className="object-cover w-full h-full group-hover:scale-105 transition duration-500"
                      />
                    ) : (
                      <div className="flex flex-col items-center text-slate-300">
                        <ImageIcon size={48} />
                        <span className="text-xs mt-2 uppercase font-bold tracking-tighter">No Image</span>
                      </div>
                    )}
                  </div>

                  <div className="p-5">
                    <span className="text-xs font-bold text-blue-600 uppercase tracking-tighter">
                      {item.category}
                    </span>
                    <h4 className="text-lg font-bold text-slate-800 mt-1 line-clamp-1">{item.title}</h4>
                    <p className="text-slate-500 text-sm mt-2 line-clamp-2 min-h-[40px]">
                      {item.description}
                    </p>
                    <div className="flex justify-between items-center mt-4">
                      <span className="text-xl font-black text-slate-900">
                        ${item.price.toFixed(2)}
                      </span>
                      <button className="bg-slate-900 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-600 transition">
                        Details
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
