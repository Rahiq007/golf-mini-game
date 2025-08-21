// Enhanced physics configuration for 10% win rate
export const HARD_PHYSICS_CONFIG = {
  // Base physics - more realistic and challenging
  VMAX: 28, // Reduced max velocity - requires more precision
  friction: 0.025, // Increased friction for less roll
  holeRadius: 0.035, // Smaller hole (was 0.054) - much harder to get in
  tolerance: 0.015, // Very small tolerance
  windMaxMagnitude: 4.5, // Stronger wind effects
  maxSimTime: 12, 
  stopSpeedThreshold: 0.12, // Higher threshold - ball stops easier
  timestep: 1 / 120,
  gravity: 9.81,
  airResistance: 0.0015, // More air resistance
  bounceRestitution: 0.25, // Less bounce - more punishing
  rollResistance: 0.012, // More rolling resistance
  
  // Additional difficulty factors
  windVariability: 0.3, // Wind changes during flight
  slopeEffect: 0.05, // Slight slope towards/away from hole
  spinDecay: 0.98, // Faster spin decay
  
  // Win condition strictness
  maxWinSpeed: 1.2, // Maximum speed to count as "in hole"
  bounceOutSpeed: 1.5, // Speed above which ball bounces out
}

// Course-specific difficulty multipliers
export const DIFFICULTY_MULTIPLIERS = {
  easy: {
    holeRadiusMultiplier: 1.3,
    windMultiplier: 0.7,
    frictionMultiplier: 0.85,
    toleranceMultiplier: 1.5,
  },
  medium: {
    holeRadiusMultiplier: 1.0,
    windMultiplier: 1.0,
    frictionMultiplier: 1.0,
    toleranceMultiplier: 1.0,
  },
  hard: {
    holeRadiusMultiplier: 0.75, // Even smaller hole
    windMultiplier: 1.3,
    frictionMultiplier: 1.2,
    toleranceMultiplier: 0.7,
  },
  extreme: {
    holeRadiusMultiplier: 0.6, // Tiny hole
    windMultiplier: 1.5,
    frictionMultiplier: 1.4,
    toleranceMultiplier: 0.5,
  }
}

// Apply difficulty adjustments to base config
export function applyDifficulty(baseConfig: any, difficulty: string): any {
  const multipliers = DIFFICULTY_MULTIPLIERS[difficulty as keyof typeof DIFFICULTY_MULTIPLIERS] || DIFFICULTY_MULTIPLIERS.medium
  
  return {
    ...baseConfig,
    holeRadius: baseConfig.holeRadius * multipliers.holeRadiusMultiplier,
    windMaxMagnitude: baseConfig.windMaxMagnitude * multipliers.windMultiplier,
    friction: baseConfig.friction * multipliers.frictionMultiplier,
    tolerance: baseConfig.tolerance * multipliers.toleranceMultiplier,
  }
}
