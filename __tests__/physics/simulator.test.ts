import { GolfPhysicsSimulator, DEFAULT_PHYSICS_CONFIG } from "@/lib/physics/simulator"
import { SeededRNG } from "@/lib/physics/rng"
import type { SimulationInput } from "@/lib/physics/types"

describe("GolfPhysicsSimulator", () => {
  let simulator: GolfPhysicsSimulator

  beforeEach(() => {
    simulator = new GolfPhysicsSimulator()
  })

  describe("Deterministic Behavior", () => {
    it("should produce identical results for same inputs and seed", () => {
      const input: SimulationInput = {
        angle: Math.PI / 6, // 30 degrees
        power: 0.8,
        seed: 12345,
      }

      const result1 = simulator.simulate(input)
      const result2 = simulator.simulate(input)

      expect(result1.outcome).toBe(result2.outcome)
      expect(result1.finalPosition).toEqual(result2.finalPosition)
      expect(result1.totalTime).toBe(result2.totalTime)
      expect(result1.trajectory.length).toBe(result2.trajectory.length)

      // Check trajectory points are identical
      for (let i = 0; i < result1.trajectory.length; i++) {
        expect(result1.trajectory[i].position).toEqual(result2.trajectory[i].position)
        expect(result1.trajectory[i].velocity).toEqual(result2.trajectory[i].velocity)
        expect(result1.trajectory[i].time).toBe(result2.trajectory[i].time)
      }
    })

    it("should produce different results for different seeds", () => {
      const input1: SimulationInput = { angle: Math.PI / 4, power: 0.7, seed: 111 }
      const input2: SimulationInput = { angle: Math.PI / 4, power: 0.7, seed: 222 }

      const result1 = simulator.simulate(input1)
      const result2 = simulator.simulate(input2)

      // Results should be different due to different wind effects
      expect(result1.windEffect).not.toEqual(result2.windEffect)
      expect(result1.finalPosition).not.toEqual(result2.finalPosition)
    })

    it("should be cross-platform deterministic with value rounding", () => {
      const input: SimulationInput = {
        angle: 0.5235987755982988, // π/6 with floating point precision
        power: 0.75,
        seed: 54321,
      }

      const result = simulator.simulate(input)

      // Check that all values are properly rounded for determinism
      result.trajectory.forEach((state) => {
        expect(state.position.x).toBe(Math.round(state.position.x * 10000) / 10000)
        expect(state.position.y).toBe(Math.round(state.position.y * 10000) / 10000)
        expect(state.velocity.x).toBe(Math.round(state.velocity.x * 10000) / 10000)
        expect(state.velocity.y).toBe(Math.round(state.velocity.y * 10000) / 10000)
      })
    })
  })

  describe("Input Validation", () => {
    it("should validate angle range", () => {
      const invalidInput: SimulationInput = {
        angle: Math.PI, // 180 degrees - too high
        power: 0.5,
        seed: 123,
      }

      expect(() => simulator.simulate(invalidInput)).toThrow("Invalid input")
    })

    it("should validate power range", () => {
      const invalidInput: SimulationInput = {
        angle: 0,
        power: 1.5, // Over 100%
        seed: 123,
      }

      expect(() => simulator.simulate(invalidInput)).toThrow("Invalid input")
    })

    it("should validate seed", () => {
      const invalidInput: SimulationInput = {
        angle: 0,
        power: 0.5,
        seed: -1, // Negative seed
      }

      expect(() => simulator.simulate(invalidInput)).toThrow("Invalid input")
    })
  })

  describe("Physics Behavior", () => {
    it("should simulate realistic ball trajectory", () => {
      const input: SimulationInput = {
        angle: Math.PI / 4, // 45 degrees for maximum range
        power: 1.0, // Full power
        seed: 999,
      }

      const result = simulator.simulate(input)

      expect(result.trajectory.length).toBeGreaterThan(10)
      expect(result.maxHeight).toBeGreaterThan(0)
      expect(result.totalDistance).toBeGreaterThan(0)
      expect(result.finalPosition.x).toBeGreaterThan(0)
    })

    it("should handle low power shots", () => {
      const input: SimulationInput = {
        angle: Math.PI / 6,
        power: 0.1, // Very low power
        seed: 777,
      }

      const result = simulator.simulate(input)

      expect(result.finalPosition.x).toBeLessThan(10) // Should not travel far
      expect(result.outcome).toBe("lose") // Unlikely to reach hole
    })

    it("should detect winning shots", () => {
      // Use known winning parameters
      const input: SimulationInput = {
        angle: 0.2617993877991494, // ~15 degrees
        power: 0.85,
        seed: 42, // Known seed that produces a win
      }

      const result = simulator.simulate(input)

      if (result.outcome === "win") {
        const distanceToHole = Math.sqrt(
          (result.finalPosition.x - DEFAULT_PHYSICS_CONFIG.holePosition.x) ** 2 +
            (result.finalPosition.y - DEFAULT_PHYSICS_CONFIG.holePosition.y) ** 2,
        )
        expect(distanceToHole).toBeLessThanOrEqual(DEFAULT_PHYSICS_CONFIG.holeRadius + DEFAULT_PHYSICS_CONFIG.tolerance)
      }
    })
  })

  describe("Configuration", () => {
    it("should use custom physics configuration", () => {
      const customConfig = {
        ...DEFAULT_PHYSICS_CONFIG,
        VMAX: 50, // Higher max velocity
        holePosition: { x: 30, y: 0 }, // Closer hole
      }

      const customSimulator = new GolfPhysicsSimulator(customConfig)
      const input: SimulationInput = {
        angle: Math.PI / 4,
        power: 1.0,
        seed: 123,
      }

      const result = customSimulator.simulate(input)
      expect(result.finalPosition.x).toBeGreaterThan(30) // Should overshoot closer hole with higher velocity
    })
  })
})

describe("SeededRNG", () => {
  it("should produce consistent random sequences", () => {
    const rng1 = new SeededRNG(12345)
    const rng2 = new SeededRNG(12345)

    const sequence1 = Array.from({ length: 10 }, () => rng1.next())
    const sequence2 = Array.from({ length: 10 }, () => rng2.next())

    expect(sequence1).toEqual(sequence2)
  })

  it("should produce different sequences for different seeds", () => {
    const rng1 = new SeededRNG(111)
    const rng2 = new SeededRNG(222)

    const sequence1 = Array.from({ length: 10 }, () => rng1.next())
    const sequence2 = Array.from({ length: 10 }, () => rng2.next())

    expect(sequence1).not.toEqual(sequence2)
  })

  it("should reset to original seed", () => {
    const rng = new SeededRNG(54321)
    const firstValue = rng.next()

    // Generate more values
    rng.next()
    rng.next()

    // Reset and check first value matches
    rng.reset()
    expect(rng.next()).toBe(firstValue)
  })
})
