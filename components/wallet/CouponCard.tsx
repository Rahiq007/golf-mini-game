"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { WalletManager, type WalletCoupon } from "@/lib/wallet/walletManager"

interface CouponCardProps {
  walletCoupon: WalletCoupon
  onUpdate: () => void
  className?: string
}

export default function CouponCard({ walletCoupon, onUpdate, className = "" }: CouponCardProps) {
  const [copied, setCopied] = useState(false)
  const [showDetails, setShowDetails] = useState(false)

  const { coupon, used, usedAt, addedAt } = walletCoupon
  const isExpired = WalletManager.isExpired(coupon)
  const isExpiringSoon = WalletManager.isExpiringSoon(coupon)

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(coupon.code)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error("Failed to copy coupon code:", err)
    }
  }

  const handleMarkAsUsed = () => {
    if (WalletManager.markAsUsed(walletCoupon.id)) {
      onUpdate()
    }
  }

  const handleDelete = () => {
    if (confirm("Are you sure you want to delete this coupon?")) {
      if (WalletManager.deleteCoupon(walletCoupon.id)) {
        onUpdate()
      }
    }
  }

  const formatCouponValue = () => {
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

  const getCouponTypeColor = () => {
    if (used) return "bg-gray-100 text-gray-600 border-gray-200"
    if (isExpired) return "bg-red-100 text-red-600 border-red-200"
    if (isExpiringSoon) return "bg-yellow-100 text-yellow-700 border-yellow-200"

    switch (coupon.type) {
      case "percentage":
        return "bg-blue-100 text-blue-800 border-blue-200"
      case "fixed":
        return "bg-green-100 text-green-800 border-green-200"
      case "shipping":
        return "bg-purple-100 text-purple-800 border-purple-200"
      case "bogo":
        return "bg-orange-100 text-orange-800 border-orange-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  const getStatusBadge = () => {
    if (used) return <Badge className="bg-gray-100 text-gray-600">Used</Badge>
    if (isExpired) return <Badge className="bg-red-100 text-red-600">Expired</Badge>
    if (isExpiringSoon) return <Badge className="bg-yellow-100 text-yellow-700">Expires Soon</Badge>
    return <Badge className="bg-green-100 text-green-600">Active</Badge>
  }

  const canUse = !used && !isExpired

  return (
    <Card className={`p-4 ${used || isExpired ? "opacity-75" : ""} ${className}`}>
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <Badge className={getCouponTypeColor()}>{coupon.type.toUpperCase()}</Badge>
            {getStatusBadge()}
          </div>
          <div className="text-right">
            <div className="text-lg font-bold text-gray-900">{formatCouponValue()}</div>
            <div className="text-xs text-gray-500">Added {new Date(addedAt).toLocaleDateString()}</div>
          </div>
        </div>

        {/* Coupon Info */}
        <div>
          <h3 className="font-semibold text-gray-900 mb-1">{coupon.title}</h3>
          <p className="text-sm text-gray-600">{coupon.description}</p>
        </div>

        {/* Coupon Code */}
        <div className="bg-gray-50 p-3 rounded border border-dashed border-gray-300">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs text-gray-500 mb-1">Coupon Code:</div>
              <div className="font-mono text-sm font-bold text-gray-900">{coupon.code}</div>
            </div>
            <Button onClick={handleCopyCode} variant="outline" size="sm" disabled={copied} className="bg-transparent">
              {copied ? "Copied!" : "Copy"}
            </Button>
          </div>
        </div>

        {/* Expiry and Usage Info */}
        <div className="flex justify-between items-center text-xs text-gray-500">
          <div>
            Expires: {new Date(coupon.expiry).toLocaleDateString()}
            {coupon.metadata?.minPurchase && ` • Min: $${coupon.metadata.minPurchase}`}
          </div>
          {used && usedAt && <div>Used: {new Date(usedAt).toLocaleDateString()}</div>}
        </div>

        {/* Details Toggle */}
        {coupon.metadata && Object.keys(coupon.metadata).length > 0 && (
          <Button onClick={() => setShowDetails(!showDetails)} variant="ghost" size="sm" className="w-full text-xs">
            {showDetails ? "Hide Details" : "Show Details"}
          </Button>
        )}

        {/* Expanded Details */}
        {showDetails && coupon.metadata && (
          <div className="bg-blue-50 p-3 rounded text-xs">
            <div className="font-semibold mb-2">Terms & Conditions:</div>
            {Object.entries(coupon.metadata).map(([key, value]) => (
              <div key={key} className="flex justify-between">
                <span className="capitalize">{key.replace(/([A-Z])/g, " $1")}:</span>
                <span>{String(value)}</span>
              </div>
            ))}
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2">
          {canUse && (
            <>
              <Button onClick={handleMarkAsUsed} size="sm" className="flex-1 bg-green-600 hover:bg-green-700">
                Mark as Used
              </Button>
              <Button
                onClick={() => window.open(`https://example.com/checkout?coupon=${coupon.code}`, "_blank")}
                variant="outline"
                size="sm"
                className="flex-1 bg-transparent"
              >
                Use Now
              </Button>
            </>
          )}
          <Button
            onClick={handleDelete}
            variant="outline"
            size="sm"
            className="text-red-600 hover:text-red-700 bg-transparent"
          >
            Delete
          </Button>
        </div>
      </div>
    </Card>
  )
}
