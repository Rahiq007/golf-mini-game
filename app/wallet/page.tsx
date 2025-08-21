"use client"

import { useEffect, useState } from "react"
import { WalletManager, type WalletCoupon } from "@/lib/wallet/walletManager"
import CouponCard from "@/components/wallet/CouponCard"
import WalletStats from "@/components/wallet/WalletStats"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"

type FilterType = "all" | "active" | "used" | "expired" | "expiring"
type SortType = "newest" | "oldest" | "expiry" | "value"

export default function WalletPage() {
  const [coupons, setCoupons] = useState<WalletCoupon[]>([])
  const [filter, setFilter] = useState<FilterType>("all")
  const [sort, setSort] = useState<SortType>("newest")
  const [isLoading, setIsLoading] = useState(true)

  const loadCoupons = () => {
    setIsLoading(true)
    try {
      const walletCoupons = WalletManager.getCoupons()
      setCoupons(walletCoupons)
    } catch (error) {
      console.error("Failed to load wallet:", error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadCoupons()
  }, [])

  const filteredAndSortedCoupons = coupons
    .filter((wc) => {
      switch (filter) {
        case "active":
          return !wc.used && !WalletManager.isExpired(wc.coupon)
        case "used":
          return wc.used
        case "expired":
          return WalletManager.isExpired(wc.coupon)
        case "expiring":
          return !wc.used && WalletManager.isExpiringSoon(wc.coupon)
        default:
          return true
      }
    })
    .sort((a, b) => {
      switch (sort) {
        case "oldest":
          return new Date(a.addedAt).getTime() - new Date(b.addedAt).getTime()
        case "expiry":
          return new Date(a.coupon.expiry).getTime() - new Date(b.coupon.expiry).getTime()
        case "value":
          return b.coupon.value - a.coupon.value
        default: // newest
          return new Date(b.addedAt).getTime() - new Date(a.addedAt).getTime()
      }
    })

  const handleExportWallet = () => {
    const exportData = WalletManager.exportWallet()
    const blob = new Blob([exportData], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `golf-wallet-${new Date().toISOString().split("T")[0]}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const handleClearWallet = () => {
    if (confirm("Are you sure you want to clear your entire wallet? This action cannot be undone.")) {
      WalletManager.clearWallet()
      loadCoupons()
    }
  }

  const stats = WalletManager.getStats()

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="p-8 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <div className="text-lg font-semibold">Loading Wallet...</div>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <header className="mb-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-foreground mb-2">My Coupon Wallet</h1>
              <p className="text-muted-foreground">Manage your won coupons and track your savings</p>
            </div>
            <div className="flex gap-2">
              <Link href="/play-golf">
                <Button className="bg-green-600 hover:bg-green-700">Play Golf Game</Button>
              </Link>
              {coupons.length > 0 && (
                <>
                  <Button onClick={handleExportWallet} variant="outline">
                    Export Wallet
                  </Button>
                  <Button
                    onClick={handleClearWallet}
                    variant="outline"
                    className="text-red-600 hover:text-red-700 bg-transparent"
                  >
                    Clear All
                  </Button>
                </>
              )}
            </div>
          </div>
        </header>

        {coupons.length === 0 ? (
          /* Empty State */
          <Card className="p-12 text-center">
            <div className="space-y-4">
              <div className="text-6xl">🎯</div>
              <h2 className="text-2xl font-bold text-gray-900">No Coupons Yet</h2>
              <p className="text-gray-600 max-w-md mx-auto">
                Start playing the golf mini-game to win amazing coupons and build your collection!
              </p>
              <Link href="/play-golf">
                <Button size="lg" className="bg-green-600 hover:bg-green-700 mt-4">
                  Play Golf Game
                </Button>
              </Link>
            </div>
          </Card>
        ) : (
          <div className="space-y-8">
            {/* Wallet Stats */}
            <WalletStats stats={stats} />

            {/* Filters and Sorting */}
            <Card className="p-4">
              <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
                <div className="space-y-2">
                  <div className="text-sm font-medium text-gray-700">Filter by status:</div>
                  <div className="flex flex-wrap gap-2">
                    {[
                      { key: "all", label: "All", count: coupons.length },
                      {
                        key: "active",
                        label: "Active",
                        count: coupons.filter((c) => !c.used && !WalletManager.isExpired(c.coupon)).length,
                      },
                      { key: "used", label: "Used", count: coupons.filter((c) => c.used).length },
                      {
                        key: "expired",
                        label: "Expired",
                        count: coupons.filter((c) => WalletManager.isExpired(c.coupon)).length,
                      },
                      {
                        key: "expiring",
                        label: "Expiring Soon",
                        count: coupons.filter((c) => !c.used && WalletManager.isExpiringSoon(c.coupon)).length,
                      },
                    ].map(({ key, label, count }) => (
                      <Button
                        key={key}
                        onClick={() => setFilter(key as FilterType)}
                        variant={filter === key ? "default" : "outline"}
                        size="sm"
                        className="bg-transparent"
                      >
                        {label} <Badge className="ml-1">{count}</Badge>
                      </Button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="text-sm font-medium text-gray-700">Sort by:</div>
                  <select
                    value={sort}
                    onChange={(e) => setSort(e.target.value as SortType)}
                    className="px-3 py-1 border border-gray-300 rounded-md text-sm bg-white"
                  >
                    <option value="newest">Newest First</option>
                    <option value="oldest">Oldest First</option>
                    <option value="expiry">Expiry Date</option>
                    <option value="value">Highest Value</option>
                  </select>
                </div>
              </div>
            </Card>

            {/* Coupons Grid */}
            {filteredAndSortedCoupons.length === 0 ? (
              <Card className="p-8 text-center">
                <div className="text-gray-500">No coupons match your current filter.</div>
                <Button onClick={() => setFilter("all")} variant="outline" size="sm" className="mt-2 bg-transparent">
                  Show All Coupons
                </Button>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredAndSortedCoupons.map((walletCoupon) => (
                  <CouponCard key={walletCoupon.id} walletCoupon={walletCoupon} onUpdate={loadCoupons} />
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
