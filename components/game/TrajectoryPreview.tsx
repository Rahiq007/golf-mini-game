"use client"

import { useMemo } from "react"
import { PhysicsUtils } from "@/lib/physics/utils"

interface TrajectoryPreviewProps {
  angle: number
  power: number
  maxVelocity?: number
  className?: string
}

export default function TrajectoryPreview({ angle, power, maxVelocity = 30, className = "" }: TrajectoryPreviewProps) {
  const trajectoryPoints = useMemo(() => {
    if (power === 0) return []
    return PhysicsUtils.calculateTrajectoryPreview(angle, power, maxVelocity, 9.81, 30)
  }, [angle, power, maxVelocity])

  const svgPath = useMemo(() => {
    if (trajectoryPoints.length === 0) return ""

    // Scale points for SVG display (simplified 2D projection)
    const scaledPoints = trajectoryPoints.map((point) => ({
      x: (point.x / 60) * 300, // Scale to fit in 300px width
      y: 150 - (point.y / 10) * 100, // Flip Y and scale to fit in 150px height
    }))

    const pathData = scaledPoints.reduce((path, point, index) => {
      const command = index === 0 ? "M" : "L"
      return `${path} ${command} ${point.x.toFixed(1)} ${point.y.toFixed(1)}`
    }, "")

    return pathData
  }, [trajectoryPoints])

  if (trajectoryPoints.length === 0) return null

  return (
    <div className={`relative ${className}`}>
      <svg
        width="300"
        height="150"
        viewBox="0 0 300 150"
        className="w-full h-full"
        style={{ background: "rgba(255, 255, 255, 0.1)" }}
      >
        {/* Ground line */}
        <line x1="0" y1="150" x2="300" y2="150" stroke="rgba(34, 197, 94, 0.5)" strokeWidth="2" />

        {/* Hole indicator */}
        <circle cx="225" cy="150" r="3" fill="rgba(0, 0, 0, 0.7)" />

        {/* Trajectory path */}
        <path d={svgPath} fill="none" stroke="rgba(0, 0, 0, 0.8)" strokeWidth="2" strokeDasharray="4,4" />

        {/* Start point */}
        <circle cx="0" cy="150" r="2" fill="rgba(255, 255, 255, 0.9)" />

        {/* Trajectory info */}
        <text x="10" y="20" fill="rgba(255, 255, 255, 0.9)" fontSize="12" fontFamily="monospace">
          Angle: {Math.round((angle * 180) / Math.PI)}°
        </text>
        <text x="10" y="35" fill="rgba(255, 255, 255, 0.9)" fontSize="12" fontFamily="monospace">
          Power: {Math.round(power * 100)}%
        </text>
      </svg>
    </div>
  )
}
