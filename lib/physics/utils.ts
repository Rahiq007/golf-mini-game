import type { SimulationResult, BallState, Vector2D, Vector3D } from "./types"
import { DEFAULT_PHYSICS_CONFIG } from "./simulator"
import { SeededRNG } from "./rng"

export class PhysicsUtils {
  // Calculate trajectory arc for preview (simplified parabolic approximation)
  static calculateTrajectoryPreview(
    angle: number,
    power: number,
    maxVelocity: number,
    gravity = 9.81,
    steps = 50,
  ): Vector2D[] {
    const initialSpeed = power * maxVelocity
    const vx = Math.cos(angle) * initialSpeed
    const vy = Math.sin(angle) * initialSpeed

    // Calculate flight time (when ball hits ground)
    const flightTime = (2 * vy) / gravity
    const timeStep = flightTime / steps

    const points: Vector2D[] = []

    for (let i = 0; i <= steps; i++) {
      const t = i * timeStep
      const x = vx * t
      const y = vy * t - 0.5 * gravity * t * t

      if (y >= 0) {
        points.push({ x, y })
      }
    }

    return points
  }

  // Calculate 3D trajectory preview with wind and air resistance
  static calculate3DTrajectoryPreview(
    angle: number,
    anglePhi: number,
    power: number,
    maxVelocity = DEFAULT_PHYSICS_CONFIG.VMAX,
    gravity = 9.81,
    airResistance = 0.001,
    timestep = 1 / 120,
    maxTime = 15,
  ): Array<{ x: number; y: number; z: number }> {
    // Calculate initial velocity
    const initialSpeed = power * maxVelocity

    // Initial velocity components
    const velocity = {
      x: Math.cos(angle) * initialSpeed * Math.cos(anglePhi),
      y: Math.sin(angle) * initialSpeed,
      z: Math.cos(angle) * initialSpeed * Math.sin(anglePhi) * (-1),
    }

    // Generate deterministic wind effect
    const rng = new SeededRNG(0)
    const windAngle = rng.range(0, 2 * Math.PI)
    const windAnglePhi = rng.range(0, 2 * Math.PI)
    const windMagnitude = rng.range(0, DEFAULT_PHYSICS_CONFIG.windMaxMagnitude)
    const windEffect: Vector3D = {  // TODO: Updated to include calculations with anglePhi.
      x: Math.cos(windAngle) * windMagnitude * Math.cos(windAnglePhi),
      y: Math.sin(windAngle) * windMagnitude,
      z: Math.cos(windAngle) * windMagnitude * Math.sin(windAnglePhi),  
    }

    const position = {
      x: 0,
      y: 0,
      z: 0
    }

    const points: Vector3D[] = []
    let time = 0

    points.push({ ...position })

    while (time < maxTime && position.y >= 0) { // Stop trajectory simulation after touching the ground
      time += timestep

      // Reset acceleration
      const acceleration = {
        x: 0,
        y: 0,
        z: 0
      }

      // Apply gravity (only when airborne)
      if (position.y > 0 || velocity.y > 0) acceleration.y -= gravity
      else position.y = 0

      // Apply wind force
      const windMultiplier = 1.0
      acceleration.x += windEffect.x * windMultiplier * 0.1
      acceleration.y += windEffect.y * windMultiplier * 0.1
      acceleration.z += windEffect.z * windMultiplier * 0.1

      // Apply air resistance
      const speed = Math.sqrt(velocity.x ** 2 + velocity.y ** 2 + velocity.z ** 2)
      if (speed > 0) {
        const airResistanceForce = airResistance * speed * speed
        const resistanceRatio = airResistanceForce / speed
        acceleration.x -= velocity.x * resistanceRatio
        acceleration.y -= velocity.y * resistanceRatio
        acceleration.z -= velocity.z * resistanceRatio
      }

      // Update velocity with acceleration
      velocity.x += acceleration.x * timestep
      velocity.y += acceleration.y * timestep
      velocity.z += acceleration.z * timestep

      // Update position
      position.x += velocity.x * timestep
      position.y += velocity.y * timestep
      position.z += velocity.z * timestep

      // Round values for cross-platform determinism (match simulator)
      position.x = Math.round(position.x * 10000) / 10000
      position.y = Math.round(position.y * 10000) / 10000
      position.z = Math.round(position.z * 10000) / 10000
      velocity.x = Math.round(velocity.x * 10000) / 10000
      velocity.y = Math.round(velocity.y * 10000) / 10000
      velocity.z = Math.round(velocity.z * 10000) / 10000

      points.push({ ...position })
    }
    return points
  }

