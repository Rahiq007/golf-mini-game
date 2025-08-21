"use client"

import { useEffect, useState } from "react"
import { useGameStore } from "@/lib/store/gameStore"
import { createSimulator } from "@/lib/physics"
import GameCanvas from "@/components/game/GameCanvas"
import GameControls from "@/components/game/GameControls"
import CouponPicker from "@/components/game/CouponPicker"
import ResultModal from "@/components/game/ResultModal"
import TutorialOverlay from "@/components/game/TutorialOverlay"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import type { Coupon } from "@/app/api/mock/coupons/route"
import type { ApiResponse, SessionCreateResponse, PlayResponse } from "@/lib/api/types"

export default function PlayGolfPage() {
  const {
    gameState,
    setGameState,
    sessionId,
    setSession,
    availableCoupons,
    selectedCoupons,
    setAvailableCoupons,
    setSelectedCoupons,
    trajectory,
    setTrajectory,
    gameResult,
    awardedCoupon,
    setGameResult,
    showTutorial,
    setShowTutorial,
    isLoading,
    setIsLoading,
    error,
    setError,
    resetGame,
  } = useGameStore()

  const [simulator] = useState(() => createSimulator())

  // Load coupons on mount
  useEffect(() => {
    const loadCoupons = async () => {
      try {
        setIsLoading(true)
        const response = await fetch("/api/mock/coupons")
        const data: ApiResponse<{ coupons: Coupon[] }> = await response.json()

        if (data.success && data.data) {
          setAvailableCoupons(data.data.coupons)
          // Pre-select all coupons for demo
          setSelectedCoupons(data.data.coupons.map((c) => c.id))
        } else {
          setError("Failed to load coupons")
        }
      } catch (err) {
        setError("Failed to load coupons")
        console.error("Error loading coupons:", err)
      } finally {
        setIsLoading(false)
      }
    }

    loadCoupons()
  }, [setAvailableCoupons, setSelectedCoupons, setIsLoading, setError])

  // Show tutorial for new users
  useEffect(() => {
    const hasSeenTutorial = localStorage.getItem("golf-game-tutorial-seen")
    if (!hasSeenTutorial) {
      setShowTutorial(true)
    }
  }, [setShowTutorial])

  const handleTutorialClose = () => {
    setShowTutorial(false)
    localStorage.setItem("golf-game-tutorial-seen", "true")
  }

  const handleStartGame = async () => {
    if (selectedCoupons.length !== 5) {
      setError("Please select exactly 5 coupons")
      return
    }

    try {
      setIsLoading(true)
      setError(null)

      const response = await fetch("/api/mock/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          couponIds: selectedCoupons,
          clientInfo: {
            userAgent: navigator.userAgent,
            timestamp: Date.now(),
          },
        }),
      })

      const data: ApiResponse<SessionCreateResponse> = await response.json()

      if (data.success && data.data) {
        setSession(data.data.sessionId, data.data.seed)
        setGameState("playing")
      } else {
        setError(data.error || "Failed to create game session")
      }
    } catch (err) {
      setError("Failed to start game")
      console.error("Error starting game:", err)
    } finally {
      setIsLoading(false)
    }
  }

  const handleShoot = async (angle: number, power: number) => {
    if (!sessionId) {
      setError("No active session")
      return
    }

    try {
      setIsLoading(true)
      setError(null)
      setGameState("animating")

      // Run local simulation for immediate visual feedback
      const localResult = simulator.simulate({
        angle,
        power,
        seed: useGameStore.getState().sessionSeed || 0,
      })

      setTrajectory(localResult.trajectory)
      
      // Calculate precise animation timing
      const framesPerSecond = 60
      const frameDuration = 1000 / framesPerSecond // milliseconds per frame
      const totalFrames = localResult.trajectory.length
      const baseAnimationDuration = totalFrames * frameDuration
      
      // Check if ball will go in hole for extra drop animation time
      // Trust the physics simulator's strict win detection
      const willWin = localResult.outcome === 'win'
      
      // Log the outcome for debugging
      if (willWin) {
        console.log('[GAME] Ball will WIN - dropped into hole')
      } else {
        console.log('[GAME] Ball will LOSE - did not enter hole')
      }
      
      // Add extra time for ball to roll, settle, and drop into hole if winning
      const ballSettleTime = willWin ? 1200 : 800 // More time if ball drops in hole
      const visualBufferTime = 200 // Small buffer for visual smoothness
      const totalAnimationTime = baseAnimationDuration + ballSettleTime + visualBufferTime
      
      console.log('[GAME] Animation timing:', {
        trajectoryFrames: totalFrames,
        baseAnimationMs: baseAnimationDuration,
        settleTimeMs: ballSettleTime,
        totalTimeMs: totalAnimationTime,
        finalPosition: localResult.trajectory[localResult.trajectory.length - 1]?.position
      })

      // Send to server for verification
      const response = await fetch("/api/mock/play", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId,
          input: {
            angle,
            power,
            timestamp: Date.now(),
          },
        }),
      })

      const data: ApiResponse<PlayResponse> = await response.json()

      if (data.success && data.data) {
        // Store the result data for later use
        const resultData = data.data
        
        console.log('[GAME] Shot result:', {
          outcome: resultData.outcome,
          willShowResultAt: Date.now() + totalAnimationTime,
          animationDurationMs: totalAnimationTime
        })
        
        // Set a precise timer to show the result after animation completes
        setTimeout(
          () => {
            console.log('[GAME] Showing result modal now')
            setGameResult(resultData.outcome, resultData.awardedCoupon)
            setGameState("result")
          },
          totalAnimationTime,
        )
      } else {
        setError(data.error || "Failed to process shot")
        setGameState("playing")
      }
    } catch (err) {
      setError("Failed to process shot")
      setGameState("playing")
      console.error("Error processing shot:", err)
    } finally {
      setIsLoading(false)
    }
  }

  const handleAnimationComplete = () => {
    // Animation completed, result will be shown by the timeout in handleShoot
  }

  const handleAddToWallet = (coupon: any) => {
    // Add to localStorage wallet
    const existingWallet = JSON.parse(localStorage.getItem("golf-wallet") || "[]")
    existingWallet.push({
      coupon,
      used: false,
      addedAt: new Date().toISOString(),
    })
    localStorage.setItem("golf-wallet", JSON.stringify(existingWallet))
  }

  const handlePlayAgain = () => {
    resetGame()
  }

  const handleResultClose = () => {
    setGameState("playing")
  }

  if (isLoading && availableCoupons.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-sky-400 to-green-400 flex items-center justify-center">
        <Card className="p-8 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <div className="text-lg font-semibold">Loading Golf Game...</div>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-sky-400 to-green-400">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <header className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Golf Mini-Game</h1>
          <p className="text-white/90 text-lg">One shot to win amazing coupons!</p>
          <div className="flex justify-center items-center gap-4 mt-4">
            <Badge variant="secondary" className="bg-white/20 text-white">
              {gameState === "selecting" && "Select Coupons"}
              {gameState === "playing" && "Ready to Play"}
              {gameState === "animating" && "Ball in Motion"}
              {gameState === "result" && "Game Complete"}
            </Badge>
            <Link href="/wallet">
              <Button variant="outline" size="sm" className="bg-white/10 border-white/20 text-white hover:bg-white/20">
                View Wallet
              </Button>
            </Link>
            <Button
              onClick={() => setShowTutorial(true)}
              variant="outline"
              size="sm"
              className="bg-white/10 border-white/20 text-white hover:bg-white/20"
            >
              Tutorial
            </Button>
          </div>
        </header>

        {/* Error Display */}
        {error && (
          <Card className="mb-6 p-4 bg-red-50 border-red-200">
            <div className="text-red-600 text-center">{error}</div>
            <Button onClick={() => setError(null)} variant="ghost" size="sm" className="w-full mt-2">
              Dismiss
            </Button>
          </Card>
        )}

        {/* Game Content */}
        {gameState === "selecting" && (
          <CouponPicker
            coupons={availableCoupons}
            selectedCoupons={selectedCoupons}
            onSelectionChange={setSelectedCoupons}
            onConfirm={handleStartGame}
            disabled={isLoading}
          />
        )}

        {(gameState === "playing" || gameState === "animating") && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Game Canvas */}
            <div className="lg:col-span-2">
              <GameCanvas
                trajectory={gameState === "animating" ? trajectory : undefined}
                isAnimating={gameState === "animating"}
                onAnimationComplete={handleAnimationComplete}
                className="h-96 lg:h-[500px]"
              />
            </div>

            {/* Game Controls */}
            <div className="space-y-4">
              <GameControls onShoot={handleShoot} disabled={gameState === "animating" || isLoading} />

              {/* Session Info */}
              <Card className="p-4">
                <h3 className="font-semibold mb-2">Selected Coupons</h3>
                <div className="space-y-1">
                  {selectedCoupons.map((couponId) => {
                    const coupon = availableCoupons.find((c) => c.id === couponId)
                    return (
                      <div key={couponId} className="text-sm text-gray-600">
                        {coupon?.title || couponId}
                      </div>
                    )
                  })}
                </div>
                <Button
                  onClick={() => setGameState("selecting")}
                  variant="outline"
                  size="sm"
                  className="w-full mt-3"
                  disabled={gameState === "animating"}
                >
                  Change Selection
                </Button>
              </Card>
            </div>
          </div>
        )}

        {/* Tutorial Overlay */}
        <TutorialOverlay isOpen={showTutorial} onClose={handleTutorialClose} onSkip={handleTutorialClose} />

        {/* Result Modal */}
        <ResultModal
          isOpen={gameState === "result"}
          result={gameResult || "lose"}
          awardedCoupon={awardedCoupon || undefined}
          onClose={handleResultClose}
          onAddToWallet={handleAddToWallet}
          onPlayAgain={handlePlayAgain}
        />
      </div>
    </div>
  )
}
