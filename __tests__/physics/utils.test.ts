import { PhysicsUtils } from "@/lib/physics/utils"
import type { PhysicsConfig, SimulationResult, BallState } from "@/lib/physics/types"

// Mock physics config for testing
const mockConfig: PhysicsConfig = {
  course_index: 0,
  VMAX: 30,
  friction: 0.02,
  holePosition: { x: 45, y: 0, z: 0 },
  holeRadius: 0.054,
  tolerance: 0.02,
  windMaxMagnitude: 3,
  maxSimTime: 10,
  stopSpeedThreshold: 0.1,
  timestep: 1 / 120,
  gravity: 9.81,
  airResistance: 0.001,
  bounceRestitution: 0.3,
  rollResistance: 0.01,
}

describe("PhysicsUtils - Comprehensive Tests", () => {
  describe("calculateTrajectoryPreview", () => {
    it("should calculate basic trajectory", () => {
      const angle = Math.PI / 4 // 45 degrees
      const power = 0.8
      const maxVelocity = 30
      
      const trajectory = PhysicsUtils.calculateTrajectoryPreview(angle, power, maxVelocity)
      
      expect(trajectory.length).toBeGreaterThan(10)
      expect(trajectory[0]).toEqual({ x: 0, y: 0 })
      expect(trajectory[trajectory.length - 1].y).toBeCloseTo(0, 1)
    })

    it("should handle zero angle (flat shot)", () => {
      const trajectory = PhysicsUtils.calculateTrajectoryPreview(0, 0.5, 30)
      
      expect(trajectory.length).toBeGreaterThan(0)
      expect(trajectory[0].y).toBe(0)
    })

    it("should handle maximum angle", () => {
      const trajectory = PhysicsUtils.calculateTrajectoryPreview(Math.PI / 2, 0.5, 30)
      
      // Should go straight up and down (minimal x distance)
      const finalX = trajectory[trajectory.length - 1].x
      expect(finalX).toBeLessThan(1)
    })

    it("should handle zero power", () => {
      const trajectory = PhysicsUtils.calculateTrajectoryPreview(Math.PI / 4, 0, 30)
      
      expect(trajectory.length).toBe(1)
      expect(trajectory[0]).toEqual({ x: 0, y: 0 })
    })

    it("should handle maximum power", () => {
      const trajectory = PhysicsUtils.calculateTrajectoryPreview(Math.PI / 4, 1, 30)
      
      expect(trajectory.length).toBeGreaterThan(20)
      const maxDistance = trajectory[trajectory.length - 1].x
      expect(maxDistance).toBeGreaterThan(50)
    })

    it("should respect custom step count", () => {
      const trajectory10 = PhysicsUtils.calculateTrajectoryPreview(Math.PI / 4, 0.8, 30, 9.81, 10)
      const trajectory100 = PhysicsUtils.calculateTrajectoryPreview(Math.PI / 4, 0.8, 30, 9.81, 100)
      
      expect(trajectory10.length).toBeLessThan(trajectory100.length)
    })

    it("should only include points above ground", () => {
      const trajectory = PhysicsUtils.calculateTrajectoryPreview(Math.PI / 4, 0.8, 30)
      
      trajectory.forEach(point => {
        expect(point.y).toBeGreaterThanOrEqual(0)
      })
    })
  })

  describe("calculate3DTrajectoryPreview", () => {
    it("should calculate 3D trajectory with wind", () => {
      const angle = Math.PI / 6
      const anglePhi = 0
      const power = 0.7
      const seed = 12345
      
      const trajectory = PhysicsUtils.calculate3DTrajectoryPreview(
        angle,
        anglePhi,
        power,
        mockConfig,
        seed
      )
      
      expect(trajectory.length).toBeGreaterThan(10)
      expect(trajectory[0]).toEqual({ x: 0, y: 0, z: 0 })
    })

    it("should be deterministic with same seed", () => {
      const params = {
        angle: Math.PI / 4,
        anglePhi: Math.PI / 8,
        power: 0.8,
        seed: 54321
      }
      
      const trajectory1 = PhysicsUtils.calculate3DTrajectoryPreview(
        params.angle,
        params.anglePhi,
        params.power,
        mockConfig,
        params.seed
      )
      
      const trajectory2 = PhysicsUtils.calculate3DTrajectoryPreview(
        params.angle,
        params.anglePhi,
        params.power,
        mockConfig,
        params.seed
      )
      
      expect(trajectory1).toEqual(trajectory2)
    })

    it("should produce different trajectories with different seeds", () => {
      const angle = Math.PI / 4
      const anglePhi = 0
      const power = 0.7
      
      const trajectory1 = PhysicsUtils.calculate3DTrajectoryPreview(angle, anglePhi, power, mockConfig, 100)
      const trajectory2 = PhysicsUtils.calculate3DTrajectoryPreview(angle, anglePhi, power, mockConfig, 200)
      
      // Wind effects should be different
      expect(trajectory1[trajectory1.length - 1]).not.toEqual(trajectory2[trajectory2.length - 1])
    })

    it("should handle left angle (negative phi)", () => {
      const trajectory = PhysicsUtils.calculate3DTrajectoryPreview(
        Math.PI / 4,
        -Math.PI / 8,
        0.7,
        mockConfig,
        12345
      )
      
      // Should have positive z-component (to the left)
      expect(trajectory[trajectory.length - 1].z).toBeGreaterThan(0)
    })

    it("should handle right angle (positive phi)", () => {
      const trajectory = PhysicsUtils.calculate3DTrajectoryPreview(
        Math.PI / 4,
        Math.PI / 8,
        0.7,
        mockConfig,
        12345
      )
      
      // Should have negative z-component (to the right)
      expect(trajectory[trajectory.length - 1].z).toBeLessThan(0)
    })

    it("should round values for determinism", () => {
      const trajectory = PhysicsUtils.calculate3DTrajectoryPreview(
        Math.PI / 6,
        0,
        0.75,
        mockConfig,
        999
      )
      
      trajectory.forEach(point => {
        // Check 4 decimal place precision
        expect(point.x).toBe(Math.round(point.x * 10000) / 10000)
        expect(point.y).toBe(Math.round(point.y * 10000) / 10000)
        expect(point.z).toBe(Math.round(point.z * 10000) / 10000)
      })
    })

    it("should stop when ball hits ground", () => {
      const trajectory = PhysicsUtils.calculate3DTrajectoryPreview(
        Math.PI / 4,
        0,
        0.8,
        mockConfig,
        777
      )
      
      // Last point should be at or near ground level
      expect(trajectory[trajectory.length - 1].y).toBeLessThanOrEqual(0.01)
    })

    it("should respect maxSimTime", () => {
      const shortConfig = { ...mockConfig, maxSimTime: 1 }
      
      const trajectory = PhysicsUtils.calculate3DTrajectoryPreview(
        Math.PI / 4,
        0,
        0.9,
        shortConfig,
        555
      )
      
      const finalTime = trajectory.length * shortConfig.timestep
      expect(finalTime).toBeLessThanOrEqual(shortConfig.maxSimTime + shortConfig.timestep)
    })
  })

  describe("interpolateTrajectory", () => {
    const createMockTrajectory = (): BallState[] => [
      {
        position: { x: 0, y: 0, z: 0 },
        velocity: { x: 10, y: 10, z: 0 },
        acceleration: { x: 0, y: -9.81, z: 0 },
        spin: 0,
        time: 0,
        isRolling: false
      },
      {
        position: { x: 10, y: 5, z: 0 },
        velocity: { x: 10, y: 5, z: 0 },
        acceleration: { x: 0, y: -9.81, z: 0 },
        spin: 0,
        time: 1,
        isRolling: false
      }
    ]

    it("should interpolate between trajectory points", () => {
      const trajectory = createMockTrajectory()
      const interpolated = PhysicsUtils.interpolateTrajectory(trajectory, 60)
      
      expect(interpolated.length).toBeGreaterThan(trajectory.length)
    })

    it("should preserve original points", () => {
      const trajectory = createMockTrajectory()
      const interpolated = PhysicsUtils.interpolateTrajectory(trajectory, 60)
      
      // First and last points should match
      expect(interpolated[0].position).toEqual(trajectory[0].position)
      expect(interpolated[interpolated.length - 1].position).toEqual(trajectory[trajectory.length - 1].position)
    })

    it("should handle empty trajectory", () => {
      const interpolated = PhysicsUtils.interpolateTrajectory([], 60)
      expect(interpolated).toEqual([])
    })

    it("should handle single point trajectory", () => {
      const trajectory = [createMockTrajectory()[0]]
      const interpolated = PhysicsUtils.interpolateTrajectory(trajectory, 60)
      
      expect(interpolated).toEqual(trajectory)
    })

    it("should create smooth transitions", () => {
      const trajectory = createMockTrajectory()
      const interpolated = PhysicsUtils.interpolateTrajectory(trajectory, 60)
      
      // Check that interpolated points are between original points
      for (let i = 1; i < interpolated.length - 1; i++) {
        const point = interpolated[i]
        expect(point.position.x).toBeGreaterThanOrEqual(0)
        expect(point.position.x).toBeLessThanOrEqual(10)
      }
    })

    it("should respect target FPS", () => {
      const trajectory = createMockTrajectory()
      const fps30 = PhysicsUtils.interpolateTrajectory(trajectory, 30)
      const fps60 = PhysicsUtils.interpolateTrajectory(trajectory, 60)
      
      expect(fps60.length).toBeGreaterThan(fps30.length)
    })
  })

  describe("calculateOptimalShot", () => {
    it("should calculate shot for reachable target", () => {
      const result = PhysicsUtils.calculateOptimalShot(40, 0, 30, 9.81)
      
      expect(result.isReachable).toBe(true)
      expect(result.angle).toBeGreaterThan(0)
      expect(result.angle).toBeLessThan(Math.PI / 2)
      expect(result.power).toBeGreaterThan(0)
      expect(result.power).toBeLessThanOrEqual(1)
    })

    it("should handle unreachable target", () => {
      const result = PhysicsUtils.calculateOptimalShot(1000, 0, 30, 9.81)
      
      expect(result.isReachable).toBe(false)
      expect(result.power).toBe(1) // Max power
    })

    it("should handle target at origin", () => {
      const result = PhysicsUtils.calculateOptimalShot(0, 0, 30, 9.81)
      
      expect(result.power).toBeCloseTo(0, 1)
    })

    it("should handle very close target", () => {
      const result = PhysicsUtils.calculateOptimalShot(5, 0, 30, 9.81)
      
      expect(result.isReachable).toBe(true)
      expect(result.power).toBeLessThan(0.5)
    })
  })

  describe("analyzeTrajectory", () => {
    const createMockResult = (): SimulationResult => ({
      trajectory: [
        {
          position: { x: 0, y: 0, z: 0 },
          velocity: { x: 10, y: 10, z: 0 },
          acceleration: { x: 0, y: -9.81, z: 0 },
          spin: 0,
          time: 0,
          isRolling: false
        },
        {
          position: { x: 5, y: 8, z: 0 },
          velocity: { x: 10, y: 5, z: 0 },
          acceleration: { x: 0, y: -9.81, z: 0 },
          spin: 0,
          time: 0.5,
          isRolling: false
        },
        {
          position: { x: 10, y: 10, z: 0 },
          velocity: { x: 10, y: 0, z: 0 },
          acceleration: { x: 0, y: -9.81, z: 0 },
          spin: 0,
          time: 1,
          isRolling: false
        },
        {
          position: { x: 15, y: 8, z: 0 },
          velocity: { x: 10, y: -5, z: 0 },
          acceleration: { x: 0, y: -9.81, z: 0 },
          spin: 0,
          time: 1.5,
          isRolling: false
        },
        {
          position: { x: 20, y: 0, z: 0 },
          velocity: { x: 5, y: 0, z: 0 },
          acceleration: { x: 0, y: 0, z: 0 },
          spin: 0,
          time: 2,
          isRolling: true
        }
      ],
      outcome: "lose",
      finalPosition: { x: 20, y: 0, z: 0 },
      totalTime: 2,
      maxHeight: 10,
      totalDistance: 20,
      windEffect: { x: 1, y: 0, z: 0 },
      stoppedReason: "friction"
    })

    it("should find apex of trajectory", () => {
      const result = createMockResult()
      const analysis = PhysicsUtils.analyzeTrajectory(result)
      
      expect(analysis.apex.position.y).toBe(10)
      expect(analysis.apex.time).toBe(1)
    })

    it("should find landing point", () => {
      const result = createMockResult()
      const analysis = PhysicsUtils.analyzeTrajectory(result)
      
      expect(analysis.landing).not.toBeNull()
      expect(analysis.landing?.position.y).toBe(0)
    })

    it("should calculate air time", () => {
      const result = createMockResult()
      const analysis = PhysicsUtils.analyzeTrajectory(result)
      
      expect(analysis.airTime).toBe(2)
    })

    it("should calculate roll time", () => {
      const result = createMockResult()
      const analysis = PhysicsUtils.analyzeTrajectory(result)
      
      expect(analysis.rollTime).toBe(0)
    })
  })

  describe("Angle Conversions", () => {
    it("should convert degrees to radians", () => {
      expect(PhysicsUtils.degreesToRadians(0)).toBe(0)
      expect(PhysicsUtils.degreesToRadians(90)).toBeCloseTo(Math.PI / 2, 10)
      expect(PhysicsUtils.degreesToRadians(180)).toBeCloseTo(Math.PI, 10)
      expect(PhysicsUtils.degreesToRadians(360)).toBeCloseTo(2 * Math.PI, 10)
    })

    it("should convert radians to degrees", () => {
      expect(PhysicsUtils.radiansToDegrees(0)).toBe(0)
      expect(PhysicsUtils.radiansToDegrees(Math.PI / 2)).toBeCloseTo(90, 10)
      expect(PhysicsUtils.radiansToDegrees(Math.PI)).toBeCloseTo(180, 10)
      expect(PhysicsUtils.radiansToDegrees(2 * Math.PI)).toBeCloseTo(360, 10)
    })

    it("should be reversible", () => {
      const degrees = 45
      const radians = PhysicsUtils.degreesToRadians(degrees)
      const backToDegrees = PhysicsUtils.radiansToDegrees(radians)
      
      expect(backToDegrees).toBeCloseTo(degrees, 10)
    })
  })

  describe("Vector Operations", () => {
    it("should calculate distance between points", () => {
      const p1 = { x: 0, y: 0 }
      const p2 = { x: 3, y: 4 }
      
      expect(PhysicsUtils.distance(p1, p2)).toBe(5)
    })

    it("should handle same point", () => {
      const p = { x: 5, y: 5 }
      
      expect(PhysicsUtils.distance(p, p)).toBe(0)
    })

    it("should normalize vector", () => {
      const vector = { x: 3, y: 4 }
      const normalized = PhysicsUtils.normalize(vector)
      
      expect(normalized.x).toBeCloseTo(0.6, 10)
      expect(normalized.y).toBeCloseTo(0.8, 10)
      
      // Length should be 1
      const length = Math.sqrt(normalized.x ** 2 + normalized.y ** 2)
      expect(length).toBeCloseTo(1, 10)
    })

    it("should handle zero vector", () => {
      const normalized = PhysicsUtils.normalize({ x: 0, y: 0 })
      
      expect(normalized).toEqual({ x: 0, y: 0 })
    })
  })
})