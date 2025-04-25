"use client"

import type React from "react"
import { memo } from "react"
import type { CropArea } from "@/hooks/use-image-crop"

interface CropAreaProps {
  cropArea: CropArea
  imageLoaded: boolean
  handleMouseDown: (e: React.MouseEvent, corner?: string) => void
}

// Using memo to prevent unnecessary re-renders
export const CropAreaOverlay = memo(function CropAreaOverlay({
  cropArea,
  imageLoaded,
  handleMouseDown,
}: CropAreaProps) {
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
      <div className="absolute inset-0 bg-black/20 bg-opacity-80 pointer-events-none select-none">
        {/* Clear the crop area */}
        <div
          className="absolute border-2 border-white pointer-events-auto select-none"
          style={{
            left: cropArea.x,
            top: cropArea.y,
            width: cropArea.width,
            height: cropArea.height,
            backgroundColor: "transparent",
            cursor: "move",
            willChange: "transform, left, top, width, height",
            userSelect: "none",
            WebkitUserSelect: "none",
          }}
          onMouseDown={(e) => handleMouseDown(e)}
          onDragStart={(e) => e.preventDefault()}
        />
      </div>

      {/* Draggable corners */}
      <div
        className="absolute bg-white border border-gray-400 rounded-full cursor-nwse-resize select-none"
        style={{
          left: topLeft.x - cornerSize / 2,
          top: topLeft.y - cornerSize / 2,
          width: cornerSize,
          height: cornerSize,
          willChange: "transform, left, top",
          zIndex: 10,
          userSelect: "none",
          WebkitUserSelect: "none",
        }}
        onMouseDown={(e) => handleMouseDown(e, "topLeft")}
        onDragStart={(e) => e.preventDefault()}
      />
      <div
        className="absolute bg-white border border-gray-400 rounded-full cursor-nesw-resize select-none"
        style={{
          left: topRight.x - cornerSize / 2,
          top: topRight.y - cornerSize / 2,
          width: cornerSize,
          height: cornerSize,
          willChange: "transform, left, top",
          zIndex: 10,
          userSelect: "none",
          WebkitUserSelect: "none",
        }}
        onMouseDown={(e) => handleMouseDown(e, "topRight")}
        onDragStart={(e) => e.preventDefault()}
      />
      <div
        className="absolute bg-white border border-gray-400 rounded-full cursor-nesw-resize select-none"
        style={{
          left: bottomLeft.x - cornerSize / 2,
          top: bottomLeft.y - cornerSize / 2,
          width: cornerSize,
          height: cornerSize,
          willChange: "transform, left, top",
          zIndex: 10,
          userSelect: "none",
          WebkitUserSelect: "none",
        }}
        onMouseDown={(e) => handleMouseDown(e, "bottomLeft")}
        onDragStart={(e) => e.preventDefault()}
      />
      <div
        className="absolute bg-white border border-gray-400 rounded-full cursor-nwse-resize select-none"
        style={{
          left: bottomRight.x - cornerSize / 2,
          top: bottomRight.y - cornerSize / 2,
          width: cornerSize,
          height: cornerSize,
          willChange: "transform, left, top",
          zIndex: 10,
          userSelect: "none",
          WebkitUserSelect: "none",
        }}
        onMouseDown={(e) => handleMouseDown(e, "bottomRight")}
        onDragStart={(e) => e.preventDefault()}
      />

      {/* Grid lines for rule of thirds */}
      <div
        className="absolute border-l border-white border-opacity-50 pointer-events-none select-none"
        style={{
          left: cropArea.x + cropArea.width / 3,
          top: cropArea.y,
          height: cropArea.height,
        }}
      />
      <div
        className="absolute border-l border-white border-opacity-50 pointer-events-none select-none"
        style={{
          left: cropArea.x + (cropArea.width / 3) * 2,
          top: cropArea.y,
          height: cropArea.height,
        }}
      />
      <div
        className="absolute border-t border-white border-opacity-50 pointer-events-none select-none"
        style={{
          left: cropArea.x,
          top: cropArea.y + cropArea.height / 3,
          width: cropArea.width,
        }}
      />
      <div
        className="absolute border-t border-white border-opacity-50 pointer-events-none select-none"
        style={{
          left: cropArea.x,
          top: cropArea.y + (cropArea.height / 3) * 2,
          width: cropArea.width,
        }}
      />
    </>
  )
})
