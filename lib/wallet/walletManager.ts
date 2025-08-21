import type { AwardedCoupon } from "@/lib/api/types"

export interface WalletCoupon {
  coupon: AwardedCoupon
  used: boolean
  usedAt?: string
  addedAt: string
  id: string
}

export interface WalletStats {
  totalCoupons: number
  usedCoupons: number
  expiredCoupons: number
  activeCoupons: number
  totalSavings: number
}

export class WalletManager {
  private static readonly STORAGE_KEY = "golf-wallet"
  private static readonly USAGE_KEY = "golf-wallet-usage"

  static getCoupons(): WalletCoupon[] {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY)
      return stored ? JSON.parse(stored) : []
    } catch (error) {
      console.error("Failed to load wallet coupons:", error)
      return []
    }
  }

  static addCoupon(coupon: AwardedCoupon): WalletCoupon {
    const walletCoupon: WalletCoupon = {
      coupon,
      used: false,
      addedAt: new Date().toISOString(),
      id: `wallet_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    }

    const coupons = this.getCoupons()
    coupons.push(walletCoupon)
    this.saveCoupons(coupons)

    return walletCoupon
  }

  static markAsUsed(couponId: string): boolean {
    const coupons = this.getCoupons()
    const coupon = coupons.find((c) => c.id === couponId)

    if (!coupon || coupon.used) {
      return false
    }

    coupon.used = true
    coupon.usedAt = new Date().toISOString()
    this.saveCoupons(coupons)

    // Track usage statistics
    this.trackUsage(coupon.coupon)

    return true
  }

  static deleteCoupon(couponId: string): boolean {
    const coupons = this.getCoupons()
    const filteredCoupons = coupons.filter((c) => c.id !== couponId)

    if (filteredCoupons.length === coupons.length) {
      return false // Coupon not found
    }

    this.saveCoupons(filteredCoupons)
    return true
  }

  static getStats(): WalletStats {
    const coupons = this.getCoupons()
    const now = new Date()

    let totalSavings = 0
    let expiredCount = 0
    let usedCount = 0

    coupons.forEach((walletCoupon) => {
      const { coupon, used } = walletCoupon

      // Check if expired
      if (new Date(coupon.expiry) < now) {
        expiredCount++
      }

      // Count used coupons
      if (used) {
        usedCount++
        // Calculate savings for used coupons
        if (coupon.type === "fixed") {
          totalSavings += coupon.value
        } else if (coupon.type === "percentage") {
          // Estimate savings based on average order value
          const estimatedOrderValue = coupon.metadata?.minPurchase || 50
          totalSavings += (estimatedOrderValue * coupon.value) / 100
        }
      }
    })

    return {
      totalCoupons: coupons.length,
      usedCoupons: usedCount,
      expiredCoupons: expiredCount,
      activeCoupons: coupons.length - usedCount - expiredCount,
      totalSavings,
    }
  }

  static isExpired(coupon: AwardedCoupon): boolean {
    return new Date(coupon.expiry) < new Date()
  }

  static isExpiringSoon(coupon: AwardedCoupon, daysThreshold = 7): boolean {
    const expiryDate = new Date(coupon.expiry)
    const thresholdDate = new Date()
    thresholdDate.setDate(thresholdDate.getDate() + daysThreshold)
    return expiryDate <= thresholdDate && expiryDate >= new Date()
  }

  static exportWallet(): string {
    const coupons = this.getCoupons()
    const exportData = {
      exportedAt: new Date().toISOString(),
      version: "1.0",
      coupons: coupons.map((wc) => ({
        code: wc.coupon.code,
        title: wc.coupon.title,
        description: wc.coupon.description,
        type: wc.coupon.type,
        value: wc.coupon.value,
        expiry: wc.coupon.expiry,
        used: wc.used,
        usedAt: wc.usedAt,
        addedAt: wc.addedAt,
      })),
    }

    return JSON.stringify(exportData, null, 2)
  }

  static clearWallet(): void {
    localStorage.removeItem(this.STORAGE_KEY)
    localStorage.removeItem(this.USAGE_KEY)
  }

  private static saveCoupons(coupons: WalletCoupon[]): void {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(coupons))
    } catch (error) {
      console.error("Failed to save wallet coupons:", error)
    }
  }

  private static trackUsage(coupon: AwardedCoupon): void {
    try {
      const usage = JSON.parse(localStorage.getItem(this.USAGE_KEY) || "[]")
      usage.push({
        couponId: coupon.id,
        type: coupon.type,
        value: coupon.value,
        usedAt: new Date().toISOString(),
      })
      localStorage.setItem(this.USAGE_KEY, JSON.stringify(usage))
    } catch (error) {
      console.error("Failed to track coupon usage:", error)
    }
  }
}
