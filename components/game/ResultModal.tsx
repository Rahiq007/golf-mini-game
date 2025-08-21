"use client"

import { useEffect, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import type { AwardedCoupon } from "@/lib/api/types"

interface ResultModalProps {
  isOpen: boolean
  result: "win" | "lose"
  awardedCoupon?: AwardedCoupon
  onClose: () => void
  onAddToWallet?: (coupon: AwardedCoupon) => void
  onPlayAgain: () => void
  className?: string
}

export default function ResultModal({
  isOpen,
  result,
  awardedCoupon,
  onClose,
  onAddToWallet,
  onPlayAgain,
  className = "",
}: ResultModalProps) {
  const [showConfetti, setShowConfetti] = useState(false)
  const [couponCopied, setCouponCopied] = useState(false)

  useEffect(() => {
    if (isOpen && result === "win") {
      setShowConfetti(true)
      const timer = setTimeout(() => setShowConfetti(false), 3000)
      return () => clearTimeout(timer)
    }
  }, [isOpen, result])

  const handleCopyCode = async () => {
    if (!awardedCoupon) return

    try {
      await navigator.clipboard.writeText(awardedCoupon.code)
      setCouponCopied(true)
      setTimeout(() => setCouponCopied(false), 2000)
    } catch (err) {
      console.error("Failed to copy coupon code:", err)
    }
  }

  const handleAddToWallet = () => {
    if (awardedCoupon && onAddToWallet) {
      onAddToWallet(awardedCoupon)
    }
  }

  const formatCouponValue = (coupon: AwardedCoupon) => {
    switch (coupon.type) {
      case "percentage":
        return `${coupon.value}% OFF`
      case "fixed":
        return `$${coupon.value} OFF`
      case "shipping":
        return "FREE SHIPPING"
      case "bogo":
        return "BUY 1 GET 1"
      default:
        return "SPECIAL OFFER"
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            transition={{ type: "spring", duration: 0.5 }}
            onClick={(e) => e.stopPropagation()}
            className={`relative ${className}`}
          >
            <Card className="p-8 max-w-md w-full mx-auto">
              {/* Confetti Effect */}
              {showConfetti && result === "win" && (
                <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-lg">
                  {[...Array(20)].map((_, i) => (
                    <motion.div
                      key={i}
                      className="absolute w-2 h-2 bg-yellow-400 rounded-full"
                      initial={{
                        x: "50%",
                        y: "50%",
                        scale: 0,
                      }}
                      animate={{
                        x: `${50 + (Math.random() - 0.5) * 200}%`,
                        y: `${50 + (Math.random() - 0.5) * 200}%`,
                        scale: [0, 1, 0],
                        rotate: 360,
                      }}
                      transition={{
                        duration: 2,
                        delay: i * 0.1,
                        ease: "easeOut",
                      }}
                    />
                  ))}
                </div>
              )}

              <div className="text-center space-y-6">
                {/* Result Header */}
                <div>
                  {result === "win" ? (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: 0.2, type: "spring" }}
                    >
                      <div className="text-6xl mb-4">🏆</div>
                      <h2 className="text-3xl font-bold text-green-600 mb-2">Hole in One!</h2>
                      <p className="text-gray-600">Congratulations! You won a coupon!</p>
                    </motion.div>
                  ) : (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: 0.2, type: "spring" }}
                    >
                      <div className="text-6xl mb-4">⛳</div>
                      <h2 className="text-3xl font-bold text-gray-600 mb-2">So Close!</h2>
                      <p className="text-gray-600">Better luck next time. Practice makes perfect!</p>
                    </motion.div>
                  )}
                </div>

                {/* Coupon Display */}
                {result === "win" && awardedCoupon && (
                  <motion.div
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.4 }}
                    className="bg-gradient-to-r from-green-50 to-blue-50 p-6 rounded-lg border-2 border-green-200"
                  >
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <Badge className="bg-green-100 text-green-800 border-green-200">
                          {awardedCoupon.type.toUpperCase()}
                        </Badge>
                        <div className="text-2xl font-bold text-green-600">{formatCouponValue(awardedCoupon)}</div>
                      </div>

                      <div>
                        <h3 className="font-bold text-gray-900 mb-1">{awardedCoupon.title}</h3>
                        <p className="text-sm text-gray-600">{awardedCoupon.description}</p>
                      </div>

                      <div className="bg-white p-3 rounded border border-dashed border-gray-300">
                        <div className="text-xs text-gray-500 mb-1">Coupon Code:</div>
                        <div className="font-mono text-lg font-bold text-gray-900">{awardedCoupon.code}</div>
                      </div>

                      <div className="flex gap-2">
                        <Button
                          onClick={handleCopyCode}
                          variant="outline"
                          size="sm"
                          className="flex-1 bg-transparent"
                          disabled={couponCopied}
                        >
                          {couponCopied ? "Copied!" : "Copy Code"}
                        </Button>
                        <Button
                          onClick={handleAddToWallet}
                          size="sm"
                          className="flex-1 bg-green-600 hover:bg-green-700"
                        >
                          Add to Wallet
                        </Button>
                      </div>

                      <div className="text-xs text-gray-400">Expires: {awardedCoupon.expiry}</div>
                    </div>
                  </motion.div>
                )}

                {/* Action Buttons */}
                <div className="flex gap-3">
                  <Button onClick={onClose} variant="outline" className="flex-1 bg-transparent">
                    Close
                  </Button>
                  <Button onClick={onPlayAgain} className="flex-1 bg-blue-600 hover:bg-blue-700">
                    Play Again
                  </Button>
                </div>
              </div>
            </Card>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
