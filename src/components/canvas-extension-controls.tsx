"use client"

import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

interface CanvasExtensionControlsProps {
  extendCanvas: boolean
  setExtendCanvas: (extend: boolean) => void
  backgroundColor: string
  setBackgroundColor: (color: string) => void
}

export function CanvasExtensionControls({
  extendCanvas,
  setExtendCanvas,
  backgroundColor,
  setBackgroundColor,
}: CanvasExtensionControlsProps) {
  return (
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
                onBlur={(e) => {
                  // Validate hex color on blur
                  const isValidHex = /^#([0-9A-F]{3}){1,2}$/i.test(e.target.value)
                  if (!isValidHex) {
                    setBackgroundColor("#ffffff")
                  }
                }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
