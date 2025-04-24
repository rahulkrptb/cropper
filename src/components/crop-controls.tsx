"use client"

import { Slider } from "@/components/ui/slider"
import { Button } from "@/components/ui/button"
import { ZoomIn, ZoomOut, RotateCcw, RefreshCcw } from "lucide-react"

interface CropControlsProps {
  zoom: number
  setZoom: (zoom: number) => void
  rotation: number
  setRotation: (rotation: number) => void
  resetCrop: () => void
}

export function CropControls({ zoom, setZoom, rotation, setRotation, resetCrop }: CropControlsProps) {
  return (
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
  )
}
