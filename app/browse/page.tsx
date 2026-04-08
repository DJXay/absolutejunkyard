"use client";

import React, { useState, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Search, Package, Image as ImageIcon, Loader2, MessageSquare } from 'lucide-react';

export default function BrowsePage() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClientComponentClient();

  // Fetch only items that have been "unlocked" by the seller's $1 payment
  useEffect(() => {
    async function fetchItems() {
      try {
        const { data, error } = await supabase
          .from('items')
          .select('*')
          .eq('status', 'available') // Only show paid/public listings
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

  // Handle local contact/interest (Future messaging feature)
  const handleContact = (itemTitle: string) => {
    alert(`Interested in the ${itemTitle}? This would typically open a chat window with the seller for local pickup.`);
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header Area */}
      <div className="bg-white border-b border-slate-200 p-6 sticky top-0 z-10 shadow-sm">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row gap-4 items-center">
          <h2 className="text-2xl font-black text-slate-900 shrink-0 tracking-tighter">ABSOLUTE JUNKYARD</h2>
          <div className="relative w-full">
            <input 
              type="text" 
              placeholder="Search for local treasures..." 
              className="w-full p-3 pl-10 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none text-slate-900"
            />
            <Search className="absolute left-3 top-3.5 text-slate-400" size={20} />
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto flex flex-col md:flex-row gap-8 p-6">
        
        {/* Category Sidebar */}
        <aside className="w-full md:w-64 space-y-8 shrink-0">
          <div>
            <h3 className="font-bold text-slate-700 mb-4 uppercase text-xs tracking-widest">Categories</h3>
            <ul className="space-y-2 text-slate-600">
              {['General', 'Electronics', 'Tools', 'Auto Parts', 'Household'].map(cat => (
                <li key={cat} className="hover:text-blue-600 cursor-pointer flex justify-between items-center group transition">
                  {cat}
                  <span className="text-xs bg-slate-200 px-2 py-0.5 rounded-full group-hover:bg-blue-100 group-hover:text-blue-700">
                    {items.filter(i => i.category === cat).length}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </aside>

        {/* Results Grid */}
        <main className="flex-1">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <Loader2 className="animate-spin text-blue-600 mb-4" size={48} />
              <p className="text-slate-500 font-medium">Scanning the yard...</p>
            </div>
          ) : items.length === 0 ? (
            <div className="text-center py-20 bg-white rounded-2xl border-2 border-dashed border-slate-200">
              <Package className="mx-auto text-slate-300 mb-4" size={64} />
              <p className="text-slate-500 text-lg">No treasures currently available in your area.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {items.map((item) => (
                <div key={item.id} className="group bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden hover:shadow-xl transition-all duration-300">
                  {/* Photo Section */}
                  <div className="h-52 bg-slate-100 overflow-hidden flex items-center justify-center relative">
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
                    <div className="absolute top-3 left-3 bg-white/90 backdrop-blur px-2 py-1 rounded text-[10px] font-bold text-slate-700 uppercase shadow-sm">
                      {item.category}
                    </div>
                  </div>

                  <div className="p-5">
                    <h4 className="text-xl font-bold text-slate-800 line-clamp-1 mb-1">{item.title}</h4>
                    <p className="text-slate-500 text-sm line-clamp-2 min-h-[40px] leading-relaxed">
                      {item.description}
                    </p>
                    
                    <div className="flex justify-between items-center mt-6 pt-4 border-t border-slate-100">
                      <div className="flex flex-col">
                        <span className="text-xs text-slate-400 font-bold uppercase tracking-tighter">Price</span>
                        <span className="text-2xl font-black text-green-600">
                          ${item.price.toFixed(2)}
                        </span>
                      </div>
                      
                      <button 
                        onClick={() => handleContact(item.title)}
                        className="bg-blue-600 text-white px-5 py-2.5 rounded-xl text-sm font-bold hover:bg-blue-700 transition-all flex items-center gap-2"
                      >
                        <MessageSquare size={16} />
                        Contact
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
