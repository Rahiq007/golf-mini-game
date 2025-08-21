import { GolfPhysicsSimulator, DEFAULT_PHYSICS_CONFIG } from "./simulator"
import { PhysicsUtils } from "./utils"
import { CourseManager } from "../game/courseManager"
import type { PhysicsConfig, SimulationInput } from "./types"

export function createSimulator(config?: Partial<PhysicsConfig>) {
  // If no config provided, use the CourseManager's harder physics
  if (!config) {
    const courseManager = new CourseManager()
    const harderConfig = courseManager.getPhysicsConfig()
    return new GolfPhysicsSimulator(harderConfig)
  }
  return new GolfPhysicsSimulator({ ...DEFAULT_PHYSICS_CONFIG, ...config })
}

export function validatePhysicsInput(input: SimulationInput) {
  const simulator = new GolfPhysicsSimulator()
  return simulator.validateInput(input)
}

export function calculateTrajectoryPreview(angle: number, power: number, steps = 30) {
  // Use harder physics for trajectory preview
  const courseManager = new CourseManager()
  const config = courseManager.getPhysicsConfig()
  return PhysicsUtils.calculateTrajectoryPreview(
    angle,
    power,
    config.VMAX,
    config.gravity,
    steps,
  )
}
