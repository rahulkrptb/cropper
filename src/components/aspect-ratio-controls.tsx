"use client"

import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useCallback } from "react"

interface AspectRatioControlsProps {
  customAspect: { width: string; height: string }
  setCustomAspect: (aspect: { width: string; height: string }) => void
  onAspectRatioChange: (value: string) => void
}

export function AspectRatioControls({ customAspect, setCustomAspect, onAspectRatioChange }: AspectRatioControlsProps) {
  const handleCustomAspectChange = useCallback(
    (dimension: "width" | "height", value: string) => {
      const newCustomAspect = { ...customAspect, [dimension]: value }
      setCustomAspect(newCustomAspect)
    },
    [customAspect, setCustomAspect],
  )

  return (
    <div className="space-y-4">
      <Select onValueChange={onAspectRatioChange} defaultValue="1">
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
    </div>
  )
}
