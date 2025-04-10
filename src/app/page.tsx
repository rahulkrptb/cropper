"use client"

import { useState } from "react"
import ImageUploader from "@/components/image-uploader"
import ImageCropper from "@/components/image-cropper"
import type { ImageFile } from "@/types"

export default function Home() {
  const [imageFile, setImageFile] = useState<ImageFile | null>(null)
  const [croppedImage, setCroppedImage] = useState<string | null>(null)

  const handleImageUpload = (file: ImageFile) => {
    setImageFile(file)
    setCroppedImage(null)
  }

  const handleCroppedImage = (image: string) => {
    setCroppedImage(image)
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-4 md:p-8 lg:p-12">
      <div className="w-full max-w-5xl mx-auto space-y-8">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold">Image Cropper</h1>
          <p className="text-muted-foreground">
            Upload an image and crop it with precision. Supports PNG transparency and custom aspect ratios.
          </p>
        </div>

        {!imageFile && <ImageUploader onImageUpload={handleImageUpload} />}

        {imageFile && !croppedImage && <ImageCropper imageFile={imageFile} onCroppedImage={handleCroppedImage} />}

        {croppedImage && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold">Cropped Result</h2>
              <div className="flex gap-2">
                <a
                  href={croppedImage}
                  download={`cropped-${imageFile?.name}`}
                  className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
                >
                  Download
                </a>
                <button
                  onClick={() => setImageFile(null)}
                  className="px-4 py-2 bg-muted hover:bg-muted/80 rounded-md transition-colors"
                >
                  Start Over
                </button>
              </div>
            </div>
            <div className="border rounded-lg p-4 flex flex-col items-center">
              <img
                src={croppedImage || "/placeholder.svg"}
                alt="Cropped result"
                className="max-h-[500px] object-contain"
                onLoad={(e) => {
                  const img = e.target as HTMLImageElement
                  const dimensions = document.getElementById("image-dimensions")
                  if (dimensions) {
                    dimensions.textContent = `${img.naturalWidth} × ${img.naturalHeight} pixels`
                  }
                }}
              />
              <p id="image-dimensions" className="mt-2 text-sm text-muted-foreground"></p>
            </div>
          </div>
        )}
      </div>
    </main>
  )
}
