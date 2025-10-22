import type { PhysicsConfig } from "../physics/types"

// Harder physics configuration for ~10% win rate
export const HARD_PHYSICS_CONFIG: PhysicsConfig = {
  VMAX: 28, // Reduced from 30 - less maximum velocity
  friction: 0.025, // Increased from 0.015 - more friction
  holePosition: { x: 45, y: 0, z: 0 }, // Default, will be overridden by course
  holeRadius: 0.25, // Increased to match visual hole size
  tolerance: 0.02, // Kept at 0.02 to ensure consistency between simulator and GameCanvas. Prev at 0.01.
  windMaxMagnitude: 5, // Increased from 3 - stronger wind effects
  maxSimTime: 15,
  stopSpeedThreshold: 0.05,
  timestep: 1 / 120,
  gravity: 9.81,
  airResistance: 0.0015, // Increased from 0.001 - more air resistance
  bounceRestitution: 0.25, // Reduced from 0.3 - less bounce
  rollResistance: 0.012, // Increased from 0.008 - more rolling resistance
}

// Course difficulty multipliers
export const DIFFICULTY_MULTIPLIERS = {
  easy: {
    friction: 0.9,
    windMaxMagnitude: 0.8,
    airResistance: 0.9,
    rollResistance: 0.9,
    holeRadius: 1.2,
  },
  medium: {
    friction: 1.0,
    windMaxMagnitude: 1.0,
    airResistance: 1.0,
    rollResistance: 1.0,
    holeRadius: 1.0,
  },
  hard: {
    friction: 1.2,
    windMaxMagnitude: 1.3,
    airResistance: 1.2,
    rollResistance: 1.2,
    holeRadius: 0.8,
  },
}
