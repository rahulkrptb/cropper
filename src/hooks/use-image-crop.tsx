"use client"

import type React from "react"
import { useState, useCallback, useRef, useEffect } from "react"
import type { ImageFile } from "@/types"

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

interface ImageSize {
  width: number
  height: number
}

interface ImagePosition {
  x: number
  y: number
}

interface UseImageCropProps {
  imageFile: ImageFile
  aspectRatio: number | null
  zoom: number
  rotation: number
  extendCanvas: boolean
  cropMode: "aspect" | "resolution"
  targetResolution: {
    width: string
    height: string
  }
  backgroundColor: string
}

export function useImageCrop({
  imageFile,
  aspectRatio,
  zoom,
  rotation,
  extendCanvas,
  cropMode,
  targetResolution,
  backgroundColor,
}: UseImageCropProps) {
  const [imageLoaded, setImageLoaded] = useState(false)
  const [cropArea, setCropArea] = useState<CropArea>({ x: 0, y: 0, width: 0, height: 0 })
  const [imageSize, setImageSize] = useState<ImageSize>({ width: 0, height: 0 })
  const [containerSize, setContainerSize] = useState<ImageSize>({ width: 0, height: 0 })
  const [imagePosition, setImagePosition] = useState<ImagePosition>({ x: 0, y: 0 })


  const [isDragging, setIsDragging] = useState(false)
  const dragStartPointRef = useRef<Point | null>(null)
  const dragCornerRef = useRef<string | null>(null)
  const dragStartCropRef = useRef<CropArea | null>(null)
  const rafRef = useRef<number | null>(null)
  const lastUpdateTimeRef = useRef<number>(0)
  const containerRef = useRef<HTMLDivElement>(null)
  const imageRef = useRef<HTMLImageElement>(null)

  const initializeContainer = useCallback(() => {
    if (containerRef.current) {
      const containerWidth = containerRef.current.clientWidth
      const containerHeight = containerRef.current.clientHeight
      setContainerSize({ width: containerWidth, height: containerHeight })
    }
  }, [])

  useEffect(() => {
    initializeContainer()
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
  }, [initializeContainer])

  const handleImageLoad = useCallback(() => {
    if (!imageRef.current || !containerRef.current) return

    const img = imageRef.current
    const containerWidth = containerRef.current.clientWidth
    const containerHeight = containerRef.current.clientHeight
    const scale = Math.min(containerWidth / img.naturalWidth, containerHeight / img.naturalHeight) * zoom

    const scaledWidth = img.naturalWidth * scale
    const scaledHeight = img.naturalHeight * scale
    const x = (containerWidth - scaledWidth) / 2
    const y = (containerHeight - scaledHeight) / 2

    setImageSize({ width: scaledWidth, height: scaledHeight })
    setImagePosition({ x, y })
    setCropArea({
      x,
      y,
      width: scaledWidth,
      height: scaledHeight,
    })

    setImageLoaded(true)
  }, [zoom])

  const updateImageOnZoom = useCallback(() => {
    if (imageLoaded && imageRef.current && containerRef.current) {
      const img = imageRef.current
      const containerWidth = containerRef.current.clientWidth
      const containerHeight = containerRef.current.clientHeight

      const scale = Math.min(containerWidth / img.naturalWidth, containerHeight / img.naturalHeight) * zoom

      const scaledWidth = img.naturalWidth * scale
      const scaledHeight = img.naturalHeight * scale

      const x = (containerWidth - scaledWidth) / 2
      const y = (containerHeight - scaledHeight) / 2

      const widthRatio = scaledWidth / imageSize.width || 1
      const heightRatio = scaledHeight / imageSize.height || 1

      setImageSize({ width: scaledWidth, height: scaledHeight })
      setImagePosition({ x, y })

      if (widthRatio !== 1 || heightRatio !== 1) {
        setCropArea((prev) => ({
          x: x + (prev.x - imagePosition.x) * widthRatio,
          y: y + (prev.y - imagePosition.y) * heightRatio,
          width: prev.width * widthRatio,
          height: prev.height * heightRatio,
        }))
      }
    }
  }, [zoom, imageLoaded, imageSize.width, imageSize.height, imagePosition.x, imagePosition.y])

  useEffect(() => {
    updateImageOnZoom()
  }, [updateImageOnZoom])

  const updateCropAreaOnAspectRatioChange = useCallback(() => {
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

  // Use effect for aspect ratio changes
  useEffect(() => {
    updateCropAreaOnAspectRatioChange()
  }, [updateCropAreaOnAspectRatioChange])

  // Handle window resize with debounce - optimized
  useEffect(() => {
    const handleResize = () => {
      if (containerRef.current && imageRef.current && imageLoaded) {
        initializeContainer()
        updateImageOnZoom()
      }
    }

    // Debounce the resize handler
    const debouncedHandleResize = debounce(handleResize, 100)
    window.addEventListener("resize", debouncedHandleResize)

    return () => {
      window.removeEventListener("resize", debouncedHandleResize)
    }
  }, [imageLoaded, initializeContainer, updateImageOnZoom])

  // Debounce utility function
  function debounce(fn: Function, ms = 300) {
    let timeoutId: ReturnType<typeof setTimeout>
    return function (this: any, ...args: any[]) {
      clearTimeout(timeoutId)
      timeoutId = setTimeout(() => fn.apply(this, args), ms)
    }
  }

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

  // Optimized update crop area function
  const updateCropArea = useCallback(
    (e: React.MouseEvent) => {
      if (!isDragging || !dragStartPointRef.current || !dragStartCropRef.current || !containerRef.current) return

      // Throttle updates for better performance
      const now = performance.now()
      if (now - lastUpdateTimeRef.current < 16) {
        // ~60fps
        return
      }
      lastUpdateTimeRef.current = now

      const rect = containerRef.current.getBoundingClientRect()
      const x = e.clientX - rect.left
      const y = e.clientY - rect.top

      const deltaX = x - dragStartPointRef.current.x
      const deltaY = y - dragStartPointRef.current.y

      let newCrop = { ...cropArea }

      if (dragCornerRef.current === "move") {
        // Move the entire crop area - direct assignment for better performance
        newCrop.x = dragStartCropRef.current.x + deltaX
        newCrop.y = dragStartCropRef.current.y + deltaY

        // Constrain to container boundaries if not extending canvas
        if (!extendCanvas) {
          newCrop.x = Math.max(newCrop.x, imagePosition.x)
          newCrop.y = Math.max(newCrop.y, imagePosition.y)
          newCrop.x = Math.min(newCrop.x, imagePosition.x + imageSize.width - newCrop.width)
          newCrop.y = Math.min(newCrop.y, imagePosition.y + imageSize.height - newCrop.height)
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

  // Optimized mouse move handler with throttling
  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!isDragging) return

      // Cancel any existing animation frame for smoother updates
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
    }
  }, [imagePosition.x, imagePosition.y, imageSize.height, imageSize.width, imageLoaded])

  // Create a cropped image from the canvas - memoized for performance
  const createImage = useCallback((url: string): Promise<HTMLImageElement> => {
    return new Promise((resolve, reject) => {
      const image = new Image()
      image.addEventListener("load", () => resolve(image))
      image.addEventListener("error", (error) => reject(error))
      image.crossOrigin = "anonymous"
      image.src = url
    })
  }, [])

  // Get the cropped image - fixed target resolution implementation
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
    const sourceX = Math.max(0, (cropArea.x - imagePosition.x) * scaleX)
    const sourceY = Math.max(0, (cropArea.y - imagePosition.y) * scaleY)
    const sourceWidth = cropArea.width * scaleX
    const sourceHeight = cropArea.height * scaleY

    // Set canvas size based on crop or target resolution
    let targetWidth = cropArea.width * scaleX
    let targetHeight = cropArea.height * scaleY

    // Fixed target resolution implementation
    if (cropMode === "resolution") {
      targetWidth = Number.parseInt(targetResolution.width, 10) || 1080
      targetHeight = Number.parseInt(targetResolution.height, 10) || 1080
    }

    // Ensure we have valid dimensions
    targetWidth = Math.max(1, targetWidth)
    targetHeight = Math.max(1, targetHeight)

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


    ctx.restore()

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

  return {
    imageLoaded,
    cropArea,
    imageSize,
    imagePosition,
    containerSize,
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
  }
}

export type { CropArea, Point, ImageSize, ImagePosition }
