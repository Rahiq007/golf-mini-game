import { POST as createSession } from "@/app/api/mock/session/route"
import { POST as playGame } from "@/app/api/mock/play/route"
import { GET as getCoupons } from "@/app/api/mock/coupons/route"
import type { NextRequest } from "next/server"

// Mock NextRequest helper
function createMockRequest(method: string, body?: any, searchParams?: Record<string, string>) {
  const url = new URL("http://localhost:3000/api/test")
  if (searchParams) {
    Object.entries(searchParams).forEach(([key, value]) => {
      url.searchParams.set(key, value)
    })
  }

  return {
    method,
    json: async () => body,
    nextUrl: url,
    ip: "127.0.0.1",
    headers: new Headers(),
  } as NextRequest
}

describe("Mock API Endpoints", () => {
  describe("GET /api/mock/coupons", () => {
    it("should return all available coupons", async () => {
      const response = await getCoupons()
      const data = await response.json()

      expect(data.success).toBe(true)
      expect(data.coupons).toHaveLength(5)
      expect(data.coupons[0]).toHaveProperty("id")
      expect(data.coupons[0]).toHaveProperty("title")
      expect(data.coupons[0]).toHaveProperty("type")
      expect(data.coupons[0]).toHaveProperty("value")
    })
  })

  describe("POST /api/mock/session", () => {
    it("should create a valid session", async () => {
      const request = createMockRequest("POST", {
        couponIds: ["c1", "c2", "c3", "c4", "c5"],
        clientInfo: { timestamp: Date.now() },
      })

      const response = await createSession(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data).toHaveProperty("sessionId")
      expect(data.data).toHaveProperty("seed")
      expect(data.data).toHaveProperty("expiresAt")
      expect(data.data.couponIds).toEqual(["c1", "c2", "c3", "c4", "c5"])
    })

    it("should reject invalid coupon count", async () => {
      const request = createMockRequest("POST", {
        couponIds: ["c1", "c2"], // Only 2 coupons
      })

      const response = await createSession(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
      expect(data.error).toContain("exactly 5 coupon IDs")
    })
  })

  describe("POST /api/mock/play", () => {
    let sessionId: string
    let seed: number

    beforeEach(async () => {
      // Create a session first
      const sessionRequest = createMockRequest("POST", {
        couponIds: ["c1", "c2", "c3", "c4", "c5"],
      })

      const sessionResponse = await createSession(sessionRequest)
      const sessionData = await sessionResponse.json()
      sessionId = sessionData.data.sessionId
      seed = sessionData.data.seed
    })

    it("should process a valid play request", async () => {
      const request = createMockRequest("POST", {
        sessionId,
        input: {
          angle: Math.PI / 6,
          power: 0.8,
          timestamp: Date.now(),
        },
      })

      const response = await playGame(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data).toHaveProperty("verified", true)
      expect(data.data).toHaveProperty("outcome")
      expect(["win", "lose"]).toContain(data.data.outcome)
      expect(data.data).toHaveProperty("simulation")
    })

    it("should award coupon on win", async () => {
      // Use parameters known to produce a win with specific seed
      const request = createMockRequest("POST", {
        sessionId,
        input: {
          angle: 0.2617993877991494, // ~15 degrees
          power: 0.85,
          timestamp: Date.now(),
        },
      })

      const response = await playGame(request)
      const data = await response.json()

      if (data.data.outcome === "win") {
        expect(data.data.awardedCoupon).toBeDefined()
        expect(data.data.awardedCoupon).toHaveProperty("code")
        expect(data.data.awardedCoupon).toHaveProperty("title")
        expect(data.data.awardedCoupon.code).toMatch(/^MOCK-C[1-5]-/)
      }
    })

    it("should reject invalid session", async () => {
      const request = createMockRequest("POST", {
        sessionId: "invalid-session",
        input: {
          angle: 0,
          power: 0.5,
          timestamp: Date.now(),
        },
      })

      const response = await playGame(request)
      const data = await response.json()

      expect(response.status).toBe(404)
      expect(data.success).toBe(false)
      expect(data.error).toContain("Invalid session")
    })

    it("should reject out-of-range inputs", async () => {
      const request = createMockRequest("POST", {
        sessionId,
        input: {
          angle: Math.PI, // 180 degrees - invalid
          power: 0.5,
          timestamp: Date.now(),
        },
      })

      const response = await playGame(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
    })
  })
})
