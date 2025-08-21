import { WalletManager } from "@/lib/wallet/walletManager"
import type { AwardedCoupon } from "@/lib/api/types"

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
}

Object.defineProperty(window, "localStorage", {
  value: localStorageMock,
})

describe("WalletManager", () => {
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

  beforeEach(() => {
    jest.clearAllMocks()
    localStorageMock.getItem.mockReturnValue("[]")
  })

  describe("addCoupon", () => {
    it("should add a coupon to the wallet", () => {
      const walletCoupon = WalletManager.addCoupon(mockCoupon)

      expect(walletCoupon.coupon).toEqual(mockCoupon)
      expect(walletCoupon.used).toBe(false)
      expect(walletCoupon.id).toBeDefined()
      expect(walletCoupon.addedAt).toBeDefined()
      expect(localStorageMock.setItem).toHaveBeenCalled()
    })
  })

  describe("markAsUsed", () => {
    it("should mark a coupon as used", () => {
      const existingCoupon = {
        id: "wallet_123",
        coupon: mockCoupon,
        used: false,
        addedAt: "2024-01-01T00:00:00.000Z",
      }

      localStorageMock.getItem.mockReturnValue(JSON.stringify([existingCoupon]))

      const result = WalletManager.markAsUsed("wallet_123")

      expect(result).toBe(true)
      expect(localStorageMock.setItem).toHaveBeenCalled()
    })

    it("should return false for non-existent coupon", () => {
      const result = WalletManager.markAsUsed("non-existent")
      expect(result).toBe(false)
    })
  })

  describe("getStats", () => {
    it("should calculate wallet statistics correctly", () => {
      const coupons = [
        {
          id: "1",
          coupon: { ...mockCoupon, expiry: "2025-12-31" },
          used: false,
          addedAt: "2024-01-01T00:00:00.000Z",
        },
        {
          id: "2",
          coupon: { ...mockCoupon, expiry: "2023-12-31" }, // Expired
          used: false,
          addedAt: "2024-01-01T00:00:00.000Z",
        },
        {
          id: "3",
          coupon: { ...mockCoupon, type: "fixed", value: 5 },
          used: true,
          addedAt: "2024-01-01T00:00:00.000Z",
        },
      ]

      localStorageMock.getItem.mockReturnValue(JSON.stringify(coupons))

      const stats = WalletManager.getStats()

      expect(stats.totalCoupons).toBe(3)
      expect(stats.usedCoupons).toBe(1)
      expect(stats.expiredCoupons).toBe(1)
      expect(stats.activeCoupons).toBe(1)
      expect(stats.totalSavings).toBe(5) // From the used fixed coupon
    })
  })

  describe("isExpired", () => {
    it("should correctly identify expired coupons", () => {
      const expiredCoupon = { ...mockCoupon, expiry: "2020-01-01" }
      const activeCoupon = { ...mockCoupon, expiry: "2030-01-01" }

      expect(WalletManager.isExpired(expiredCoupon)).toBe(true)
      expect(WalletManager.isExpired(activeCoupon)).toBe(false)
    })
  })

  describe("exportWallet", () => {
    it("should export wallet data as JSON", () => {
      const coupons = [
        {
          id: "1",
          coupon: mockCoupon,
          used: false,
          addedAt: "2024-01-01T00:00:00.000Z",
        },
      ]

      localStorageMock.getItem.mockReturnValue(JSON.stringify(coupons))

      const exportData = WalletManager.exportWallet()
      const parsed = JSON.parse(exportData)

      expect(parsed).toHaveProperty("exportedAt")
      expect(parsed).toHaveProperty("version", "1.0")
      expect(parsed.coupons).toHaveLength(1)
      expect(parsed.coupons[0]).toHaveProperty("code", mockCoupon.code)
    })
  })
})
