"use client"

import type React from "react"

import { useState, useCallback } from "react"
import { Upload, ImageIcon } from "lucide-react"
import type { ImageFile } from "@/types"

interface ImageUploaderProps {
  onImageUpload: (file: ImageFile) => void
}

export default function ImageUploader({ onImageUpload }: ImageUploaderProps) {
  const [isDragging, setIsDragging] = useState(false)

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
  }, [])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.dataTransfer) {
      e.dataTransfer.dropEffect = "copy"
    }
    setIsDragging(true)
  }, [])

  const processFile = useCallback(
    (file: File) => {
      if (!file.type.match(/^image\/(jpeg|png|webp|gif)/i)) {
        alert("File must be an image (JPEG, PNG, WebP, or GIF)")
        return
      }

      const reader = new FileReader()
      reader.onload = (e) => {
        if (e.target?.result) {
          const imageFile: ImageFile = {
            file,
            name: file.name,
            type: file.type,
            url: e.target.result as string,
          }
          onImageUpload(imageFile)
        }
      }
      reader.readAsDataURL(file)
    },
    [onImageUpload],
  )

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      e.stopPropagation()
      setIsDragging(false)

      if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        const file = e.dataTransfer.files[0]
        processFile(file)
      }
    },
    [processFile],
  )

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files.length > 0) {
        const file = e.target.files[0]
        processFile(file)
      }
    },
    [processFile],
  )

  return (
    <div
      className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
        isDragging ? "border-primary bg-primary/5" : "border-muted-foreground/20"
      }`}
      onDragEnter={handleDragEnter}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <div className="flex flex-col items-center justify-center gap-4">
        <div className="p-4 bg-muted rounded-full">
          {isDragging ? (
            <ImageIcon className="w-8 h-8 text-primary" />
          ) : (
            <Upload className="w-8 h-8 text-muted-foreground" />
          )}
        </div>
        <div className="space-y-2">
          <h3 className="text-lg font-medium">{isDragging ? "Drop your image here" : "Upload an image"}</h3>
          <p className="text-sm text-muted-foreground">Supports PNG, JPEG, WebP, and GIF</p>
          <p className="text-xs text-muted-foreground">PNG transparency will be preserved</p>
        </div>
        <label className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors cursor-pointer">
          Select File
          <input
            type="file"
            className="hidden"
            accept="image/jpeg,image/png,image/webp,image/gif"
            onChange={handleFileChange}
          />
        </label>
      </div>
    </div>
  )
}
