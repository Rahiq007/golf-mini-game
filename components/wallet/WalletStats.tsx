"use client"

import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import type { WalletStatsType } from "@/lib/wallet/walletManager"

interface WalletStatsProps {
  stats: WalletStatsType
  className?: string
}

export default function WalletStatsComponent({ stats, className = "" }: WalletStatsProps) {
  const { totalCoupons, usedCoupons, expiredCoupons, activeCoupons, totalSavings } = stats

  const usageRate = totalCoupons > 0 ? Math.round((usedCoupons / totalCoupons) * 100) : 0

  return (
    <Card className={`p-6 ${className}`}>
      <div className="space-y-6">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Wallet Overview</h2>
          <p className="text-gray-600">Your coupon collection and savings</p>
        </div>

        {/* Main Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <div className="text-2xl font-bold text-blue-600">{totalCoupons}</div>
            <div className="text-sm text-blue-700">Total Coupons</div>
          </div>

          <div className="text-center p-4 bg-green-50 rounded-lg">
            <div className="text-2xl font-bold text-green-600">{activeCoupons}</div>
            <div className="text-sm text-green-700">Active</div>
          </div>

          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <div className="text-2xl font-bold text-gray-600">{usedCoupons}</div>
            <div className="text-sm text-gray-700">Used</div>
          </div>

          <div className="text-center p-4 bg-red-50 rounded-lg">
            <div className="text-2xl font-bold text-red-600">{expiredCoupons}</div>
            <div className="text-sm text-red-700">Expired</div>
          </div>
        </div>

        {/* Savings and Usage Rate */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="text-center p-4 bg-gradient-to-r from-green-50 to-blue-50 rounded-lg">
            <div className="text-3xl font-bold text-green-600">${totalSavings.toFixed(2)}</div>
            <div className="text-sm text-gray-700">Total Savings</div>
            <div className="text-xs text-gray-500 mt-1">From used coupons</div>
          </div>

          <div className="text-center p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg">
            <div className="text-3xl font-bold text-purple-600">{usageRate}%</div>
            <div className="text-sm text-gray-700">Usage Rate</div>
            <div className="text-xs text-gray-500 mt-1">Coupons used vs collected</div>
          </div>
        </div>

        {/* Status Badges */}
        <div className="flex flex-wrap justify-center gap-2">
          {activeCoupons > 0 && <Badge className="bg-green-100 text-green-700">{activeCoupons} Ready to Use</Badge>}
          {expiredCoupons > 0 && <Badge className="bg-red-100 text-red-700">{expiredCoupons} Expired</Badge>}
          {usageRate >= 80 && <Badge className="bg-purple-100 text-purple-700">High Usage Rate!</Badge>}
          {totalSavings > 50 && <Badge className="bg-yellow-100 text-yellow-700">Great Saver!</Badge>}
        </div>

        {/* Tips */}
        {activeCoupons === 0 && totalCoupons > 0 && (
          <div className="text-center p-4 bg-yellow-50 rounded-lg border border-yellow-200">
            <div className="text-yellow-800 font-medium">No active coupons</div>
            <div className="text-yellow-700 text-sm mt-1">Play more games to win new coupons!</div>
          </div>
        )}

        {expiredCoupons > 0 && (
          <div className="text-center p-4 bg-red-50 rounded-lg border border-red-200">
            <div className="text-red-800 font-medium">You have expired coupons</div>
            <div className="text-red-700 text-sm mt-1">Consider cleaning up your wallet</div>
          </div>
        )}
      </div>
    </Card>
  )
}
