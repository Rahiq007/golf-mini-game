"use client"

import type React from "react"

import { useState, useCallback, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Slider } from "@/components/ui/slider"
import TrajectoryPreview from "./TrajectoryPreview"
import { PhysicsUtils } from "@/lib/physics/utils"
import { PhysicsConfig } from "@/lib/physics/types"

interface GameControlsProps {
  onShoot: (angle: number, anglePhi: number, power: number) => void
  onTrajectoryChange?: (points: Array<{x: number; y: number, z: number}>) => void
  disabled?: boolean
  className?: string
  courseConfig?: {config: PhysicsConfig, seed: number}
}

export default function GameControls({ onShoot, onTrajectoryChange, disabled = false, className = "", courseConfig }: GameControlsProps) {
  const [angle, setAngle] = useState(30) // Degrees - lower default angle
  const [anglePhi, setAnglePhi] = useState(0)  // Degrees - angling left/right.
  const [power, setPower] = useState(0.5) // 0-1 - reduced default power
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const controlAreaRef = useRef<HTMLDivElement>(null)

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (disabled) return
      setIsDragging(true)
      setDragStart({ x: e.clientX, y: e.clientY })
    },
    [disabled],
  )

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!isDragging || disabled) return

      const deltaX = e.clientX - dragStart.x
      const deltaY = e.clientY - dragStart.y

      // Calculate angle from drag direction
      const dragAngle = Math.atan2(-deltaY, deltaX) // Negative Y for screen coordinates
      const angleDegrees = Math.max(-45, Math.min(45, (dragAngle * 180) / Math.PI))

      // Calculate power from drag distance
      const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY)
      const newPower = Math.max(0.1, Math.min(1, distance / 150))

      setAngle(angleDegrees)
      setPower(newPower)
    },
    [isDragging, dragStart, disabled],
  )

  const handleMouseUp = useCallback(() => {
    setIsDragging(false)
  }, [])

  useEffect(() => {
    if(!onTrajectoryChange || power === 0 || !courseConfig) return
    const angleRadians = (angle * Math.PI) / 180
    const anglePhiRadians = (anglePhi * Math.PI) / 180
    const points = PhysicsUtils.calculate3DTrajectoryPreview(angleRadians, anglePhiRadians, power, courseConfig.config, courseConfig.seed)
    onTrajectoryChange(points)
  }, [angle, anglePhi, power])

  useEffect(() => {
    if (isDragging) {
      document.addEventListener("mousemove", handleMouseMove)
      document.addEventListener("mouseup", handleMouseUp)
      return () => {
        document.removeEventListener("mousemove", handleMouseMove)
        document.removeEventListener("mouseup", handleMouseUp)
      }
    }
  }, [isDragging, handleMouseMove, handleMouseUp])

  // Touch handlers for mobile
  const handleTouchStart = useCallback(
    (e: React.TouchEvent) => {
      if (disabled) return
      const touch = e.touches[0]
      setIsDragging(true)
      setDragStart({ x: touch.clientX, y: touch.clientY })
    },
    [disabled],
  )

  const handleTouchMove = useCallback(
    (e: React.TouchEvent) => {
      if (!isDragging || disabled) return
      e.preventDefault()

      const touch = e.touches[0]
      const deltaX = touch.clientX - dragStart.x
      const deltaY = touch.clientY - dragStart.y

      const dragAngle = Math.atan2(-deltaY, deltaX)
      const angleDegrees = Math.max(-45, Math.min(45, (dragAngle * 180) / Math.PI))

      const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY)
      const newPower = Math.max(0.1, Math.min(1, distance / 100)) // Shorter distance for mobile

      setAngle(angleDegrees)
      setPower(newPower)
    },
    [isDragging, dragStart, disabled],
  )

  const handleTouchEnd = useCallback(() => {
    setIsDragging(false)
  }, [])

  const handleShoot = useCallback(() => {
    if (disabled) return
    const angleRadians = (angle * Math.PI) / 180
    const anglePhiRadians = (anglePhi * Math.PI) / 180
    onShoot(angleRadians, anglePhiRadians, power)
  }, [angle, anglePhi, power, onShoot, disabled])

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (disabled) return
      
      switch (e.key) {
        case "ArrowLeft":
          e.preventDefault()
          setAngle((prev) => Math.max(-45, prev - 2))
          break
        case "ArrowRight":
          e.preventDefault()
          setAngle((prev) => Math.min(45, prev + 2))
          break
        case "ArrowUp":
          e.preventDefault()
          setPower((prev) => Math.min(1, prev + 0.05))
          break
        case "ArrowDown":
          e.preventDefault()
          setPower((prev) => Math.max(0.1, prev - 0.05))
          break
        case " ":
        case "Enter":
          e.preventDefault()
          handleShoot()
          break
      }
    },
    [angle, power, handleShoot, disabled],
  )

  return (
    <Card className={`p-6 ${className}`}>
      <div className="space-y-6">
        {/* Drag Control Area */}
        <div className="space-y-2">
          <h3 className="text-lg font-semibold">Aim & Power</h3>
          <div
            ref={controlAreaRef}
            className={`relative h-32 bg-gradient-to-b from-sky-100 to-green-100 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center cursor-crosshair ${
              disabled ? "opacity-50 cursor-not-allowed" : ""
            } ${isDragging ? "bg-gradient-to-b from-sky-200 to-green-200" : ""}`}
            onMouseDown={handleMouseDown}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            onKeyDown={handleKeyDown}
            tabIndex={0}
          >
            <div className="text-center text-gray-600">
              <div className="text-sm font-medium">{isDragging ? "Release to set aim" : "Drag to aim"}</div>
              <div className="text-xs mt-1">Desktop: Click & drag • Mobile: Touch & drag</div>
            </div>

            {/* Visual feedback during drag */}
            {isDragging && (
              <div className="absolute inset-0 pointer-events-none">
                <div className="absolute top-1/2 left-1/2 w-2 h-2 bg-red-500 rounded-full transform -translate-x-1/2 -translate-y-1/2"></div>
                <div
                  className="absolute top-1/2 left-1/2 w-0.5 bg-red-500 origin-left transform -translate-y-1/2"
                  style={{
                    height: "2px",
                    width: `${power * 60}px`,
                    transform: `translate(-50%, -50%) rotate(${angle}deg)`,
                  }}
                ></div>
              </div>
            )}
          </div>
        </div>

        {/* Manual Controls */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Angle Upwards: {angle}°</label>
            <Slider
              value={[angle]}
              onValueChange={([value]) => setAngle(value)}
              min={0}
              max={90}
              step={1}
              disabled={disabled}
              className="w-full"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Angle: {Math.abs(anglePhi)}° to the {anglePhi < 0 ? "left" : "right"}</label>
            <Slider
              value={[anglePhi]}
              onValueChange={([value]) => setAnglePhi(value)}
              min={-90}
              max={90}
              step={1}
              disabled={disabled}
              className="w-full"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Power: {Math.round(power * 100)}%</label>
            <Slider
              value={[power * 100]}
              onValueChange={([value]) => setPower(value / 100)}
              min={10}
              max={100}
              step={5}
              disabled={disabled}
              className="w-full"
            />
          </div>
        </div>

        {/* Trajectory Preview */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium">Trajectory Preview</h4>
          <TrajectoryPreview angle={(angle * Math.PI) / 180} power={power} className="h-24" />
        </div>

        {/* Shoot Button */}
        <Button
          onClick={handleShoot}
          disabled={disabled}
          size="lg"
          className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3"
        >
          {disabled ? "Shooting..." : "🏌️ Take Shot"}
        </Button>

        {/* Keyboard Shortcuts */}
        <div className="text-xs text-gray-500 text-center">
          <div>Keyboard: ← → (angle) • ↑ ↓ (power) • Space/Enter (shoot)</div>
        </div>
      </div>
    </Card>
  )
}
