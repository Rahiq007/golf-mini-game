"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { WalletManager } from "@/lib/wallet/walletManager"
import Link from "next/link"

interface WalletButtonProps {
  className?: string
}

export default function WalletButton({ className = "" }: WalletButtonProps) {
  const [activeCoupons, setActiveCoupons] = useState(0)

  useEffect(() => {
    const updateCount = () => {
      const stats = WalletManager.getStats()
      setActiveCoupons(stats.activeCoupons)
    }

    updateCount()

    // Listen for storage changes to update count
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "golf-wallet") {
        updateCount()
      }
    }

    window.addEventListener("storage", handleStorageChange)
    return () => window.removeEventListener("storage", handleStorageChange)
  }, [])

  return (
    <Link href="/wallet">
      <Button variant="outline" size="sm" className={`relative ${className}`}>
        Wallet
        {activeCoupons > 0 && (
          <Badge className="ml-2 bg-green-100 text-green-700 text-xs px-1.5 py-0.5">{activeCoupons}</Badge>
        )}
      </Button>
    </Link>
  )
}
