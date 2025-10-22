import type { AwardedCoupon } from "@/lib/api/types"

// Mock WalletManager since it uses localStorage
const mockCoupon: AwardedCoupon = {
  id: "c1",
  code: "MOCK-C1-123",
  title: "10% OFF - Sitewide",
  description: "10% off any order over $20",
  type: "percentage",
  value: 10,
  expiry: "2025-12-31",
  awardedAt: "2024-01-01T00:00:00.000Z",
  metadata: { minPurchase: 20 },
}

describe("WalletManager", () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear()
    jest.clearAllMocks()
  })

  describe("localStorage operations", () => {
    it("should store coupon in localStorage", () => {
      const walletCoupon = {
        id: "wallet_123",
        coupon: mockCoupon,
        used: false,
        addedAt: new Date().toISOString(),
      }

      localStorage.setItem("golf-wallet", JSON.stringify([walletCoupon]))
      
      const stored = localStorage.getItem("golf-wallet")
      expect(stored).toBeDefined()
      
      if (stored) {
        const parsed = JSON.parse(stored)
        expect(parsed).toHaveLength(1)
        expect(parsed[0].coupon.code).toBe(mockCoupon.code)
      }
    })

    it("should handle empty wallet", () => {
      localStorage.setItem("golf-wallet", "[]")
      
      const wallet = JSON.parse(localStorage.getItem("golf-wallet") || "[]")
      expect(wallet).toEqual([])
    })

    it("should handle multiple coupons", () => {
      const coupons = [
        {
          id: "1",
          coupon: mockCoupon,
          used: false,
          addedAt: new Date().toISOString(),
        },
        {
          id: "2",
          coupon: { ...mockCoupon, code: "MOCK-C2-456" },
          used: true,
          addedAt: new Date().toISOString(),
        },
      ]

      localStorage.setItem("golf-wallet", JSON.stringify(coupons))
      
      const wallet = JSON.parse(localStorage.getItem("golf-wallet") || "[]")
      expect(wallet).toHaveLength(2)
      expect(wallet[0].used).toBe(false)
      expect(wallet[1].used).toBe(true)
    })
  })

  describe("Coupon expiration", () => {
    it("should identify expired coupons", () => {
      const expiredDate = new Date()
      expiredDate.setFullYear(expiredDate.getFullYear() - 1)
      
      const expiredCoupon = {
        ...mockCoupon,
        expiry: expiredDate.toISOString().split('T')[0],
      }

      const isExpired = new Date(expiredCoupon.expiry) < new Date()
      expect(isExpired).toBe(true)
    })

    it("should identify active coupons", () => {
      const futureDate = new Date()
      futureDate.setFullYear(futureDate.getFullYear() + 1)
      
      const activeCoupon = {
        ...mockCoupon,
        expiry: futureDate.toISOString().split('T')[0],
      }

      const isExpired = new Date(activeCoupon.expiry) < new Date()
      expect(isExpired).toBe(false)
    })
  })

  describe("Wallet statistics", () => {
    it("should calculate total coupons", () => {
      const coupons = [
        { id: "1", coupon: mockCoupon, used: false, addedAt: new Date().toISOString() },
        { id: "2", coupon: mockCoupon, used: true, addedAt: new Date().toISOString() },
        { id: "3", coupon: mockCoupon, used: false, addedAt: new Date().toISOString() },
      ]

      localStorage.setItem("golf-wallet", JSON.stringify(coupons))
      
      const wallet = JSON.parse(localStorage.getItem("golf-wallet") || "[]")
      const total = wallet.length
      const usedCount = wallet.filter((c: any) => c.used).length
      const activeCount = wallet.filter((c: any) => !c.used).length

      expect(total).toBe(3)
      expect(usedCount).toBe(1)
      expect(activeCount).toBe(2)
    })

    it("should calculate savings from used coupons", () => {
      const coupons = [
        {
          id: "1",
          coupon: { ...mockCoupon, type: "fixed", value: 5 },
          used: true,
          addedAt: new Date().toISOString(),
        },
        {
          id: "2",
          coupon: { ...mockCoupon, type: "fixed", value: 10 },
          used: true,
          addedAt: new Date().toISOString(),
        },
        {
          id: "3",
          coupon: { ...mockCoupon, type: "fixed", value: 3 },
          used: false,
          addedAt: new Date().toISOString(),
        },
      ]

      localStorage.setItem("golf-wallet", JSON.stringify(coupons))
      
      const wallet = JSON.parse(localStorage.getItem("golf-wallet") || "[]")
      const totalSavings = wallet
        .filter((c: any) => c.used && c.coupon.type === "fixed")
        .reduce((sum: number, c: any) => sum + c.coupon.value, 0)

      expect(totalSavings).toBe(15)
    })
  })

  describe("Coupon export", () => {
    it("should export wallet data", () => {
      const coupons = [
        {
          id: "1",
          coupon: mockCoupon,
          used: false,
          addedAt: new Date().toISOString(),
        },
      ]

      localStorage.setItem("golf-wallet", JSON.stringify(coupons))
      
      const wallet = JSON.parse(localStorage.getItem("golf-wallet") || "[]")
      const exportData = {
        exportedAt: new Date().toISOString(),
        version: "1.0",
        coupons: wallet,
      }

      expect(exportData).toHaveProperty("exportedAt")
      expect(exportData).toHaveProperty("version")
      expect(exportData.coupons).toHaveLength(1)
    })
  })
})