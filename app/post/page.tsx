"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Camera, Upload, X, Loader2 } from 'lucide-react';

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

  // Handle image selection
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      setImages((prev) => [...prev, ...newFiles]);

      const newPreviews = newFiles.map(file => URL.createObjectURL(file));
      setPreviews((prev) => [...prev, ...newPreviews]);
    }
  };

  // Remove a selected image before uploading
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

        console.log(`Starting upload for: ${fileName}`);

        const { error: uploadError } = await supabase.storage
          .from('item-photos')
          .upload(filePath, file);

        if (uploadError) {
          console.error('Storage Upload Error:', uploadError);
          throw uploadError;
        }

        // Get the Public URL
        const { data: { publicUrl } } = supabase.storage
          .from('ITEM-PHOTOS')
          .getPublicUrl(filePath);

        // FIXED: This must be INSIDE the loop to capture every photo
        imageUrls.push(publicUrl);
        console.log(`Successfully captured URL: ${publicUrl}`);
      }

      // 2. Save Item Details to Database
      console.log('Sending data to Database...');
      const { error: dbError } = await supabase
        .from('items')
        .insert([
          {
            title,
            description,
            price: parseFloat(price),
            category,
            image_urls: imageUrls, // Now contains the full list of URLs
            created_at: new Date().toISOString(),
          },
        ]);

      if (dbError) {
        console.error('Database Insert Error:', dbError);
        throw dbError;
      }

      console.log('Post successful! Redirecting...');
      router.push('/browse');
      router.refresh();

    } catch (error) {
      console.error('Error posting item:', error);
      alert('Failed to post item. Check the browser console (F12) for details.');
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
              <input 
                type="file" 
                multiple 
                accept="image/*" 
                className="hidden" 
                onChange={handleImageChange} 
              />
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
            <label className="block text-sm font-medium mb-1">Price ($)</label>
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
            placeholder="Tell us about the condition, age, etc."
          />
        </div>

        <button
          type="submit"
          disabled={isUploading}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-lg transition flex items-center justify-center gap-2 disabled:opacity-50"
        >
          {isUploading ? (
            <><Loader2 className="animate-spin" /> Finalizing Post...</>
          ) : (
            'List Item for Sale'
          )}
        </button>
      </form>
    </div>
  );
}
