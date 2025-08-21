import { create } from "zustand"
import type { BallState } from "@/lib/physics/types"
import type { Coupon } from "@/app/api/mock/coupons/route"
import type { AwardedCoupon } from "@/lib/api/types"

export type GameState = "selecting" | "playing" | "animating" | "result" | "cooldown"

interface GameStore {
  // Game state
  gameState: GameState
  setGameState: (state: GameState) => void

  // Session data
  sessionId: string | null
  sessionSeed: number | null
  setSession: (sessionId: string, seed: number) => void
  clearSession: () => void

  // Coupons
  availableCoupons: Coupon[]
  selectedCoupons: string[]
  setAvailableCoupons: (coupons: Coupon[]) => void
  setSelectedCoupons: (couponIds: string[]) => void

  // Game play
  trajectory: BallState[]
  setTrajectory: (trajectory: BallState[]) => void
  clearTrajectory: () => void

  // Results
  gameResult: "win" | "lose" | null
  awardedCoupon: AwardedCoupon | null
  setGameResult: (result: "win" | "lose", coupon?: AwardedCoupon) => void
  clearResult: () => void

  // UI state
  showTutorial: boolean
  setShowTutorial: (show: boolean) => void
  isLoading: boolean
  setIsLoading: (loading: boolean) => void
  error: string | null
  setError: (error: string | null) => void

  // Settings
  soundEnabled: boolean
  reducedMotion: boolean
  setSoundEnabled: (enabled: boolean) => void
  setReducedMotion: (reduced: boolean) => void

  // Actions
  resetGame: () => void
}

export const useGameStore = create<GameStore>((set, get) => ({
  // Initial state
  gameState: "selecting",
  sessionId: null,
  sessionSeed: null,
  availableCoupons: [],
  selectedCoupons: [],
  trajectory: [],
  gameResult: null,
  awardedCoupon: null,
  showTutorial: false,
  isLoading: false,
  error: null,
  soundEnabled: true,
  reducedMotion: false,

  // State setters
  setGameState: (state) => set({ gameState: state }),
  setSession: (sessionId, seed) => set({ sessionId, sessionSeed: seed }),
  clearSession: () => set({ sessionId: null, sessionSeed: null }),
  setAvailableCoupons: (coupons) => set({ availableCoupons: coupons }),
  setSelectedCoupons: (couponIds) => set({ selectedCoupons: couponIds }),
  setTrajectory: (trajectory) => set({ trajectory }),
  clearTrajectory: () => set({ trajectory: [] }),
  setGameResult: (result, coupon) => set({ gameResult: result, awardedCoupon: coupon }),
  clearResult: () => set({ gameResult: null, awardedCoupon: null }),
  setShowTutorial: (show) => set({ showTutorial: show }),
  setIsLoading: (loading) => set({ isLoading: loading }),
  setError: (error) => set({ error }),
  setSoundEnabled: (enabled) => set({ soundEnabled: enabled }),
  setReducedMotion: (reduced) => set({ reducedMotion: reduced }),

  // Reset game to initial state
  resetGame: () =>
    set({
      gameState: "selecting",
      sessionId: null,
      sessionSeed: null,
      selectedCoupons: [],
      trajectory: [],
      gameResult: null,
      awardedCoupon: null,
      error: null,
    }),
}))
