import type {
  PhysicsConfig,
  Vector2D,
  BallState,
  SimulationInput,
  SimulationResult,
  PhysicsValidation,
  DebugInfo,
} from "./types"
import { SeededRNG } from "./rng"

export const DEFAULT_PHYSICS_CONFIG: PhysicsConfig = {
  VMAX: 30, // Maximum initial velocity (m/s) - realistic golf drive
  friction: 0.015, // Friction coefficient for grass
  holePosition: { x: 45, y: 0 }, // Hole at 45 meters (realistic par-3 distance)
  holeRadius: 0.054, // Standard golf hole radius (4.25 inches)
  tolerance: 0.02, // 2cm tolerance for "close enough"
  windMaxMagnitude: 3, // Max 3 m/s wind (light breeze)
  maxSimTime: 15, // 15 second max simulation
  stopSpeedThreshold: 0.05, // Stop if velocity < 0.05 m/s
  timestep: 1 / 120, // 120 FPS for smoother physics
  gravity: 9.81, // Earth gravity
  airResistance: 0.001, // Air resistance coefficient
  bounceRestitution: 0.3, // Energy retained on bounce
  rollResistance: 0.008, // Rolling resistance on grass
}

export class GolfPhysicsSimulator {
  private config: PhysicsConfig
  private rng: SeededRNG
  private debugMode: boolean

  constructor(config: PhysicsConfig = DEFAULT_PHYSICS_CONFIG, debugMode = false) {
    this.config = { ...config }
    this.rng = new SeededRNG(0)
    this.debugMode = debugMode
  }

  validateInput(input: SimulationInput): PhysicsValidation {
    const errors: string[] = []
    const warnings: string[] = []

    if (input.angle < -Math.PI / 2 || input.angle > Math.PI / 2) {
      errors.push("Angle must be between -90 and 90 degrees")
    }

    if (input.power < 0 || input.power > 1) {
      errors.push("Power must be between 0 and 1")
    }

    if (!Number.isInteger(input.seed) || input.seed < 0) {
      errors.push("Seed must be a non-negative integer")
    }

    if (input.power < 0.1) {
      warnings.push("Very low power may not reach the hole")
    }

    if (Math.abs(input.angle) > Math.PI / 4) {
      warnings.push("High angle shots are less predictable")
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    }
  }

