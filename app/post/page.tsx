"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Camera, Upload, X, Loader2, DollarSign } from 'lucide-react';

export default function PostItemPage() {
  const router = useRouter();
  const supabase = createClientComponentClient();

  // Form State
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [category, setCategory] = useState('General');

  // Image State
  const [images, setImages] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      setImages((prev) => [...prev, ...newFiles]);
      const newPreviews = newFiles.map(file => URL.createObjectURL(file));
      setPreviews((prev) => [...prev, ...newPreviews]);
    }
  };

  const removeImage = (index: number) => {
    setImages(images.filter((_, i) => i !== index));
    setPreviews(previews.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUploading(true);

    try {
      const imageUrls: string[] = [];

      // 1. Upload Images to Supabase Storage
      for (const file of images) {
        const fileExt = file.name.split('.').pop();
        const fileName = `${Math.random()}-${Date.now()}.${fileExt}`;
        const filePath = `items/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('ITEM-PHOTOS')
          .upload(filePath, file);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('ITEM-PHOTOS')
          .getPublicUrl(filePath);

        imageUrls.push(publicUrl);
      }

      // 2. Save Item with 'payment_pending' status
      const { data: newItem, error: dbError } = await supabase
        .from('items')
        .insert([
          {
            title,
            description,
            price: parseFloat(price),
            category,
            image_urls: imageUrls,
            status: 'payment_pending', // Hidden from browse until paid
            created_at: new Date().toISOString(),
          },
        ])
        .select()
        .single();

      if (dbError) throw dbError;

      // 3. Redirect to Stripe for the $1.00 Listing Fee
      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          itemId: newItem.id,
          itemTitle: title,
          mode: 'listing_fee' // Identifying this as a seller-side fee
        }),
      });

      const { url } = await response.json();
      if (url) {
        window.location.href = url; // Redirect to Stripe
      } else {
        throw new Error("Failed to generate checkout URL");
      }

    } catch (error) {
      console.error('Error initiating post:', error);
      alert('Error during post setup. Check console for details.');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6 bg-slate-900 text-white rounded-lg shadow-xl mt-10">
      <h1 className="text-3xl font-bold mb-6 flex items-center gap-2">
        Absolute <Camera className="text-blue-400" /> Post New Item
      </h1>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Image Upload Area */}
        <div className="border-2 border-dashed border-slate-700 p-4 rounded-lg bg-slate-800/50">
          <label className="block text-sm font-medium mb-2 text-slate-300">Item Photos</label>
          <div className="grid grid-cols-3 gap-4 mb-4">
            {previews.map((url, index) => (
              <div key={index} className="relative aspect-square rounded-md overflow-hidden border border-slate-600">
                <img src={url} alt="Preview" className="object-cover w-full h-full" />
                <button
                  type="button"
                  onClick={() => removeImage(index)}
                  className="absolute top-1 right-1 bg-red-500 rounded-full p-1 hover:bg-red-600"
                >
                  <X size={14} />
                </button>
              </div>
            ))}
            <label className="flex flex-col items-center justify-center aspect-square rounded-md border border-slate-600 bg-slate-700/50 cursor-pointer hover:bg-slate-700 transition">
              <Upload className="text-slate-400 mb-1" size={24} />
              <span className="text-xs text-slate-400">Add Photo</span>
              <input type="file" multiple accept="image/*" className="hidden" onChange={handleImageChange} />
            </label>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Item Title</label>
          <input
            required
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full p-3 bg-slate-800 border border-slate-700 rounded focus:ring-2 focus:ring-blue-500 outline-none"
            placeholder="What are you getting rid of?"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Asking Price ($)</label>
            <input
              required
              type="number"
              step="0.01"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              className="w-full p-3 bg-slate-800 border border-slate-700 rounded focus:ring-2 focus:ring-blue-500 outline-none"
              placeholder="0.00"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Category</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full p-3 bg-slate-800 border border-slate-700 rounded outline-none"
            >
              <option>General</option>
              <option>Electronics</option>
              <option>Tools</option>
              <option>Auto Parts</option>
              <option>Household</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Description</label>
          <textarea
            required
            rows={4}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full p-3 bg-slate-800 border border-slate-700 rounded focus:ring-2 focus:ring-blue-500 outline-none"
            placeholder="Condition, age, etc."
          />
        </div>

        <div className="bg-blue-900/30 p-4 rounded-lg border border-blue-500/50 flex items-start gap-3">
          <DollarSign className="text-blue-400 shrink-0 mt-1" size={20} />
          <p className="text-sm text-blue-100">
            <strong>Listing Fee: $1.00</strong>. You will be redirected to Stripe to pay your listing fee. 
            Once paid, your item will be visible to the community.
          </p>
        </div>

        <button
          type="submit"
          disabled={isUploading}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-lg transition flex items-center justify-center gap-2 disabled:opacity-50"
        >
          {isUploading ? (
            <><Loader2 className="animate-spin" /> Preparing Checkout...</>
          ) : (
            'Pay $1.00 & List Item'
          )}
        </button>
      </form>
    </div>
  );
}
