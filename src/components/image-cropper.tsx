"use client"

import { useState, useCallback, memo } from "react"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import type { ImageFile } from "@/types"
import { Crop } from "lucide-react"
import { useImageCrop } from "@/hooks/use-image-crop"
import { CropAreaOverlay } from "@/components/crop-area"
import { CropControls } from "@/components/crop-controls"
import { AspectRatioControls } from "@/components/aspect-ratio-controls"
import { ResolutionControls } from "@/components/resolution-controls"
import { CanvasExtensionControls } from "@/components/canvas-extension-controls"

interface ImageCropperProps {
  imageFile: ImageFile
  onCroppedImage: (image: string) => void
}

// Memoized image component for better performance
const CropperImage = memo(function CropperImage({
  imageFile,
  imagePosition,
  imageSize,
  rotation,
  imageLoaded,
  handleImageLoad,
}: {
  imageFile: ImageFile
  imagePosition: { x: number; y: number }
  imageSize: { width: number; height: number }
  rotation: number
  imageLoaded: boolean
  handleImageLoad: () => void
}) {
  return (
    <img
      ref={(el) => {
        if (el) {
          el.draggable = false
        }
      }}
      src={imageFile.url || "/placeholder.svg"}
      alt="Upload"
      className="absolute select-none pointer-events-none"
      style={{
        left: imagePosition.x,
        top: imagePosition.y,
        width: imageSize.width,
        height: imageSize.height,
        transform: `rotate(${rotation}deg)`,
        transformOrigin: "center center",
        objectFit: "contain",
        willChange: "transform",
        visibility: imageLoaded ? "visible" : "hidden",
        zIndex: 1,
        userSelect: "none",
        WebkitUserSelect: "none",
      }}
      onLoad={handleImageLoad}
    />
  )
})

export default function ImageCropper({ imageFile, onCroppedImage }: ImageCropperProps) {
  const [zoom, setZoom] = useState(1)
  const [rotation, setRotation] = useState(0)
  const [cropMode, setCropMode] = useState<"aspect" | "resolution">("aspect")
  const [aspectRatio, setAspectRatio] = useState<number | null>(1)
  const [customAspect, setCustomAspect] = useState<{ width: string; height: string }>({ width: "1", height: "1" })
  const [targetResolution, setTargetResolution] = useState<{
    width: string
    height: string
  }>({
    width: "1080",
    height: "1080",
  })
  const [extendCanvas, setExtendCanvas] = useState<boolean>(false)
  const [backgroundColor, setBackgroundColor] = useState<string>("#ffffff")

  const {
    imageLoaded,
    cropArea,
    imageSize,
    imagePosition,
    isDragging,
    dragCornerRef,
    containerRef,
    imageRef,
    handleImageLoad,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    resetCrop,
    getCroppedImg,
  } = useImageCrop({
    imageFile,
    aspectRatio,
    zoom,
    rotation,
    extendCanvas,
    cropMode,
    targetResolution,
    backgroundColor,
  })

  // Handle aspect ratio change
  const handleAspectRatioChange = useCallback(
    (value: string) => {
      if (value === "custom") {
        const ratio = Number.parseFloat(customAspect.width) / Number.parseFloat(customAspect.height)
        setAspectRatio(ratio || 1)
      } else if (value === "free") {
        setAspectRatio(null)
      } else {
        setAspectRatio(Number.parseFloat(value))
      }
    },
    [customAspect],
  )

  // Handle crop button click
  const handleCrop = useCallback(async () => {
    try {
      const croppedImage = await getCroppedImg()
      onCroppedImage(croppedImage)
    } catch (e) {
      console.error("Error cropping image:", e)
    }
  }, [getCroppedImg, onCroppedImage])

  // Handle reset with zoom and rotation
  const handleReset = useCallback(() => {
    resetCrop()
    setZoom(1)
    setRotation(0)
  }, [resetCrop])

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Crop Your Image</h2>
      </div>

      <div
        ref={containerRef}
        className="relative h-[400px] md:h-[500px] rounded-lg overflow-hidden select-none"
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        style={{
          backgroundColor: extendCanvas ? backgroundColor : "var(--muted)",
          cursor: isDragging ? (dragCornerRef.current === "move" ? "move" : "crosshair") : "default",
          userSelect: "none",
          WebkitUserSelect: "none",
        }}
        onDragStart={(e) => e.preventDefault()}
      >
        {/* Background pattern for transparency - only show when not extending canvas */}
        {!extendCanvas && (
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              backgroundImage:
                "linear-gradient(45deg, #ccc 25%, transparent 25%), linear-gradient(-45deg, #ccc 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #ccc 75%), linear-gradient(-45deg, transparent 75%, #ccc 75%)",
              backgroundSize: "20px 20px",
              backgroundPosition: "0 0, 0 10px, 10px -10px, -10px 0px",
              opacity: 0.3,
            }}
          />
        )}

        {/* Image */}
        <img
          ref={imageRef}
          src={imageFile.url || "/placeholder.svg"}
          alt="Upload"
          className="absolute select-none pointer-events-none"
          style={{
            left: imagePosition.x,
            top: imagePosition.y,
            width: imageSize.width,
            height: imageSize.height,
            transform: `rotate(${rotation}deg)`,
            transformOrigin: "center center",
            objectFit: "contain",
            willChange: "transform",
            visibility: imageLoaded ? "visible" : "hidden",
            userSelect: "none",
            WebkitUserSelect: "none",
          }}
          onLoad={handleImageLoad}
          draggable="false"
        />

        {/* Loading indicator */}
        {!imageLoaded && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
          </div>
        )}

        {/* Crop area */}
        <CropAreaOverlay cropArea={cropArea} imageLoaded={imageLoaded} handleMouseDown={handleMouseDown} />
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <CropControls
          zoom={zoom}
          setZoom={setZoom}
          rotation={rotation}
          setRotation={setRotation}
          resetCrop={handleReset}
        />

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
              <AspectRatioControls
                customAspect={customAspect}
                setCustomAspect={setCustomAspect}
                onAspectRatioChange={handleAspectRatioChange}
              />
            </TabsContent>

            <TabsContent value="resolution" className="space-y-4">
              <ResolutionControls targetResolution={targetResolution} setTargetResolution={setTargetResolution} />
            </TabsContent>
          </Tabs>

          <CanvasExtensionControls
            extendCanvas={extendCanvas}
            setExtendCanvas={setExtendCanvas}
            backgroundColor={backgroundColor}
            setBackgroundColor={setBackgroundColor}
          />
        </div>
      </div>

      <Button onClick={handleCrop} className="w-full flex items-center gap-2 py-6">
        <Crop className="w-5 h-5" />
        Crop Image
      </Button>
    </div>
  )
}
