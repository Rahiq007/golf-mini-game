import { useGameStore, type GameState } from "@/lib/store/gameStore"
import type { BallState } from "@/lib/physics/types"
import type { Coupon } from "@/app/api/mock/coupons/route"
import type { AwardedCoupon } from "@/lib/api/types"

// Helper to create mock coupons
const mockCoupons: Coupon[] = [
  {
    id: "c1",
    title: "10% OFF",
    description: "10% off sitewide",
    type: "percentage",
    value: 10,
    expiry: "2025-12-31",
    metadata: {},
  },
  {
    id: "c2",
    title: "$5 OFF",
    description: "$5 off",
    type: "fixed",
    value: 5,
    expiry: "2025-12-31",
    metadata: {},
  },
]

const mockAwardedCoupon: AwardedCoupon = {
  id: "c1",
  code: "MOCK-C1-123",
  title: "10% OFF",
  description: "10% off sitewide",
  type: "percentage",
  value: 10,
  expiry: "2025-12-31",
  awardedAt: new Date().toISOString(),
  metadata: {},
}

const mockTrajectory: BallState[] = [
  {
    position: { x: 0, y: 0, z: 0 },
    velocity: { x: 10, y: 10, z: 0 },
    acceleration: { x: 0, y: -9.81, z: 0 },
    spin: 0,
    time: 0,
    isRolling: false,
  },
  {
    position: { x: 5, y: 5, z: 0 },
    velocity: { x: 10, y: 5, z: 0 },
    acceleration: { x: 0, y: -9.81, z: 0 },
    spin: 0,
    time: 0.5,
    isRolling: false,
  },
]

