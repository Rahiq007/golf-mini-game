"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import type { Coupon } from "@/app/api/mock/coupons/route"

interface CouponPickerProps {
  coupons: Coupon[]
  selectedCoupons: string[]
  onSelectionChange: (couponIds: string[]) => void
  onConfirm: () => void
  disabled?: boolean
  className?: string
}

export default function CouponPicker({
  coupons,
  selectedCoupons,
  onSelectionChange,
  onConfirm,
  disabled = false,
  className = "",
}: CouponPickerProps) {
  const [localSelection, setLocalSelection] = useState<string[]>(selectedCoupons)

  useEffect(() => {
    setLocalSelection(selectedCoupons)
  }, [selectedCoupons])

  const handleCouponToggle = (couponId: string) => {
    if (disabled) return

    const newSelection = localSelection.includes(couponId)
      ? localSelection.filter((id) => id !== couponId)
      : [...localSelection, couponId]

    setLocalSelection(newSelection)
    onSelectionChange(newSelection)
  }

  const getCouponTypeColor = (type: string) => {
    switch (type) {
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

  const formatCouponValue = (coupon: Coupon) => {
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
    <Card className={`p-6 ${className}`}>
      <div className="space-y-6">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Choose Your Prize Pool</h2>
          <p className="text-gray-600">Select exactly 5 coupons. Win one with a perfect shot!</p>
          <div className="mt-2">
            <Badge variant={localSelection.length === 5 ? "default" : "secondary"}>
              {localSelection.length}/5 selected
            </Badge>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {coupons.map((coupon) => {
            const isSelected = localSelection.includes(coupon.id)
            const canSelect = localSelection.length < 5 || isSelected

            return (
              <div
                key={coupon.id}
                className={`relative p-4 rounded-lg border-2 cursor-pointer transition-all duration-200 ${
                  isSelected
                    ? "border-green-500 bg-green-50 shadow-md scale-105"
                    : canSelect
                      ? "border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm"
                      : "border-gray-100 bg-gray-50 opacity-50 cursor-not-allowed"
                } ${disabled ? "cursor-not-allowed opacity-50" : ""}`}
                onClick={() => canSelect && handleCouponToggle(coupon.id)}
              >
                {isSelected && (
                  <div className="absolute -top-2 -right-2 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                    <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                )}

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Badge className={getCouponTypeColor(coupon.type)}>{coupon.type.toUpperCase()}</Badge>
                    <div className="text-lg font-bold text-gray-900">{formatCouponValue(coupon)}</div>
                  </div>

                  <div>
                    <h3 className="font-semibold text-gray-900 mb-1">{coupon.title}</h3>
                    <p className="text-sm text-gray-600">{coupon.description}</p>
                  </div>

                  {coupon.metadata.minPurchase && (
                    <div className="text-xs text-gray-500">Min. purchase: ${coupon.metadata.minPurchase}</div>
                  )}

                  <div className="text-xs text-gray-400">Expires: {coupon.expiry}</div>
                </div>
              </div>
            )
          })}
        </div>

        <div className="text-center">
          <Button
            onClick={onConfirm}
            disabled={disabled || localSelection.length !== 5}
            size="lg"
            className="bg-green-600 hover:bg-green-700 text-white font-semibold px-8 py-3"
          >
            {localSelection.length !== 5
              ? `Select ${5 - localSelection.length} more coupon${5 - localSelection.length !== 1 ? "s" : ""}`
              : "Start Game"}
          </Button>
        </div>
      </div>
    </Card>
  )
}
