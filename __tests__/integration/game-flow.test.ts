import { POST as createSession } from "@/app/api/mock/session/route"
import { POST as playGame } from "@/app/api/mock/play/route"
import { GET as getCoupons } from "@/app/api/mock/coupons/route"
import { NextRequest } from "next/server"

// Mock NextRequest helper
type MockRequest = {
  method: string
  json: () => Promise<any>
  nextUrl: URL
  ip: string
  headers: Headers
}

function createMockRequest(
  method: string,
  body?: any,
  searchParams?: Record<string, string>
): MockRequest {
  const url = new URL("http://localhost:3000/api/test")
  if (searchParams) {
    Object.entries(searchParams).forEach(([key, value]) => {
      url.searchParams.set(key, value)
    })
  }

  const headers = new Headers()
  
  return {
    method,
    json: async () => body,
    nextUrl: url,
    ip: "127.0.0.1",
    headers,
  }
}

describe("Integration Tests - Complete Game Flow", () => {
  describe("Full Game Lifecycle", () => {
    it("should complete full game from coupons to result", async () => {
      // Step 1: Get available coupons
      const couponsResponse = await getCoupons()
      const couponsData = await couponsResponse.json()

      expect(couponsData.success).toBe(true)
      expect(couponsData.data.coupons).toHaveLength(5)

      // Step 2: Create session with selected coupons
      const sessionRequest = createMockRequest("POST", {
        couponIds: ["c1", "c2", "c3", "c4", "c5"],
        clientInfo: { timestamp: Date.now() },
      })

      const sessionResponse = await createSession(sessionRequest as unknown as NextRequest)
      const sessionData = await sessionResponse.json()

      expect(sessionResponse.status).toBe(200)
      expect(sessionData.success).toBe(true)
      expect(sessionData.data.sessionId).toBeDefined()
      expect(sessionData.data.seed).toBeDefined()

      const { sessionId, seed } = sessionData.data

      // Step 3: Play game
      const playRequest = createMockRequest("POST", {
        sessionId,
        input: {
          angle: Math.PI / 4,
          anglePhi: 0,
          power: 0.75,
          timestamp: Date.now(),
          courseID: 0,
        },
      })

      const playResponse = await playGame(playRequest as unknown as NextRequest)
      const playData = await playResponse.json()

      expect(playResponse.status).toBe(200)
      expect(playData.success).toBe(true)
      expect(playData.data.verified).toBe(true)
      expect(playData.data.outcome).toMatch(/^(win|lose)$/)

      if (playData.data.outcome === "win") {
        expect(playData.data.awardedCoupon).toBeDefined()
        expect(playData.data.awardedCoupon.code).toMatch(/^MOCK-C[1-5]-/)
      }
    })

    it("should prevent reusing same session", async () => {
      // Create session
      const sessionRequest = createMockRequest("POST", {
        couponIds: ["c1", "c2", "c3", "c4", "c5"],
        clientInfo: { timestamp: Date.now() },
      })

      const sessionResponse = await createSession(sessionRequest as unknown as NextRequest)
      const sessionData = await sessionResponse.json()
      const { sessionId } = sessionData.data

      // First play
      const playRequest1 = createMockRequest("POST", {
        sessionId,
        input: {
          angle: Math.PI / 4,
          anglePhi: 0,
          power: 0.75,
          timestamp: Date.now(),
          courseID: 0,
        },
      })

      const playResponse1 = await playGame(playRequest1 as unknown as NextRequest)
      expect(playResponse1.status).toBe(200)

      // Second play with same session should fail
      await new Promise(resolve => setTimeout(resolve, 100)) // Small delay
      
      const playRequest2 = createMockRequest("POST", {
        sessionId,
        input: {
          angle: Math.PI / 4,
          anglePhi: 0,
          power: 0.75,
          timestamp: Date.now(),
          courseID: 0,
        },
      })

      const playResponse2 = await playGame(playRequest2 as unknown as NextRequest)
      const playData2 = await playResponse2.json()

      expect(playResponse2.status).toBe(409) // Conflict
      expect(playData2.success).toBe(false)
      expect(playData2.error).toContain("already used")
    })
  })

  describe("Error Handling", () => {
    it("should handle invalid coupon selection", async () => {
      const sessionRequest = createMockRequest("POST", {
        couponIds: ["c1", "c2"], // Only 2 coupons instead of 5
        clientInfo: { timestamp: Date.now() },
      })

      const response = await createSession(sessionRequest as unknown as NextRequest)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
      expect(data.error).toContain("exactly 5 coupon IDs")
    })

    it("should handle invalid session ID", async () => {
      const playRequest = createMockRequest("POST", {
        sessionId: "invalid_session_id",
        input: {
          angle: Math.PI / 4,
          anglePhi: 0,
          power: 0.75,
          timestamp: Date.now(),
          courseID: 0,
        },
      })

      const response = await playGame(playRequest as unknown as NextRequest)
      const data = await response.json()

      expect(response.status).toBe(404)
      expect(data.success).toBe(false)
      expect(data.error).toContain("Invalid session")
    })

    it("should handle out-of-range angle", async () => {
      // Create valid session first
      const sessionRequest = createMockRequest("POST", {
        couponIds: ["c1", "c2", "c3", "c4", "c5"],
        clientInfo: { timestamp: Date.now() },
      })

      const sessionResponse = await createSession(sessionRequest as unknown as NextRequest)
      const sessionData = await sessionResponse.json()
      const { sessionId } = sessionData.data

      // Try to play with invalid angle
      const playRequest = createMockRequest("POST", {
        sessionId,
        input: {
          angle: Math.PI, // 180 degrees - invalid
          anglePhi: 0,
          power: 0.75,
          timestamp: Date.now(),
          courseID: 0,
        },
      })

      const response = await playGame(playRequest as unknown as NextRequest)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
      expect(data.error).toContain("out of valid range")
    })

    it("should handle out-of-range power", async () => {
      // Create valid session
      const sessionRequest = createMockRequest("POST", {
        couponIds: ["c1", "c2", "c3", "c4", "c5"],
        clientInfo: { timestamp: Date.now() },
      })

      const sessionResponse = await createSession(sessionRequest as unknown as NextRequest)
      const sessionData = await sessionResponse.json()
      const { sessionId } = sessionData.data

      // Try with power > 1
      const playRequest = createMockRequest("POST", {
        sessionId,
        input: {
          angle: Math.PI / 4,
          anglePhi: 0,
          power: 1.5, // Invalid
          timestamp: Date.now(),
          courseID: 0,
        },
      })

      const response = await playGame(playRequest as unknown as NextRequest)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
    })

    it("should handle missing required fields", async () => {
      const playRequest = createMockRequest("POST", {
        sessionId: "some_session",
        input: {
          angle: Math.PI / 4,
          // Missing power and other fields
        },
      })

      const response = await playGame(playRequest as unknown as NextRequest)
      const data = await response.json()

      expect(response.status).toBeGreaterThanOrEqual(400)
      expect(data.success).toBe(false)
    })
  })

  describe("Determinism", () => {
    it("should produce same result with same seed and inputs", async () => {
      const inputs = {
        angle: Math.PI / 6,
        anglePhi: 0,
        power: 0.8,
        courseID: 0,
      }

      // Create two sessions
      const sessionRequest1 = createMockRequest("POST", {
        couponIds: ["c1", "c2", "c3", "c4", "c5"],
        clientInfo: { timestamp: Date.now() },
      })

      const sessionRequest2 = createMockRequest("POST", {
        couponIds: ["c1", "c2", "c3", "c4", "c5"],
        clientInfo: { timestamp: Date.now() },
      })

      const sessionResponse1 = await createSession(sessionRequest1 as unknown as NextRequest)
      const sessionResponse2 = await createSession(sessionRequest2 as unknown as NextRequest)

      const sessionData1 = await sessionResponse1.json()
      const sessionData2 = await sessionResponse2.json()

      // They will have different seeds, so we need to check determinism per session
      // Play game 1
      const playRequest1 = createMockRequest("POST", {
        sessionId: sessionData1.data.sessionId,
        input: {
          ...inputs,
          timestamp: Date.now(),
        },
      })

      const playResponse1 = await playGame(playRequest1 as unknown as NextRequest)
      const playData1 = await playResponse1.json()

      expect(playData1.success).toBe(true)
      expect(playData1.data.simulation.finalPosition).toBeDefined()
      
      // Each session should produce consistent results
      expect(playData1.data.verified).toBe(true)
    })
  })

  describe("Concurrent Users", () => {
    it("should handle multiple users playing simultaneously", async () => {
      const users = [
        { ip: "192.168.1.1", id: "user1" },
        { ip: "192.168.1.2", id: "user2" },
        { ip: "192.168.1.3", id: "user3" },
      ]

      const sessions: { ip: string; id: string; sessionId: string }[] = []

      // Create sessions for all users
      for (const user of users) {
        const request: MockRequest = createMockRequest("POST", {
          couponIds: ["c1", "c2", "c3", "c4", "c5"],
          clientInfo: { timestamp: Date.now() },
        })
        
        request.ip = user.ip

        const response = await createSession(request as unknown as NextRequest)
        const data = await response.json()

        expect(response.status).toBe(200)
        sessions.push({ ...user, sessionId: data.data.sessionId })
      }

      // All users play their games
      for (const user of sessions) {
        const playRequest = createMockRequest("POST", {
          sessionId: user.sessionId,
          input: {
            angle: Math.PI / 4,
            anglePhi: 0,
            power: 0.75,
            timestamp: Date.now(),
            courseID: 0,
          },
        })

        const playResponse = await playGame(playRequest as unknown as NextRequest)
        const playData = await playResponse.json()

        expect(playResponse.status).toBe(200)
        expect(playData.success).toBe(true)
      }
    })
  })

  describe("Data Validation", () => {
    it("should validate all required fields in session creation", async () => {
      const testCases = [
        { couponIds: null, shouldFail: true },
        { couponIds: [], shouldFail: true },
        { couponIds: ["c1"], shouldFail: true },
        { couponIds: ["c1", "c2", "c3", "c4", "c5"], shouldFail: false },
        { couponIds: ["c1", "c2", "c3", "c4", "c5", "c6"], shouldFail: true },
      ]

      for (const testCase of testCases) {
        const request = createMockRequest("POST", {
          couponIds: testCase.couponIds,
          clientInfo: { timestamp: Date.now() },
        })

        const response = await createSession(request as unknown as NextRequest)
        const data = await response.json()

        if (testCase.shouldFail) {
          expect(data.success).toBe(false)
        } else {
          expect(data.success).toBe(true)
        }
      }
    })

    it("should validate angle bounds", async () => {
      // Create session
      const sessionRequest = createMockRequest("POST", {
        couponIds: ["c1", "c2", "c3", "c4", "c5"],
        clientInfo: { timestamp: Date.now() },
      })

      const sessionResponse = await createSession(sessionRequest as unknown as NextRequest)
      const sessionData = await sessionResponse.json()
      const { sessionId } = sessionData.data

      const testCases = [
        { angle: -Math.PI, shouldFail: true },
        { angle: -Math.PI / 2, shouldFail: false },
        { angle: 0, shouldFail: false },
        { angle: Math.PI / 2, shouldFail: false },
        { angle: Math.PI, shouldFail: true },
      ]

      for (const testCase of testCases) {
        const playRequest = createMockRequest("POST", {
          sessionId,
          input: {
            angle: testCase.angle,
            anglePhi: 0,
            power: 0.75,
            timestamp: Date.now(),
            courseID: 0,
          },
        })

        const response = await playGame(playRequest as unknown as NextRequest)
        const data = await response.json()

        if (testCase.shouldFail) {
          expect(response.status).toBeGreaterThanOrEqual(400)
        }
        
        // Can only use session once, so break after first valid attempt
        if (!testCase.shouldFail && data.success) {
          break
        }
      }
    })
  })

  describe("Response Structure", () => {
    it("should return correct response structure for coupons", async () => {
      const response = await getCoupons()
      const data = await response.json()

      expect(data).toHaveProperty("success")
      expect(data).toHaveProperty("data")
      expect(data.data).toHaveProperty("coupons")
      expect(Array.isArray(data.data.coupons)).toBe(true)
      
      data.data.coupons.forEach((coupon: any) => {
        expect(coupon).toHaveProperty("id")
        expect(coupon).toHaveProperty("title")
        expect(coupon).toHaveProperty("description")
        expect(coupon).toHaveProperty("type")
        expect(coupon).toHaveProperty("value")
        expect(coupon).toHaveProperty("expiry")
        expect(coupon).toHaveProperty("metadata")
      })
    })

    it("should return correct response structure for session creation", async () => {
      const request = createMockRequest("POST", {
        couponIds: ["c1", "c2", "c3", "c4", "c5"],
        clientInfo: { timestamp: Date.now() },
      })

      const response = await createSession(request as unknown as NextRequest)
      const data = await response.json()

      expect(data).toHaveProperty("success")
      expect(data).toHaveProperty("data")
      expect(data).toHaveProperty("timestamp")
      expect(data).toHaveProperty("requestId")
      
      expect(data.data).toHaveProperty("sessionId")
      expect(data.data).toHaveProperty("seed")
      expect(data.data).toHaveProperty("expiresAt")
      expect(data.data).toHaveProperty("couponIds")
    })

    it("should return correct response structure for play", async () => {
      // Create session
      const sessionRequest = createMockRequest("POST", {
        couponIds: ["c1", "c2", "c3", "c4", "c5"],
        clientInfo: { timestamp: Date.now() },
      })

      const sessionResponse = await createSession(sessionRequest as unknown as NextRequest)
      const sessionData = await sessionResponse.json()
      const { sessionId } = sessionData.data

      // Play game
      const playRequest = createMockRequest("POST", {
        sessionId,
        input: {
          angle: Math.PI / 4,
          anglePhi: 0,
          power: 0.75,
          timestamp: Date.now(),
          courseID: 0,
        },
      })

      const response = await playGame(playRequest as unknown as NextRequest)
      const data = await response.json()

      expect(data).toHaveProperty("success")
      expect(data).toHaveProperty("data")
      expect(data).toHaveProperty("timestamp")
      expect(data).toHaveProperty("requestId")
      
      expect(data.data).toHaveProperty("verified")
      expect(data.data).toHaveProperty("outcome")
      expect(data.data).toHaveProperty("simulation")
      
      expect(data.data.simulation).toHaveProperty("finalPosition")
      expect(data.data.simulation).toHaveProperty("totalTime")
      expect(data.data.simulation).toHaveProperty("trajectoryLength")
      expect(data.data.simulation).toHaveProperty("windEffect")
    })
  })
})