describe("GameStore - Comprehensive Tests", () => {
  beforeEach(() => {
    // Reset store to initial state before each test
    useGameStore.getState().resetGame()
  })

  describe("Initial State", () => {
    it("should have correct initial state", () => {
      const state = useGameStore.getState()

      expect(state.gameState).toBe("selecting")
      expect(state.sessionId).toBeNull()
      expect(state.sessionSeed).toBeNull()
      expect(state.availableCoupons).toEqual([])
      expect(state.selectedCoupons).toEqual([])
      expect(state.trajectory).toEqual([])
      expect(state.gameResult).toBeNull()
      expect(state.awardedCoupon).toBeNull()
      expect(state.showTutorial).toBe(false)
      expect(state.isLoading).toBe(false)
      expect(state.error).toBeNull()
      expect(state.soundEnabled).toBe(true)
      expect(state.reducedMotion).toBe(false)
    })
  })

  describe("Game State Management", () => {
    it("should set game state", () => {
      useGameStore.getState().setGameState("playing")
      
      expect(useGameStore.getState().gameState).toBe("playing")
    })

    it("should transition through all game states", () => {
      const states: GameState[] = [
        "selecting",
        "playing",
        "animating",
        "result",
        "cooldown",
      ]

      states.forEach((state) => {
        useGameStore.getState().setGameState(state)
        expect(useGameStore.getState().gameState).toBe(state)
      })
    })
  })

  describe("Session Management", () => {
    it("should set session data", () => {
      const sessionId = "session_123"
      const seed = 12345

      useGameStore.getState().setSession(sessionId, seed)

      expect(useGameStore.getState().sessionId).toBe(sessionId)
      expect(useGameStore.getState().sessionSeed).toBe(seed)
    })

    it("should clear session data", () => {
      useGameStore.getState().setSession("session_123", 12345)
      useGameStore.getState().clearSession()

      expect(useGameStore.getState().sessionId).toBeNull()
      expect(useGameStore.getState().sessionSeed).toBeNull()
    })

    it("should handle seed of 0", () => {
      useGameStore.getState().setSession("session_0", 0)

      expect(useGameStore.getState().sessionSeed).toBe(0)
    })

    it("should handle negative seed", () => {
      useGameStore.getState().setSession("session_neg", -12345)

      expect(useGameStore.getState().sessionSeed).toBe(-12345)
    })
  })

  describe("Coupon Management", () => {
    it("should set available coupons", () => {
      useGameStore.getState().setAvailableCoupons(mockCoupons)

      expect(useGameStore.getState().availableCoupons).toEqual(mockCoupons)
    })

    it("should set selected coupons", () => {
      const selected = ["c1", "c2", "c3", "c4", "c5"]
      useGameStore.getState().setSelectedCoupons(selected)

      expect(useGameStore.getState().selectedCoupons).toEqual(selected)
    })

    it("should handle empty coupon selection", () => {
      useGameStore.getState().setSelectedCoupons([])

      expect(useGameStore.getState().selectedCoupons).toEqual([])
    })

    it("should replace selected coupons", () => {
      useGameStore.getState().setSelectedCoupons(["c1", "c2", "c3", "c4", "c5"])
      useGameStore.getState().setSelectedCoupons(["c5", "c4", "c3", "c2", "c1"])

      expect(useGameStore.getState().selectedCoupons).toEqual(["c5", "c4", "c3", "c2", "c1"])
    })
  })

  describe("Trajectory Management", () => {
    it("should set trajectory", () => {
      useGameStore.getState().setTrajectory(mockTrajectory)

      expect(useGameStore.getState().trajectory).toEqual(mockTrajectory)
    })

    it("should clear trajectory", () => {
      useGameStore.getState().setTrajectory(mockTrajectory)
      useGameStore.getState().clearTrajectory()

      expect(useGameStore.getState().trajectory).toEqual([])
    })

    it("should handle empty trajectory", () => {
      useGameStore.getState().setTrajectory([])

      expect(useGameStore.getState().trajectory).toEqual([])
    })

    it("should replace trajectory", () => {
      useGameStore.getState().setTrajectory(mockTrajectory)
      
      const newTrajectory: BallState[] = [
        {
          position: { x: 10, y: 10, z: 0 },
          velocity: { x: 5, y: 5, z: 0 },
          acceleration: { x: 0, y: -9.81, z: 0 },
          spin: 0,
          time: 1,
          isRolling: true,
        },
      ]
      
      useGameStore.getState().setTrajectory(newTrajectory)

      expect(useGameStore.getState().trajectory).toEqual(newTrajectory)
    })
  })

  describe("Game Results Management", () => {
    it("should set win result with coupon", () => {
      useGameStore.getState().setGameResult("win", mockAwardedCoupon)

      expect(useGameStore.getState().gameResult).toBe("win")
      expect(useGameStore.getState().awardedCoupon).toEqual(mockAwardedCoupon)
    })

    it("should set lose result without coupon", () => {
      useGameStore.getState().setGameResult("lose")

      expect(useGameStore.getState().gameResult).toBe("lose")
      expect(useGameStore.getState().awardedCoupon).toBeUndefined()
    })

    it("should clear results", () => {
      useGameStore.getState().setGameResult("win", mockAwardedCoupon)
      useGameStore.getState().clearResult()

      expect(useGameStore.getState().gameResult).toBeNull()
      expect(useGameStore.getState().awardedCoupon).toBeNull()
    })
  })

  describe("UI State Management", () => {
    it("should toggle tutorial visibility", () => {
      expect(useGameStore.getState().showTutorial).toBe(false)

      useGameStore.getState().setShowTutorial(true)
      expect(useGameStore.getState().showTutorial).toBe(true)

      useGameStore.getState().setShowTutorial(false)
      expect(useGameStore.getState().showTutorial).toBe(false)
    })

    it("should toggle loading state", () => {
      expect(useGameStore.getState().isLoading).toBe(false)

      useGameStore.getState().setIsLoading(true)
      expect(useGameStore.getState().isLoading).toBe(true)

      useGameStore.getState().setIsLoading(false)
      expect(useGameStore.getState().isLoading).toBe(false)
    })

    it("should set and clear error", () => {
      const errorMessage = "Something went wrong"

      useGameStore.getState().setError(errorMessage)
      expect(useGameStore.getState().error).toBe(errorMessage)

      useGameStore.getState().setError(null)
      expect(useGameStore.getState().error).toBeNull()
    })

    it("should handle multiple error messages", () => {
      useGameStore.getState().setError("Error 1")
      expect(useGameStore.getState().error).toBe("Error 1")

      useGameStore.getState().setError("Error 2")
      expect(useGameStore.getState().error).toBe("Error 2")
    })
  })

  describe("Settings Management", () => {
    it("should toggle sound", () => {
      expect(useGameStore.getState().soundEnabled).toBe(true)

      useGameStore.getState().setSoundEnabled(false)
      expect(useGameStore.getState().soundEnabled).toBe(false)

      useGameStore.getState().setSoundEnabled(true)
      expect(useGameStore.getState().soundEnabled).toBe(true)
    })

    it("should toggle reduced motion", () => {
      expect(useGameStore.getState().reducedMotion).toBe(false)

      useGameStore.getState().setReducedMotion(true)
      expect(useGameStore.getState().reducedMotion).toBe(true)

      useGameStore.getState().setReducedMotion(false)
      expect(useGameStore.getState().reducedMotion).toBe(false)
    })
  })

  describe("Reset Game", () => {
    it("should reset game to initial state", () => {
      // Set some state
      useGameStore.getState().setGameState("playing")
      useGameStore.getState().setSession("session_123", 12345)
      useGameStore.getState().setSelectedCoupons(["c1", "c2", "c3", "c4", "c5"])
      useGameStore.getState().setTrajectory(mockTrajectory)
      useGameStore.getState().setGameResult("win", mockAwardedCoupon)
      useGameStore.getState().setError("Some error")

      // Reset
      useGameStore.getState().resetGame()

      // Verify reset
      const state = useGameStore.getState()
      expect(state.gameState).toBe("selecting")
      expect(state.sessionId).toBeNull()
      expect(state.sessionSeed).toBeNull()
      expect(state.selectedCoupons).toEqual([])
      expect(state.trajectory).toEqual([])
      expect(state.gameResult).toBeNull()
      expect(state.awardedCoupon).toBeNull()
      expect(state.error).toBeNull()
    })

    it("should preserve settings on reset", () => {
      // Change settings
      useGameStore.getState().setSoundEnabled(false)
      useGameStore.getState().setReducedMotion(true)

      // Reset game
      useGameStore.getState().resetGame()

      // Settings should be preserved
      expect(useGameStore.getState().soundEnabled).toBe(false)
      expect(useGameStore.getState().reducedMotion).toBe(true)
    })

    it("should preserve available coupons on reset", () => {
      useGameStore.getState().setAvailableCoupons(mockCoupons)

      useGameStore.getState().resetGame()

      expect(useGameStore.getState().availableCoupons).toEqual(mockCoupons)
    })
  })

  describe("Complete Game Flow", () => {
    it("should handle complete game lifecycle", () => {
      // 1. Start - selecting coupons
      expect(useGameStore.getState().gameState).toBe("selecting")
      useGameStore.getState().setAvailableCoupons(mockCoupons)
      useGameStore.getState().setSelectedCoupons(["c1", "c2", "c3", "c4", "c5"])

      // 2. Create session
      useGameStore.getState().setSession("session_abc", 54321)
      useGameStore.getState().setGameState("playing")

      expect(useGameStore.getState().gameState).toBe("playing")
      expect(useGameStore.getState().sessionId).toBe("session_abc")

      // 3. Take shot - animating
      useGameStore.getState().setGameState("animating")
      useGameStore.getState().setTrajectory(mockTrajectory)

      expect(useGameStore.getState().gameState).toBe("animating")
      expect(useGameStore.getState().trajectory.length).toBeGreaterThan(0)

      // 4. Show result
      useGameStore.getState().setGameState("result")
      useGameStore.getState().setGameResult("win", mockAwardedCoupon)

      expect(useGameStore.getState().gameState).toBe("result")
      expect(useGameStore.getState().gameResult).toBe("win")
      expect(useGameStore.getState().awardedCoupon).toBeDefined()

      // 5. Play again
      useGameStore.getState().resetGame()

      expect(useGameStore.getState().gameState).toBe("selecting")
      expect(useGameStore.getState().sessionId).toBeNull()
    })
  })

  describe("Edge Cases", () => {
    it("should handle rapid state changes", () => {
      const states: GameState[] = [
        "selecting",
        "playing",
        "animating",
        "result",
        "selecting",
      ]

      states.forEach((state) => {
        useGameStore.getState().setGameState(state)
      })

      expect(useGameStore.getState().gameState).toBe("selecting")
    })

    it("should handle setting null explicitly", () => {
      useGameStore.getState().setError("Error")
      useGameStore.getState().setError(null)

      expect(useGameStore.getState().error).toBeNull()
    })

    it("should handle very long error messages", () => {
      const longError = "Error: " + "x".repeat(1000)
      useGameStore.getState().setError(longError)

      expect(useGameStore.getState().error).toBe(longError)
    })

    it("should handle empty string error", () => {
      useGameStore.getState().setError("")

      expect(useGameStore.getState().error).toBe("")
    })
  })

  describe("Concurrent Operations", () => {
    it("should handle multiple rapid updates", () => {
      for (let i = 0; i < 100; i++) {
        useGameStore.getState().setIsLoading(i % 2 === 0)
      }

      expect(useGameStore.getState().isLoading).toBe(false)
    })

    it("should maintain state consistency during rapid changes", () => {
      const sessionId = "rapid_session"
      const seed = 99999

      useGameStore.getState().setSession(sessionId, seed)
      useGameStore.getState().setGameState("playing")
      useGameStore.getState().setIsLoading(true)

      expect(useGameStore.getState().sessionId).toBe(sessionId)
      expect(useGameStore.getState().sessionSeed).toBe(seed)
      expect(useGameStore.getState().gameState).toBe("playing")
      expect(useGameStore.getState().isLoading).toBe(true)
    })
  })

  describe("State Isolation", () => {
    it("should not affect other state when updating one property", () => {
      // Set initial state
      useGameStore.getState().setSession("session_1", 111)
      useGameStore.getState().setGameState("playing")
      useGameStore.getState().setIsLoading(false)

      // Update one property
      useGameStore.getState().setError("Test error")

      // Others should remain unchanged
      expect(useGameStore.getState().sessionId).toBe("session_1")
      expect(useGameStore.getState().gameState).toBe("playing")
      expect(useGameStore.getState().isLoading).toBe(false)
    })
  })
})
