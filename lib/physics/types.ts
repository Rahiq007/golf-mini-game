export interface PhysicsConfig {
  course_index: number  // Index of the current course in the golf course array
  VMAX: number // Maximum initial velocity
  friction: number // Friction coefficient
  holePosition: { x: number; y: number; z: number } // Hole position on the course
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

export interface Vector3D {
  x: number
  y: number
  z: number
}

export interface BallState {
  position: Vector3D
  velocity: Vector3D
  acceleration: Vector3D
  spin: number // Ball spin rate
  time: number
  isRolling: boolean // Whether ball is rolling on ground
}

export interface SimulationInput {
  angle: number // Launch angle in radians
  anglePhi: number // angles left/right in radians.
  power: number // Power from 0 to 1
  seed: number // Random seed for deterministic behavior
  timestamp?: number // Optional timestamp for replay protection
}

export interface SimulationResult {
  trajectory: BallState[] // Array of ball states over time
  outcome: "win" | "lose"
  finalPosition: Vector3D
  totalTime: number
  maxHeight: number // Maximum height reached
  totalDistance: number // Total distance traveled
  windEffect: Vector3D // Applied wind vector
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