  simulate(input: SimulationInput): SimulationResult {
    const validation = this.validateInput(input)
    if (!validation.isValid) {
      throw new Error(`Invalid input: ${validation.errors.join(", ")}`)
    }

    this.rng.reset(input.seed)

    // Calculate initial velocity from angle and power with realistic scaling
    const initialSpeed = input.power * this.config.VMAX
    const initialVelocity: Vector2D = {
      x: Math.cos(input.angle) * initialSpeed,
      y: Math.sin(input.angle) * initialSpeed,
    }

    // Generate deterministic wind effect
    const windAngle = this.rng.range(0, 2 * Math.PI)
    const windMagnitude = this.rng.range(0, this.config.windMaxMagnitude)
    const windEffect: Vector2D = {
      x: Math.cos(windAngle) * windMagnitude,
      y: Math.sin(windAngle) * windMagnitude,
    }

    const trajectory: BallState[] = []
    let maxHeight = 0
    let totalDistance = 0
    let stoppedReason: "hole" | "friction" | "timeout" | "boundary" = "timeout"

    const currentState: BallState = {
      position: { x: 0, y: 0 },
      velocity: { ...initialVelocity },
      acceleration: { x: 0, y: 0 },
      spin: this.rng.range(50, 200), // Initial backspin
      time: 0,
      isRolling: false,
    }

    trajectory.push(this.cloneState(currentState))

    // Fixed timestep simulation with enhanced physics
    while (currentState.time < this.config.maxSimTime) {
      const prevPosition = { ...currentState.position }
      currentState.time += this.config.timestep

      // Reset acceleration
      currentState.acceleration.x = 0
      currentState.acceleration.y = 0

      // Apply gravity (only when airborne)
      if (currentState.position.y > 0 || currentState.velocity.y > 0) {
        currentState.acceleration.y -= this.config.gravity
        currentState.isRolling = false
      } else {
        currentState.isRolling = true
        currentState.position.y = 0 // Keep on ground
      }

      // Apply wind force (stronger effect when airborne)
      const windMultiplier = currentState.isRolling ? 0.1 : 1.0
      currentState.acceleration.x += windEffect.x * windMultiplier * 0.1
      currentState.acceleration.y += windEffect.y * windMultiplier * 0.1

      // Apply air resistance
      const speed = Math.sqrt(currentState.velocity.x ** 2 + currentState.velocity.y ** 2)
      if (speed > 0) {
        const airResistanceForce = this.config.airResistance * speed * speed
        const resistanceRatio = airResistanceForce / speed
        currentState.acceleration.x -= currentState.velocity.x * resistanceRatio
        currentState.acceleration.y -= currentState.velocity.y * resistanceRatio
      }

      // Apply rolling resistance when on ground
      if (currentState.isRolling && speed > 0) {
        const rollingForce = this.config.rollResistance * this.config.gravity
        const rollingRatio = Math.min(rollingForce / speed, 1)
        currentState.acceleration.x -= currentState.velocity.x * rollingRatio
      }

      // Apply friction when rolling
      if (currentState.isRolling) {
        const frictionForce = this.config.friction * this.config.gravity
        if (speed > 0) {
          const frictionRatio = Math.min((frictionForce * this.config.timestep) / speed, 1)
          currentState.velocity.x *= 1 - frictionRatio
          currentState.velocity.y *= 1 - frictionRatio
        }
      }

      // Update velocity with acceleration
      currentState.velocity.x += currentState.acceleration.x * this.config.timestep
      currentState.velocity.y += currentState.acceleration.y * this.config.timestep

      // Update position
      currentState.position.x += currentState.velocity.x * this.config.timestep
      currentState.position.y += currentState.velocity.y * this.config.timestep

      // Handle ground collision
      if (currentState.position.y < 0) {
        currentState.position.y = 0
        currentState.velocity.y = Math.abs(currentState.velocity.y) * this.config.bounceRestitution
        if (currentState.velocity.y < 0.5) {
          currentState.velocity.y = 0 // Stop small bounces
        }
      }

      // Update spin decay
      currentState.spin *= 0.99

      // Round values for cross-platform determinism
      currentState.position.x = Math.round(currentState.position.x * 10000) / 10000
      currentState.position.y = Math.round(currentState.position.y * 10000) / 10000
      currentState.velocity.x = Math.round(currentState.velocity.x * 10000) / 10000
      currentState.velocity.y = Math.round(currentState.velocity.y * 10000) / 10000

      // Track maximum height and distance
      maxHeight = Math.max(maxHeight, currentState.position.y)
      totalDistance += Math.sqrt(
        (currentState.position.x - prevPosition.x) ** 2 + (currentState.position.y - prevPosition.y) ** 2,
      )

      trajectory.push(this.cloneState(currentState))

      // Check if ball stopped
      const currentSpeed = Math.sqrt(currentState.velocity.x ** 2 + currentState.velocity.y ** 2)
      if (currentSpeed < this.config.stopSpeedThreshold && currentState.isRolling) {
        stoppedReason = "friction"
        break
      }

      // Check boundaries (simple course bounds)
      if (Math.abs(currentState.position.y) > 20 || currentState.position.x < -5 || currentState.position.x > 100) {
        stoppedReason = "boundary"
        break
      }

      // CRITICAL: Hole detection - WIN if ball CENTER is INSIDE the hole ring
      const distanceToHole = Math.sqrt(
        (currentState.position.x - this.config.holePosition.x) ** 2 +
          (currentState.position.y - this.config.holePosition.y) ** 2,
      )

      // WIN DETECTION: Ball must be inside the hole to win
      // Using base radius for detection - if ball is inside, it's a WIN!
      // NO SPEED RESTRICTION - fast balls can still go in!
      const holeWinRadius = this.config.holeRadius // Use base radius for win detection
      
      // Ball must be INSIDE the hole and on the ground - SPEED DOESN'T MATTER!
      if (distanceToHole < holeWinRadius && currentState.isRolling) {
        // Ball is IN THE HOLE - it's a WIN no matter the speed!
        stoppedReason = "hole"
        console.log('[PHYSICS] Ball IN HOLE - WIN!', {
          distance: distanceToHole.toFixed(3),
          holeRadius: holeWinRadius.toFixed(3),
          speed: currentSpeed.toFixed(3),
          message: 'WINNER - Ball entered hole!'
        })
        break
      }
      
      // Log near misses for debugging
      if (distanceToHole <= this.config.holeRadius * 2 && currentState.isRolling) {
        const isInHole = distanceToHole < holeWinRadius
        if (isInHole) {
          console.log('[PHYSICS] Ball ENTERING HOLE', {
            distance: distanceToHole.toFixed(3),
            holeRadius: holeWinRadius.toFixed(3),
            speed: currentSpeed.toFixed(3)
          })
        } else {
          console.log('[PHYSICS] Ball NEAR hole but NOT IN', {
            distance: distanceToHole.toFixed(3),
            holeRadius: holeWinRadius.toFixed(3),
            speed: currentSpeed.toFixed(3)
          })
        }
      }
    }

    // Final win condition check - based ONLY on if the ball entered the hole
    const outcome = stoppedReason === 'hole' ? 'win' : 'lose'

    return {
      trajectory,
      outcome,
      finalPosition: currentState.position,
      totalTime: currentState.time,
      maxHeight,
      totalDistance,
      windEffect,
      stoppedReason,
    }
  }

  private cloneState(state: BallState): BallState {
    return {
      position: { ...state.position },
      velocity: { ...state.velocity },
      acceleration: { ...state.acceleration },
      spin: state.spin,
      time: state.time,
      isRolling: state.isRolling,
    }
  }

  // Get debug information about the simulation
  getDebugInfo(result: SimulationResult): DebugInfo {
    const speeds = result.trajectory.map((state) => Math.sqrt(state.velocity.x ** 2 + state.velocity.y ** 2))

    const averageSpeed = speeds.reduce((sum, speed) => sum + speed, 0) / speeds.length
    const initialEnergy = speeds[0] ** 2
    const finalEnergy = speeds[speeds.length - 1] ** 2
    const energyLoss = (initialEnergy - finalEnergy) / initialEnergy

    return {
      stepCount: result.trajectory.length,
      averageSpeed,
      energyLoss,
      windContribution: Math.sqrt(result.windEffect.x ** 2 + result.windEffect.y ** 2),
    }
  }

  // Update configuration
  updateConfig(newConfig: Partial<PhysicsConfig>): void {
    this.config = { ...this.config, ...newConfig }
  }

  // Get current configuration
  getConfig(): PhysicsConfig {
    return { ...this.config }
  }
}
