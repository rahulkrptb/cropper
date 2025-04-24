"use client"

import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

interface ResolutionControlsProps {
  targetResolution: { width: string; height: string }
  setTargetResolution: (resolution: { width: string; height: string }) => void
}

export function ResolutionControls({ targetResolution, setTargetResolution }: ResolutionControlsProps) {
  return (
    <div className="space-y-4">
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
    </div>
  )
}
