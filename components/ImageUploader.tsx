"use client"

import React, { useState, useEffect, useRef, useCallback } from 'react'
import Image from 'next/image'
import { UploadCloud, X, AlertCircle, Loader2, Image as ImageIcon } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

interface ImageUploaderProps {
  onImagesChange: (urls: string[]) => void
  maxImages?: number
}

interface UploadedImage {
  url: string
  path: string
}

interface UploadingFile {
  id: string
  file: File
  previewUrl: string
}

const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB
const ACCEPTED_TYPES =['image/jpeg', 'image/jpg', 'image/png', 'image/webp']

export default function ImageUploader({ onImagesChange, maxImages = 5 }: ImageUploaderProps) {
  const supabase = createClient()
  
  const [userId, setUserId] = useState<string | null>(null)
  const[uploadedImages, setUploadedImages] = useState<UploadedImage[]>([])
  const [uploadingFiles, setUploadingFiles] = useState<UploadingFile[]>([])
  const [isDragging, setIsDragging] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Fetch authenticated user ID on mount for storage path
  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        setUserId(user.id)
      } else {
        setError("You must be logged in to upload images.")
      }
    }
    fetchUser()
  },[supabase])

  // Sync URLs to parent component whenever uploadedImages changes
  useEffect(() => {
    onImagesChange(uploadedImages.map((img) => img.url))
  }, [uploadedImages, onImagesChange])

  // Cleanup object URLs to avoid memory leaks
  useEffect(() => {
    return () => {
      uploadingFiles.forEach((f) => URL.revokeObjectURL(f.previewUrl))
    }
  },[uploadingFiles])

  const validateFiles = (files: File[]): File[] => {
    setError(null)
    const validFiles: File[] =[]
    let currentTotal = uploadedImages.length + uploadingFiles.length

    for (const file of files) {
      if (currentTotal >= maxImages) {
        setError(`You can only upload up to ${maxImages} images.`)
        break
      }

      if (!ACCEPTED_TYPES.includes(file.type)) {
        setError(`File ${file.name} is not a supported format (JPG, PNG, WEBP only).`)
        continue
      }

      if (file.size > MAX_FILE_SIZE) {
        setError(`File ${file.name} exceeds the 5MB size limit.`)
        continue
      }

      validFiles.push(file)
      currentTotal++
    }

    return validFiles
  }

  const handleFiles = async (files: FileList | File[]) => {
    if (!userId) {
      setError("Authentication error. Please refresh and try again.")
      return
    }

    const validFiles = validateFiles(Array.from(files))
    if (validFiles.length === 0) return

    // Create local previews and add to uploading state
    const newUploadingFiles = validFiles.map((file) => ({
      id: Math.random().toString(36).substring(7),
      file,
      previewUrl: URL.createObjectURL(file),
    }))

    setUploadingFiles((prev) =>[...prev, ...newUploadingFiles])

    // Process uploads concurrently
    await Promise.all(
      newUploadingFiles.map(async (uploadingFile) => {
        try {
          const timestamp = Date.now()
          // Sanitize filename to prevent URL issues
          const safeName = uploadingFile.file.name.replace(/[^a-zA-Z0-9.\-_]/g, '')
          const filePath = `listings/${userId}/${timestamp}-${safeName}`

          const { error: uploadError } = await supabase.storage
            .from('listing-images')
            .upload(filePath, uploadingFile.file, {
              cacheControl: '3600',
              upsert: false,
            })

          if (uploadError) throw uploadError

          const { data: { publicUrl } } = supabase.storage
            .from('listing-images')
            .getPublicUrl(filePath)

          // Move from uploading status to uploaded
          setUploadedImages((prev) =>[...prev, { url: publicUrl, path: filePath }])
          setUploadingFiles((prev) => prev.filter((f) => f.id !== uploadingFile.id))
          
        } catch (err: any) {
          console.error("Upload failed:", err)
          setError(`Failed to upload ${uploadingFile.file.name}.`)
          setUploadingFiles((prev) => prev.filter((f) => f.id !== uploadingFile.id))
        }
      })
    )
  }

  const handleRemoveImage = async (indexToRemove: number) => {
    const imageToRemove = uploadedImages[indexToRemove]
    
    // Optimistically update UI
    setUploadedImages((prev) => prev.filter((_, i) => i !== indexToRemove))

    // Delete from Supabase Storage
    try {
      const { error } = await supabase.storage
        .from('listing-images')
        .remove([imageToRemove.path])

      if (error) {
        console.error("Failed to delete image from storage:", error)
        // Optionally revert UI if deletion fails, but usually fine to just leave it out of the listing
      }
    } catch (err) {
      console.error("Error removing image:", err)
    }
  }

  // Drag and Drop Handlers
  const onDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(true)
  },[])

  const onDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
  },[])

  const onDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files)
      e.dataTransfer.clearData()
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [uploadedImages, uploadingFiles, userId]) // depend on states used in validation/upload

  const onFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFiles(e.target.files)
      // Reset input so the same file can be selected again if needed
      e.target.value = ''
    }
  }

  const totalImages = uploadedImages.length + uploadingFiles.length

  return (
    <div className="w-full space-y-4">
      {/* Error Banner */}
      {error && (
        <div className="flex items-center p-3 text-sm text-red-400 bg-red-950/30 border border-red-900/50 rounded-lg">
          <AlertCircle size={16} className="mr-2 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Upload Zone */}
      {totalImages < maxImages && (
        <div
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          onDrop={onDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`relative flex flex-col items-center justify-center w-full p-8 border-2 border-dashed rounded-xl cursor-pointer transition-colors duration-200 ease-in-out bg-[#1a1a1a]
            ${isDragging 
              ? 'border-[var(--color-olive)] bg-[var(--color-olive)]/10' 
              : 'border-[#444] hover:border-[var(--color-mid-gray)] hover:bg-[#222]'
            }`}
        >
          <input
            type="file"
            ref={fileInputRef}
            onChange={onFileInputChange}
            accept={ACCEPTED_TYPES.join(',')}
            multiple
            className="hidden"
          />
          <div className="flex flex-col items-center justify-center text-[var(--color-mid-gray)]">
            <UploadCloud size={40} className="mb-3 text-[var(--color-mid-gray)]" />
            <p className="mb-2 text-sm text-[var(--color-cream)] font-medium">
              <span className="font-bold text-[var(--color-rust)]">Click to upload</span> or drag and drop
            </p>
            <p className="text-xs">JPG, PNG, WEBP (Max {maxImages} images, 5MB each)</p>
          </div>
        </div>
      )}

      {/* Image Previews Grid */}
      {totalImages > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mt-4">
          
          {/* Successfully Uploaded Images */}
          {uploadedImages.map((image, index) => (
            <div key={image.path} className="relative aspect-square rounded-lg overflow-hidden border border-[#333] bg-[#111] group">
              <Image
                src={image.url}
                alt={`Uploaded listing image ${index + 1}`}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 20vw"
              />
              
              {/* Primary Label */}
              {index === 0 && (
                <div className="absolute top-2 left-2 bg-[var(--color-olive)] text-[var(--color-cream)] text-[10px] font-bold px-2 py-1 rounded shadow-md uppercase tracking-wider">
                  Primary
                </div>
              )}

              {/* Remove Button */}
              <button
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  handleRemoveImage(index)
                }}
                className="absolute top-2 right-2 p-1.5 bg-black/60 hover:bg-red-600/80 text-white rounded-full transition-colors opacity-0 group-hover:opacity-100 backdrop-blur-sm"
                aria-label="Remove image"
              >
                <X size={14} />
              </button>
            </div>
          ))}

          {/* Currently Uploading Files (Local Previews) */}
          {uploadingFiles.map((uploadingFile) => (
            <div key={uploadingFile.id} className="relative aspect-square rounded-lg overflow-hidden border border-[#333] bg-[#111]">
              <Image
                src={uploadingFile.previewUrl}
                alt="Uploading preview"
                fill
                className="object-cover opacity-50 blur-[2px]"
                sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 20vw"
              />
              {/* Loading Overlay */}
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/40">
                <Loader2 size={24} className="text-[var(--color-cream)] animate-spin mb-2" />
                <span className="text-xs text-[var(--color-cream)] font-medium">Uploading...</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Counter */}
      <div className="flex justify-end text-xs text-[var(--color-mid-gray)]">
        {totalImages} / {maxImages} images
      </div>
    </div>
  )
}