export interface PhysicsConfig {
  VMAX: number // Maximum initial velocity
  friction: number // Friction coefficient
  holePosition: { x: number; y: number } // Hole position on the course
  holeRadius: number // Hole radius for success detection
  tolerance: number // Success tolerance margin
  windMaxMagnitude: number // Maximum wind effect
  maxSimTime: number // Maximum simulation time in seconds
  stopSpeedThreshold: number // Speed below which ball is considered stopped
  timestep: number // Fixed timestep for deterministic simulation
  gravity: number // Gravity acceleration (for trajectory physics)
  airResistance: number // Air resistance coefficient
  bounceRestitution: number // Bounce coefficient for obstacles
  rollResistance: number // Rolling resistance on grass
}

export interface Vector2D {
  x: number
  y: number
}

export interface BallState {
  position: Vector2D
  velocity: Vector2D
  acceleration: Vector2D
  spin: number // Ball spin rate
  time: number
  isRolling: boolean // Whether ball is rolling on ground
}

export interface SimulationInput {
  angle: number // Launch angle in radians
  power: number // Power from 0 to 1
  seed: number // Random seed for deterministic behavior
  timestamp?: number // Optional timestamp for replay protection
}

export interface SimulationResult {
  trajectory: BallState[] // Array of ball states over time
  outcome: "win" | "lose"
  finalPosition: Vector2D
  totalTime: number
  maxHeight: number // Maximum height reached
  totalDistance: number // Total distance traveled
  windEffect: Vector2D // Applied wind vector
  stoppedReason: "hole" | "friction" | "timeout" | "boundary"
}

export interface PhysicsValidation {
  isValid: boolean
  errors: string[]
  warnings: string[]
}

export interface DebugInfo {
  stepCount: number
  averageSpeed: number
  energyLoss: number
  windContribution: number
}
