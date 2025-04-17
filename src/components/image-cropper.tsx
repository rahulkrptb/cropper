"use client"

import type React from "react"

import { useState, useCallback, useRef, useEffect, useMemo } from "react"
import { Slider } from "@/components/ui/slider"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import type { ImageFile } from "@/types"
import { ZoomIn, ZoomOut, RotateCcw, Crop, RefreshCcw } from "lucide-react"
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

interface Point {
  x: number
  y: number
}

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
  const [imageLoaded, setImageLoaded] = useState(false)

  // Refs for the container and image
  const containerRef = useRef<HTMLDivElement>(null)
  const imageRef = useRef<HTMLImageElement>(null)
  const rafRef = useRef<number | null>(null)

  // State for the crop area
  const [cropArea, setCropArea] = useState<CropArea>({ x: 0, y: 0, width: 0, height: 0 })
  const [imageSize, setImageSize] = useState<{ width: number; height: number }>({ width: 0, height: 0 })
  const [containerSize, setContainerSize] = useState<{ width: number; height: number }>({ width: 0, height: 0 })
  const [imagePosition, setImagePosition] = useState<{ x: number; y: number }>({ x: 0, y: 0 })

  // State for dragging
  const [isDragging, setIsDragging] = useState(false)
  const dragStartPointRef = useRef<Point | null>(null)
  const dragCornerRef = useRef<string | null>(null)
  const dragStartCropRef = useRef<CropArea | null>(null)

  // Initialize the crop area when the component mounts
  useEffect(() => {
    const initializeContainer = () => {
      if (containerRef.current) {
        const containerWidth = containerRef.current.clientWidth
        const containerHeight = containerRef.current.clientHeight
        setContainerSize({ width: containerWidth, height: containerHeight })
      }
    }

    initializeContainer()

    // Also set up a resize observer to handle container size changes
    if (containerRef.current) {
      const resizeObserver = new ResizeObserver(() => {
        initializeContainer()
      })

      resizeObserver.observe(containerRef.current)

      return () => {
        if (containerRef.current) {
          resizeObserver.unobserve(containerRef.current)
        }
      }
    }
  }, [])

  // Handle image load
  const handleImageLoad = useCallback(() => {
    if (!imageRef.current || !containerRef.current) return

    const img = imageRef.current
    const containerWidth = containerRef.current.clientWidth
    const containerHeight = containerRef.current.clientHeight

    // Calculate the scaled image dimensions to fit in the container
    const scale = Math.min(containerWidth / img.naturalWidth, containerHeight / img.naturalHeight) * zoom

    const scaledWidth = img.naturalWidth * scale
    const scaledHeight = img.naturalHeight * scale

    // Center the image in the container
    const x = (containerWidth - scaledWidth) / 2
    const y = (containerHeight - scaledHeight) / 2

    setImageSize({ width: scaledWidth, height: scaledHeight })
    setImagePosition({ x, y })

    // Initialize the crop area to cover the entire image
    setCropArea({
      x,
      y,
      width: scaledWidth,
      height: scaledHeight,
    })

    setImageLoaded(true)
  }, [zoom])

  // Update image position and size when zoom changes
  useEffect(() => {
    if (imageLoaded && imageRef.current && containerRef.current) {
      const img = imageRef.current
      const containerWidth = containerRef.current.clientWidth
      const containerHeight = containerRef.current.clientHeight

      // Calculate the scaled image dimensions
      const scale = Math.min(containerWidth / img.naturalWidth, containerHeight / img.naturalHeight) * zoom

      const scaledWidth = img.naturalWidth * scale
      const scaledHeight = img.naturalHeight * scale

      // Center the image
      const x = (containerWidth - scaledWidth) / 2
      const y = (containerHeight - scaledHeight) / 2

      setImageSize({ width: scaledWidth, height: scaledHeight })
      setImagePosition({ x, y })

      // Adjust crop area proportionally
      const widthRatio = scaledWidth / imageSize.width
      const heightRatio = scaledHeight / imageSize.height

      if (widthRatio !== 1 || heightRatio !== 1) {
        setCropArea((prev) => ({
          x: x + (prev.x - imagePosition.x) * widthRatio,
          y: y + (prev.y - imagePosition.y) * heightRatio,
          width: prev.width * widthRatio,
          height: prev.height * heightRatio,
        }))
      }
    }
  }, [zoom, imageLoaded])

  // Update crop area when aspect ratio changes
  useEffect(() => {
    if (aspectRatio !== null && cropArea.width > 0 && cropArea.height > 0) {
      const currentWidth = cropArea.width
      const currentHeight = cropArea.height
      const currentAspect = currentWidth / currentHeight

      if (Math.abs(currentAspect - aspectRatio) > 0.01) {
        // Adjust the crop area to match the aspect ratio
        let newWidth = currentWidth
        let newHeight = currentHeight

        if (currentAspect > aspectRatio) {
          // Too wide, reduce width
          newWidth = currentHeight * aspectRatio
        } else {
          // Too tall, reduce height
          newHeight = currentWidth / aspectRatio
        }

        // Center the new crop area
        const newX = cropArea.x + (currentWidth - newWidth) / 2
        const newY = cropArea.y + (currentHeight - newHeight) / 2

        setCropArea({
          x: newX,
          y: newY,
          width: newWidth,
          height: newHeight,
        })
      }
    }
  }, [aspectRatio, cropArea])

  // Handle window resize with debounce
  useEffect(() => {
    let timeoutId: NodeJS.Timeout | null = null

    const handleResize = () => {
      if (timeoutId) {
        clearTimeout(timeoutId)
      }

      timeoutId = setTimeout(() => {
        if (containerRef.current && imageRef.current && imageLoaded) {
          const containerWidth = containerRef.current.clientWidth
          const containerHeight = containerRef.current.clientHeight

          setContainerSize({ width: containerWidth, height: containerHeight })

          // Recalculate image position and size
          const img = imageRef.current
          const scale = Math.min(containerWidth / img.naturalWidth, containerHeight / img.naturalHeight) * zoom

          const scaledWidth = img.naturalWidth * scale
          const scaledHeight = img.naturalHeight * scale

          const x = (containerWidth - scaledWidth) / 2
          const y = (containerHeight - scaledHeight) / 2

          setImageSize({ width: scaledWidth, height: scaledHeight })
          setImagePosition({ x, y })

          // Adjust crop area proportionally
          const widthRatio = scaledWidth / imageSize.width
          const heightRatio = scaledHeight / imageSize.height

          setCropArea({
            x: x + (cropArea.x - imagePosition.x) * widthRatio,
            y: y + (cropArea.y - imagePosition.y) * heightRatio,
            width: cropArea.width * widthRatio,
            height: cropArea.height * heightRatio,
          })
        }
      }, 100) // 100ms debounce
    }

    window.addEventListener("resize", handleResize)
    return () => {
      window.removeEventListener("resize", handleResize)
      if (timeoutId) {
        clearTimeout(timeoutId)
      }
    }
  }, [cropArea, imagePosition, imageSize, zoom, imageLoaded])

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

  // Handle custom aspect ratio change
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

  // Mouse event handlers for crop area manipulation
  const handleMouseDown = useCallback(
    (e: React.MouseEvent, corner?: string) => {
      if (!containerRef.current) return

      const rect = containerRef.current.getBoundingClientRect()
      const x = e.clientX - rect.left
      const y = e.clientY - rect.top

      setIsDragging(true)
      dragStartPointRef.current = { x, y }
      dragStartCropRef.current = { ...cropArea }

      if (corner) {
        dragCornerRef.current = corner
      } else if (
        x >= cropArea.x &&
        x <= cropArea.x + cropArea.width &&
        y >= cropArea.y &&
        y <= cropArea.y + cropArea.height
      ) {
        // Dragging the entire crop area
        dragCornerRef.current = "move"
      }
    },
    [cropArea],
  )

  const updateCropArea = useCallback(
    (e: React.MouseEvent) => {
      if (!isDragging || !dragStartPointRef.current || !dragStartCropRef.current || !containerRef.current) return

      const rect = containerRef.current.getBoundingClientRect()
      const x = e.clientX - rect.left
      const y = e.clientY - rect.top

      const deltaX = x - dragStartPointRef.current.x
      const deltaY = y - dragStartPointRef.current.y

      let newCrop = { ...cropArea }

      if (dragCornerRef.current === "move") {
        // Move the entire crop area
        newCrop.x = dragStartCropRef.current.x + deltaX
        newCrop.y = dragStartCropRef.current.y + deltaY

        // Constrain to container boundaries if not extending canvas
        if (!extendCanvas) {
          if (newCrop.x < imagePosition.x) newCrop.x = imagePosition.x
          if (newCrop.y < imagePosition.y) newCrop.y = imagePosition.y
          if (newCrop.x + newCrop.width > imagePosition.x + imageSize.width) {
            newCrop.x = imagePosition.x + imageSize.width - newCrop.width
          }
          if (newCrop.y + newCrop.height > imagePosition.y + imageSize.height) {
            newCrop.y = imagePosition.y + imageSize.height - newCrop.height
          }
        }
      } else {
        // Resize by dragging corners
        let newWidth = dragStartCropRef.current.width
        let newHeight = dragStartCropRef.current.height
        let newX = dragStartCropRef.current.x
        let newY = dragStartCropRef.current.y

        switch (dragCornerRef.current) {
          case "topLeft":
            newX = dragStartCropRef.current.x + deltaX
            newY = dragStartCropRef.current.y + deltaY
            newWidth = dragStartCropRef.current.width - deltaX
            newHeight = dragStartCropRef.current.height - deltaY
            break
          case "topRight":
            newY = dragStartCropRef.current.y + deltaY
            newWidth = dragStartCropRef.current.width + deltaX
            newHeight = dragStartCropRef.current.height - deltaY
            break
          case "bottomLeft":
            newX = dragStartCropRef.current.x + deltaX
            newWidth = dragStartCropRef.current.width - deltaX
            newHeight = dragStartCropRef.current.height + deltaY
            break
          case "bottomRight":
            newWidth = dragStartCropRef.current.width + deltaX
            newHeight = dragStartCropRef.current.height + deltaY
            break
        }

        // Maintain aspect ratio if needed
        if (aspectRatio !== null) {
          if (dragCornerRef.current === "topLeft" || dragCornerRef.current === "bottomRight") {
            newHeight = newWidth / aspectRatio
          } else {
            newWidth = newHeight * aspectRatio
          }

          // Adjust position for top-left corner
          if (dragCornerRef.current === "topLeft") {
            newX = dragStartCropRef.current.x + dragStartCropRef.current.width - newWidth
            newY = dragStartCropRef.current.y + dragStartCropRef.current.height - newHeight
          } else if (dragCornerRef.current === "topRight") {
            newY = dragStartCropRef.current.y + dragStartCropRef.current.height - newHeight
          } else if (dragCornerRef.current === "bottomLeft") {
            newX = dragStartCropRef.current.x + dragStartCropRef.current.width - newWidth
          }
        }

        // Ensure minimum size
        const minSize = 20
        if (newWidth < minSize) {
          newWidth = minSize
          if (dragCornerRef.current === "topLeft" || dragCornerRef.current === "bottomLeft") {
            newX = dragStartCropRef.current.x + dragStartCropRef.current.width - minSize
          }
        }
        if (newHeight < minSize) {
          newHeight = minSize
          if (dragCornerRef.current === "topLeft" || dragCornerRef.current === "topRight") {
            newY = dragStartCropRef.current.y + dragStartCropRef.current.height - minSize
          }
        }

        // Constrain to image boundaries if not extending canvas
        if (!extendCanvas) {
          if (newX < imagePosition.x) {
            newX = imagePosition.x
            newWidth = dragStartCropRef.current.x + dragStartCropRef.current.width - imagePosition.x
          }
          if (newY < imagePosition.y) {
            newY = imagePosition.y
            newHeight = dragStartCropRef.current.y + dragStartCropRef.current.height - imagePosition.y
          }
          if (newX + newWidth > imagePosition.x + imageSize.width) {
            newWidth = imagePosition.x + imageSize.width - newX
          }
          if (newY + newHeight > imagePosition.y + imageSize.height) {
            newHeight = imagePosition.y + imageSize.height - newY
          }

          // Maintain aspect ratio after constraints
          if (aspectRatio !== null) {
            const constrainedAspect = newWidth / newHeight
            if (Math.abs(constrainedAspect - aspectRatio) > 0.01) {
              // Adjust to maintain aspect ratio within constraints
              if (constrainedAspect > aspectRatio) {
                // Too wide, reduce width
                newWidth = newHeight * aspectRatio
              } else {
                // Too tall, reduce height
                newHeight = newWidth / aspectRatio
              }
            }
          }
        }

        newCrop = {
          x: newX,
          y: newY,
          width: newWidth,
          height: newHeight,
        }
      }

      setCropArea(newCrop)
    },
    [aspectRatio, cropArea, extendCanvas, imagePosition, imageSize.height, imageSize.width, isDragging],
  )

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!isDragging) return

      // Cancel any existing animation frame
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current)
      }

      // Use requestAnimationFrame for smoother updates
      rafRef.current = requestAnimationFrame(() => {
        updateCropArea(e)
      })
    },
    [isDragging, updateCropArea],
  )

  const handleMouseUp = useCallback(() => {
    setIsDragging(false)
    dragStartPointRef.current = null
    dragCornerRef.current = null
    dragStartCropRef.current = null

    // Cancel any pending animation frame
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current)
      rafRef.current = null
    }
  }, [])

  // Clean up any animation frames on unmount
  useEffect(() => {
    return () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current)
      }
    }
  }, [])

  // Reset crop to cover the entire image
  const resetCrop = useCallback(() => {
    if (imageLoaded) {
      setCropArea({
        x: imagePosition.x,
        y: imagePosition.y,
        width: imageSize.width,
        height: imageSize.height,
      })
      setZoom(1)
      setRotation(0)
    }
  }, [imagePosition.x, imagePosition.y, imageSize.height, imageSize.width, imageLoaded])

  // Create a cropped image from the canvas
  const createImage = useCallback((url: string): Promise<HTMLImageElement> => {
    return new Promise((resolve, reject) => {
      const image = new Image()
      image.addEventListener("load", () => resolve(image))
      image.addEventListener("error", (error) => reject(error))
      image.crossOrigin = "anonymous"
      image.src = url
    })
  }, [])

  // Get the cropped image
  const getCroppedImg = useCallback(async (): Promise<string> => {
    const image = await createImage(imageFile.url)
    const canvas = document.createElement("canvas")
    const ctx = canvas.getContext("2d")

    if (!ctx) {
      throw new Error("Could not get canvas context")
    }

    // Calculate the crop area in the original image coordinates
    const scaleX = image.naturalWidth / imageSize.width
    const scaleY = image.naturalHeight / imageSize.height

    // Calculate the source coordinates in the original image
    const sourceX = (cropArea.x - imagePosition.x) * scaleX
    const sourceY = (cropArea.y - imagePosition.y) * scaleY
    const sourceWidth = cropArea.width * scaleX
    const sourceHeight = cropArea.height * scaleY

    // Set canvas size based on crop or target resolution
    let targetWidth = cropArea.width * scaleX
    let targetHeight = cropArea.height * scaleY

    if (cropMode === "resolution") {
      targetWidth = Number.parseInt(targetResolution.width, 10) || 1080
      targetHeight = Number.parseInt(targetResolution.height, 10) || 1080
    }

    canvas.width = targetWidth
    canvas.height = targetHeight

    // Fill with background color
    ctx.fillStyle = backgroundColor
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    // Save context
    ctx.save()

    // Move to the center of the canvas for rotation
    ctx.translate(canvas.width / 2, canvas.height / 2)

    // Rotate around the center
    ctx.rotate((rotation * Math.PI) / 180)

    // Calculate scaling factors to fit the target dimensions
    const scale = Math.min(targetWidth / sourceWidth, targetHeight / sourceHeight)

    // Draw the image centered and scaled
    ctx.drawImage(
      image,
      sourceX,
      sourceY,
      sourceWidth,
      sourceHeight,
      (-sourceWidth * scale) / 2,
      (-sourceHeight * scale) / 2,
      sourceWidth * scale,
      sourceHeight * scale,
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
  }, [
    backgroundColor,
    createImage,
    cropArea,
    cropMode,
    imageFile.type,
    imageFile.url,
    imagePosition.x,
    imagePosition.y,
    imageSize.height,
    imageSize.width,
    rotation,
    targetResolution.height,
    targetResolution.width,
  ])

  // Handle crop button click
  const handleCrop = useCallback(async () => {
    try {
      const croppedImage = await getCroppedImg()
      onCroppedImage(croppedImage)
    } catch (e) {
      console.error("Error cropping image:", e)
    }
  }, [getCroppedImg, onCroppedImage])

  // Memoize the crop area rendering to prevent unnecessary re-renders
  const cropAreaElements = useMemo(() => {
    if (!cropArea.width || !cropArea.height || !imageLoaded) return null

    // Calculate corner positions
    const topLeft = { x: cropArea.x, y: cropArea.y }
    const topRight = { x: cropArea.x + cropArea.width, y: cropArea.y }
    const bottomLeft = { x: cropArea.x, y: cropArea.y + cropArea.height }
    const bottomRight = { x: cropArea.x + cropArea.width, y: cropArea.y + cropArea.height }

    // Corner size
    const cornerSize = 10

    return (
      <>
        {/* Overlay outside crop area */}
        <div className="absolute inset-0 bg-black/20  bg-opacity-80">
          {/* Clear the crop area */}
          <div
            className="absolute border-2 border-white"
            style={{
              left: cropArea.x,
              top: cropArea.y,
              width: cropArea.width,
              height: cropArea.height,
              backgroundColor: "transparent",
              cursor: "move",
            }}
            onMouseDown={(e) => handleMouseDown(e)}
          />
        </div>

        {/* Draggable corners */}
        <div
          className="absolute bg-white border border-gray-400 rounded-full cursor-nwse-resize"
          style={{
            left: topLeft.x - cornerSize / 2,
            top: topLeft.y - cornerSize / 2,
            width: cornerSize,
            height: cornerSize,
          }}
          onMouseDown={(e) => handleMouseDown(e, "topLeft")}
        />
        <div
          className="absolute bg-white border border-gray-400 rounded-full cursor-nesw-resize"
          style={{
            left: topRight.x - cornerSize / 2,
            top: topRight.y - cornerSize / 2,
            width: cornerSize,
            height: cornerSize,
          }}
          onMouseDown={(e) => handleMouseDown(e, "topRight")}
        />
        <div
          className="absolute bg-white border border-gray-400 rounded-full cursor-nesw-resize"
          style={{
            left: bottomLeft.x - cornerSize / 2,
            top: bottomLeft.y - cornerSize / 2,
            width: cornerSize,
            height: cornerSize,
          }}
          onMouseDown={(e) => handleMouseDown(e, "bottomLeft")}
        />
        <div
          className="absolute bg-white border border-gray-400 rounded-full cursor-nwse-resize"
          style={{
            left: bottomRight.x - cornerSize / 2,
            top: bottomRight.y - cornerSize / 2,
            width: cornerSize,
            height: cornerSize,
          }}
          onMouseDown={(e) => handleMouseDown(e, "bottomRight")}
        />

        {/* Grid lines for rule of thirds */}
        <div
          className="absolute border-l border-white border-opacity-50"
          style={{
            left: cropArea.x + cropArea.width / 3,
            top: cropArea.y,
            height: cropArea.height,
          }}
        />
        <div
          className="absolute border-l border-white border-opacity-50"
          style={{
            left: cropArea.x + (cropArea.width / 3) * 2,
            top: cropArea.y,
            height: cropArea.height,
          }}
        />
        <div
          className="absolute border-t border-white border-opacity-50"
          style={{
            left: cropArea.x,
            top: cropArea.y + cropArea.height / 3,
            width: cropArea.width,
          }}
        />
        <div
          className="absolute border-t border-white border-opacity-50"
          style={{
            left: cropArea.x,
            top: cropArea.y + (cropArea.height / 3) * 2,
            width: cropArea.width,
          }}
        />
      </>
    )
  }, [cropArea, handleMouseDown, imageLoaded])

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Crop Your Image</h2>
      </div>

      <div
        ref={containerRef}
        className="relative h-[400px] md:h-[500px] bg-muted/30 rounded-lg overflow-hidden"
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        style={{
          backgroundColor: extendCanvas ? backgroundColor : undefined,
          cursor: isDragging ? (dragCornerRef.current === "move" ? "move" : "crosshair") : "default",
        }}
      >
        {/* Background pattern for transparency */}
        <div
          className="absolute inset-0"
          style={{
            backgroundImage:
              "linear-gradient(45deg, #ccc 25%, transparent 25%), linear-gradient(-45deg, #ccc 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #ccc 75%), linear-gradient(-45deg, transparent 75%, #ccc 75%)",
            backgroundSize: "20px 20px",
            backgroundPosition: "0 0, 0 10px, 10px -10px, -10px 0px",
            opacity: 0.3,
          }}
        />

        {/* Image */}
        <img
          ref={imageRef}
          src={imageFile.url || "/placeholder.svg"}
          alt="Upload"
          className="absolute"
          style={{
            left: imagePosition.x,
            top: imagePosition.y,
            width: imageSize.width,
            height: imageSize.height,
            transform: `rotate(${rotation}deg)`,
            transformOrigin: "center center",
            objectFit: "contain",
            willChange: "transform", // Hint to browser to optimize
            visibility: imageLoaded ? "visible" : "hidden",
          }}
          onLoad={handleImageLoad}
        />

        {/* Loading indicator */}
        {!imageLoaded && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
          </div>
        )}

        {/* Crop area */}
        {cropAreaElements}
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <ZoomOut className="w-4 h-4 text-muted-foreground" />
            <Slider
              value={[zoom]}
              min={0.5}
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
                  <SelectItem value="free">Free Form</SelectItem>
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
              <p className="text-xs text-muted-foreground">
                The output image will be exactly {targetResolution.width} × {targetResolution.height} pixels.
              </p>
            </TabsContent>
          </Tabs>

          <div className="space-y-2">
            <div className="space-y-3 border p-3 rounded-md">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="extend-canvas"
                  checked={extendCanvas}
                  onChange={(e) => setExtendCanvas(e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300"
                />
                <Label htmlFor="extend-canvas" className="font-medium">
                  Extend canvas if needed
                </Label>
              </div>

              <div className={extendCanvas ? "opacity-100" : "opacity-50 pointer-events-none"}>
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
              </div>
            </div>
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
