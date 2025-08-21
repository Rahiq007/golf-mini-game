import type { BallState } from "@/lib/physics/types"
import { PhysicsUtils } from "@/lib/physics/utils"

export interface AnimationFrame {
  position: { x: number; y: number; z: number }
  rotation: { x: number; y: number; z: number }
  time: number
}

export class BallAnimator {
  private trajectory: BallState[] = []
  private interpolatedFrames: AnimationFrame[] = []
  private currentFrame = 0
  private isPlaying = false
  private startTime = 0
  private onComplete?: () => void

  setTrajectory(trajectory: BallState[]) {
    this.trajectory = trajectory
    this.generateAnimationFrames()
  }

  private generateAnimationFrames() {
    if (this.trajectory.length === 0) return

    // Interpolate trajectory for smooth 60fps animation
    const interpolated = PhysicsUtils.interpolateTrajectory(this.trajectory, 60)

    this.interpolatedFrames = interpolated.map((state, index) => {
      // Calculate rotation based on movement
      const rotationSpeed = Math.sqrt(state.velocity.x ** 2 + state.velocity.y ** 2) * 0.1

      return {
        position: {
          x: state.position.x,
          y: Math.max(state.position.y + 0.0215, 0.0215), // Keep ball above ground
          z: state.position.y * 0.1, // Add some Z variation for visual interest
        },
        rotation: {
          x: index * rotationSpeed,
          y: 0,
          z: index * rotationSpeed * 0.5,
        },
        time: state.time,
      }
    })
  }

  play(onComplete?: () => void) {
    if (this.interpolatedFrames.length === 0) return

    this.isPlaying = true
    this.currentFrame = 0
    this.startTime = performance.now()
    this.onComplete = onComplete

    this.animate()
  }

  private animate() {
    if (!this.isPlaying) return

    const currentTime = (performance.now() - this.startTime) / 1000 // Convert to seconds

    // Find the appropriate frame based on time
    while (
      this.currentFrame < this.interpolatedFrames.length - 1 &&
      this.interpolatedFrames[this.currentFrame + 1].time <= currentTime
    ) {
      this.currentFrame++
    }

    if (this.currentFrame >= this.interpolatedFrames.length - 1) {
      // Animation complete
      this.isPlaying = false
      this.onComplete?.()
      return
    }

    // Continue animation
    requestAnimationFrame(() => this.animate())
  }

  getCurrentFrame(): AnimationFrame | null {
    if (this.currentFrame >= this.interpolatedFrames.length) return null
    return this.interpolatedFrames[this.currentFrame]
  }

  stop() {
    this.isPlaying = false
  }

  reset() {
    this.currentFrame = 0
    this.isPlaying = false
  }

  getProgress(): number {
    if (this.interpolatedFrames.length === 0) return 0
    return this.currentFrame / (this.interpolatedFrames.length - 1)
  }

  getTotalDuration(): number {
    if (this.interpolatedFrames.length === 0) return 0
    return this.interpolatedFrames[this.interpolatedFrames.length - 1].time
  }
}
