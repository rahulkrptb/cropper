"use client"

import { useState, useCallback, useRef } from "react"
import Cropper from "react-easy-crop"
import { Slider } from "@/components/ui/slider"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import type { ImageFile } from "@/types"
import { ZoomIn, ZoomOut, RotateCcw, Crop, ArrowLeft, RefreshCcw } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface ImageCropperProps {
  imageFile: ImageFile
  onCroppedImage: (image: string) => void
}

interface CropArea {
  x: number
  y: number
  width: number
  height: number
}

export default function ImageCropper({ imageFile, onCroppedImage }: ImageCropperProps) {
  const [crop, setCrop] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [rotation, setRotation] = useState(0)
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<CropArea | null>(null)
  const [cropMode, setCropMode] = useState<"aspect" | "resolution">("aspect")
  const [aspectRatio, setAspectRatio] = useState<number>(1)
  const [customAspect, setCustomAspect] = useState<{ width: string; height: string }>({ width: "1", height: "1" })
  const [targetResolution, setTargetResolution] = useState<{ width: string; height: string }>({
    width: "1080",
    height: "1080",
  })
  const [extendCanvas, setExtendCanvas] = useState<boolean>(false)
  const [backgroundColor, setBackgroundColor] = useState<string>("#ffffff")

  const imageRef = useRef<HTMLImageElement | null>(null)

  // Load the image to get its natural dimensions
  const onImageLoad = useCallback((img: HTMLImageElement) => {
    imageRef.current = img
  }, [])

  const onCropComplete = useCallback((_: any, croppedAreaPixels: CropArea) => {
    setCroppedAreaPixels(croppedAreaPixels)
  }, [])

  const handleAspectRatioChange = useCallback(
    (value: string) => {
      if (value === "custom") {
        const ratio = Number.parseFloat(customAspect.width) / Number.parseFloat(customAspect.height)
        setAspectRatio(ratio || 1)
      } else {
        setAspectRatio(Number.parseFloat(value))
      }
    },
    [customAspect],
  )

  const handleCustomAspectChange = useCallback(
    (dimension: "width" | "height", value: string) => {
      const newCustomAspect = { ...customAspect, [dimension]: value }
      setCustomAspect(newCustomAspect)

      const width = Number.parseFloat(newCustomAspect.width)
      const height = Number.parseFloat(newCustomAspect.height)

      if (width && height) {
        setAspectRatio(width / height)
      }
    },
    [customAspect],
  )

  const createImage = (url: string): Promise<HTMLImageElement> => {
    return new Promise((resolve, reject) => {
      const image = new Image()
      image.addEventListener("load", () => resolve(image))
      image.addEventListener("error", (error) => reject(error))
      image.crossOrigin = "anonymous"
      image.src = url
    })
  }

  const getCroppedImg = async (
    imageSrc: string,
    pixelCrop: CropArea,
    rotation = 0,
    targetWidth?: number,
    targetHeight?: number,
    extend = false,
    bgColor = "#ffffff",
  ): Promise<string> => {
    const image = await createImage(imageSrc)
    const canvas = document.createElement("canvas")
    const ctx = canvas.getContext("2d")

    if (!ctx) {
      throw new Error("Could not get canvas context")
    }

    // Calculate the bounding box of the rotated image
    const imageWidth = image.naturalWidth
    const imageHeight = image.naturalHeight

    // Set canvas size based on crop or target resolution
    if (targetWidth && targetHeight) {
      canvas.width = targetWidth
      canvas.height = targetHeight
    } else {
      canvas.width = pixelCrop.width
      canvas.height = pixelCrop.height
    }

    // Fill with background color if extending canvas
    if (extend) {
      ctx.fillStyle = bgColor
      ctx.fillRect(0, 0, canvas.width, canvas.height)
    }

    // Save context
    ctx.save()

    // Move the canvas origin to the center of the image
    const centerX = canvas.width / 2
    const centerY = canvas.height / 2
    ctx.translate(centerX, centerY)

    // Rotate the canvas around the center
    ctx.rotate((rotation * Math.PI) / 180)

    // Calculate scaling to fit the crop area or target resolution
    let scale = 1
    if (targetWidth && targetHeight) {
      const cropAspect = pixelCrop.width / pixelCrop.height
      const targetAspect = targetWidth / targetHeight

      if (cropAspect > targetAspect) {
        // Crop is wider than target, scale to fit width
        scale = targetWidth / pixelCrop.width
      } else {
        // Crop is taller than target, scale to fit height
        scale = targetHeight / pixelCrop.height
      }
    }

    // Draw the image centered and scaled
    ctx.scale(scale, scale)
    ctx.drawImage(
      image,
      pixelCrop.x,
      pixelCrop.y,
      pixelCrop.width,
      pixelCrop.height,
      -pixelCrop.width / 2,
      -pixelCrop.height / 2,
      pixelCrop.width,
      pixelCrop.height,
    )

    // Restore context
    ctx.restore()

    // Get the data URL of the canvas
    // Use the original image type if possible
    let mimeType = "image/png"
    if (imageFile.type === "image/jpeg") {
      mimeType = "image/jpeg"
    } else if (imageFile.type === "image/webp") {
      mimeType = "image/webp"
    }

    return canvas.toDataURL(mimeType, 1.0)
  }

  const handleCrop = async () => {
    if (!croppedAreaPixels) return

    try {
      let targetWidth, targetHeight

      if (cropMode === "resolution") {
        targetWidth = Number.parseInt(targetResolution.width, 10) || 1080
        targetHeight = Number.parseInt(targetResolution.height, 10) || 1080
      }

      const croppedImage = await getCroppedImg(
        imageFile.url,
        croppedAreaPixels,
        rotation,
        targetWidth,
        targetHeight,
        extendCanvas,
        backgroundColor,
      )

      onCroppedImage(croppedImage)
    } catch (e) {
      console.error("Error cropping image:", e)
    }
  }

  const resetCrop = () => {
    setCrop({ x: 0, y: 0 })
    setZoom(1)
    setRotation(0)
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Crop Your Image</h2>
        {/* <Button variant="ghost" onClick={() => onCroppedImage("")} className="flex items-center gap-1">
          <ArrowLeft className="w-4 h-4" />
          Back
        </Button> */}
      </div>

      <div className="relative h-[400px] md:h-[500px] bg-muted/30  rounded-lg overflow-hidden">
        <Cropper
          image={imageFile.url}
          crop={crop}
          zoom={zoom}
          rotation={rotation}
          aspect={cropMode === "aspect" ? aspectRatio : undefined}
          onCropChange={setCrop}
          onCropComplete={onCropComplete}
          onZoomChange={setZoom}
          onMediaLoaded={(mediaSize) => {
            if (mediaSize && 'naturalWidth' in mediaSize) {
              onImageLoad(mediaSize as unknown as HTMLImageElement);
            }
          }}
          objectFit="contain"
        />
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <ZoomOut className="w-4 h-4 text-muted-foreground" />
            <Slider
              value={[zoom]}
              min={1}
              max={3}
              step={0.1}
              onValueChange={(value) => setZoom(value[0])}
              className="flex-1"
            />
            <ZoomIn className="w-4 h-4 text-muted-foreground" />
          </div>

          <div className="flex items-center gap-2">
            <RotateCcw className="w-4 h-4 text-muted-foreground" />
            <Slider
              value={[rotation]}
              min={0}
              max={360}
              step={1}
              onValueChange={(value) => setRotation(value[0])}
              className="flex-1"
            />
            <div className="w-12 text-center text-sm">{rotation}°</div>
          </div>

          <Button variant="outline" onClick={resetCrop} className="w-full flex items-center gap-2">
            <RefreshCcw className="w-4 h-4" />
            Reset
          </Button>
        </div>

        <div className="space-y-4">
          <Tabs defaultValue="aspect" onValueChange={(value) => setCropMode(value as "aspect" | "resolution")}>
            <TabsList className="w-full">
              <TabsTrigger value="aspect" className="flex-1">
                Aspect Ratio
              </TabsTrigger>
              <TabsTrigger value="resolution" className="flex-1">
                Target Resolution
              </TabsTrigger>
            </TabsList>

            <TabsContent value="aspect" className="space-y-4">
              <Select onValueChange={handleAspectRatioChange} defaultValue="1">
                <SelectTrigger>
                  <SelectValue placeholder="Select aspect ratio" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1:1 (Square)</SelectItem>
                  <SelectItem value="1.7777777777777777">16:9 (Landscape)</SelectItem>
                  <SelectItem value="0.5625">9:16 (Portrait)</SelectItem>
                  <SelectItem value="1.3333333333333333">4:3 (Classic)</SelectItem>
                  <SelectItem value="0.75">3:4 (Portrait)</SelectItem>
                  <SelectItem value="custom">Custom</SelectItem>
                </SelectContent>
              </Select>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-2">
                  <Label htmlFor="aspect-width">Width</Label>
                  <Input
                    id="aspect-width"
                    type="number"
                    min="1"
                    value={customAspect.width}
                    onChange={(e) => handleCustomAspectChange("width", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="aspect-height">Height</Label>
                  <Input
                    id="aspect-height"
                    type="number"
                    min="1"
                    value={customAspect.height}
                    onChange={(e) => handleCustomAspectChange("height", e.target.value)}
                  />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="resolution" className="space-y-4">
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-2">
                  <Label htmlFor="resolution-width">Width (px)</Label>
                  <Input
                    id="resolution-width"
                    type="number"
                    min="1"
                    value={targetResolution.width}
                    onChange={(e) => setTargetResolution({ ...targetResolution, width: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="resolution-height">Height (px)</Label>
                  <Input
                    id="resolution-height"
                    type="number"
                    min="1"
                    value={targetResolution.height}
                    onChange={(e) => setTargetResolution({ ...targetResolution, height: e.target.value })}
                  />
                </div>
              </div>
            </TabsContent>
          </Tabs>

          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="extend-canvas"
                checked={extendCanvas}
                onChange={(e) => setExtendCanvas(e.target.checked)}
                className="rounded border-gray-300"
              />
              <Label htmlFor="extend-canvas">Extend canvas if needed</Label>
            </div>

            {extendCanvas && (
              <div className="flex items-center gap-2">
                <Label htmlFor="bg-color" className="whitespace-nowrap">
                  Background:
                </Label>
                <div className="flex items-center gap-2 border rounded p-1">
                  <input
                    type="color"
                    id="bg-color"
                    value={backgroundColor}
                    onChange={(e) => setBackgroundColor(e.target.value)}
                    className="w-6 h-6 border-0"
                  />
                  <Input
                    value={backgroundColor}
                    onChange={(e) => setBackgroundColor(e.target.value)}
                    className="h-7 min-w-0 w-20"
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <Button onClick={handleCrop} className="w-full flex items-center gap-2 py-6">
        <Crop className="w-5 h-5" />
        Crop Image
      </Button>
    </div>
  )
}
