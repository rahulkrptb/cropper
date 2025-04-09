"use client"
import  ImageCropper  from "@/components/image-cropper";
import  ImageUploader  from "@/components/image-uploader";
import { ImageFile } from "@/types";
import Image from "next/image";
import { useState } from "react";

export default function Home() {
  const [imageFile, setImageFile] = useState<ImageFile | null>(null);
  const [croppedImage, setCroppedImage] = useState<string | null>(null);

  const handleUpload = (file: ImageFile) => {
    setImageFile(file);
    setCroppedImage(null);
  };

  const handleCroppedImage = (image: string) => {
    setCroppedImage(image);
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-4 md:p-8 lg:p-12 ">
      <div className="w-full min-w-5xl mx-auto space-y-8">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold text-gray-900">Image Cropper</h1>
          <p className="text-muted-foreground">
            Upload an image and crop it with precision. Supports PNG
            transparency and custom aspect ratios.
          </p>
        </div>
        {!imageFile && <ImageUploader onImageUpload={handleUpload} />}

        {imageFile && !croppedImage && <ImageCropper imageFile={imageFile} onCroppedImage={handleCroppedImage} />}

        {croppedImage && (
          <div className="space-x-4">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-bold text-gray-900">Cropped Image</h2>
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
            <div className="border rounded-lg p-4 flex justify-center">
              <img
                src={croppedImage || '/placeholder.svg'}
                alt="Cropped Image"
                className="max-h-[500px] object-cover rounded-lg"
              />
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