  // Interpolate between trajectory points for smooth animation
  static interpolateTrajectory(trajectory: BallState[], targetFPS = 60): BallState[] {
    if (trajectory.length < 2) return trajectory

    const interpolated: BallState[] = []
    const targetTimeStep = 1 / targetFPS

    for (let i = 0; i < trajectory.length - 1; i++) {
      const current = trajectory[i]
      const next = trajectory[i + 1]
      const timeDiff = next.time - current.time

      if (timeDiff <= targetTimeStep) {
        interpolated.push(current)
        continue
      }

      const steps = Math.ceil(timeDiff / targetTimeStep)

      for (let step = 0; step < steps; step++) {
        const t = step / steps
        const time = current.time + t * timeDiff

        interpolated.push({
          position: {
            x: current.position.x + t * (next.position.x - current.position.x),
            y: current.position.y + t * (next.position.y - current.position.y),
            z: current.position.z + t * (next.position.z - current.position.z)
          },
          velocity: {
            x: current.velocity.x + t * (next.velocity.x - current.velocity.x),
            y: current.velocity.y + t * (next.velocity.y - current.velocity.y),
            z: current.velocity.z + t * (next.velocity.z - current.velocity.z),

          },
          acceleration: {
            x: current.acceleration.x + t * (next.acceleration.x - current.acceleration.x),
            y: current.acceleration.y + t * (next.acceleration.y - current.acceleration.y),
            z: current.acceleration.z + t * (next.acceleration.z - current.acceleration.z),
          },
          spin: current.spin + t * (next.spin - current.spin),
          time,
          isRolling: t > 0.5 ? next.isRolling : current.isRolling,
        })
      }
    }

    // Add the final point
    interpolated.push(trajectory[trajectory.length - 1])

    return interpolated
  }

  // Calculate optimal shot parameters for a given target
  static calculateOptimalShot(
    targetX: number,
    targetY = 0,
    maxVelocity: number,
    gravity = 9.81,
  ): { angle: number; power: number; isReachable: boolean } {
    const distance = Math.sqrt(targetX * targetX + targetY * targetY)
    const maxRange = (maxVelocity * maxVelocity) / gravity

    if (distance > maxRange) {
      return { angle: Math.PI / 4, power: 1, isReachable: false }
    }

    // Calculate optimal angle for maximum range
    const optimalAngle = Math.asin(Math.sqrt(distance * gravity) / maxVelocity) / 2
    const requiredSpeed = Math.sqrt((distance * gravity) / Math.sin(2 * optimalAngle))
    const power = Math.min(requiredSpeed / maxVelocity, 1)

    return {
      angle: optimalAngle,
      power,
      isReachable: true,
    }
  }

  // Analyze trajectory for interesting points
  static analyzeTrajectory(result: SimulationResult) {
    const { trajectory } = result

    let apexIndex = 0
    let maxHeight = 0
    let landingIndex = -1

    // Find apex and landing
    for (let i = 0; i < trajectory.length; i++) {
      const state = trajectory[i]

      if (state.position.y > maxHeight) {
        maxHeight = state.position.y
        apexIndex = i
      }

      if (i > 0 && trajectory[i - 1].position.y > 0 && state.position.y <= 0) {
        landingIndex = i
      }
    }

    return {
      apex: trajectory[apexIndex],
      landing: landingIndex >= 0 ? trajectory[landingIndex] : null,
      airTime: landingIndex >= 0 ? trajectory[landingIndex].time : result.totalTime,
      rollTime: landingIndex >= 0 ? result.totalTime - trajectory[landingIndex].time : 0,
    }
  }

  // Convert angle from degrees to radians
  static degreesToRadians(degrees: number): number {
    return (degrees * Math.PI) / 180
  }

  // Convert angle from radians to degrees
  static radiansToDegrees(radians: number): number {
    return (radians * 180) / Math.PI
  }

  // Calculate distance between two points
  static distance(p1: Vector2D, p2: Vector2D): number {
    return Math.sqrt((p2.x - p1.x) ** 2 + (p2.y - p1.y) ** 2)
  }

  // Normalize vector
  static normalize(vector: Vector2D): Vector2D {
    const length = Math.sqrt(vector.x ** 2 + vector.y ** 2)
    if (length === 0) return { x: 0, y: 0 }
    return { x: vector.x / length, y: vector.y / length }
  }
}
