import { sessionManager, type GameSession } from "@/lib/api/sessionManager"

// Helper to create mock session
function createMockSession(overrides?: Partial<GameSession>): GameSession {
  return {
    sessionId: `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    seed: Math.floor(Math.random() * 1000000),
    couponIds: ["c1", "c2", "c3", "c4", "c5"],
    expiresAt: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
    used: false,
    createdAt: new Date().toISOString(),
    clientIP: "127.0.0.1",
    playCount: 0,
    ...overrides,
  }
}

describe("SessionManager - Comprehensive Tests", () => {
  beforeEach(() => {
    // Clear all sessions before each test
    sessionManager.clear()
  })

  describe("Session Creation", () => {
    it("should create a new session", () => {
      const session = createMockSession()
      
      sessionManager.create(session)
      
      const retrieved = sessionManager.get(session.sessionId)
      expect(retrieved).toEqual(session)
    })

    it("should increment session count", () => {
      const initialSize = sessionManager.size()
      
      const session = createMockSession()
      sessionManager.create(session)
      
      expect(sessionManager.size()).toBe(initialSize + 1)
    })

    it("should create multiple sessions", () => {
      const sessions = Array.from({ length: 5 }, () => createMockSession())
      
      sessions.forEach(session => sessionManager.create(session))
      
      expect(sessionManager.size()).toBe(5)
      sessions.forEach(session => {
        expect(sessionManager.get(session.sessionId)).toEqual(session)
      })
    })

    it("should preserve all session properties", () => {
      const session = createMockSession({
        sessionId: "test_123",
        seed: 42,
        couponIds: ["custom1", "custom2", "custom3", "custom4", "custom5"],
        used: false,
        playCount: 0,
        clientIP: "192.168.1.1",
      })
      
      sessionManager.create(session)
      const retrieved = sessionManager.get("test_123")
      
      expect(retrieved?.sessionId).toBe("test_123")
      expect(retrieved?.seed).toBe(42)
      expect(retrieved?.couponIds).toEqual(["custom1", "custom2", "custom3", "custom4", "custom5"])
      expect(retrieved?.used).toBe(false)
      expect(retrieved?.playCount).toBe(0)
      expect(retrieved?.clientIP).toBe("192.168.1.1")
    })
  })

  describe("Session Retrieval", () => {
    it("should retrieve existing session", () => {
      const session = createMockSession()
      sessionManager.create(session)
      
      const retrieved = sessionManager.get(session.sessionId)
      
      expect(retrieved).toBeDefined()
      expect(retrieved?.sessionId).toBe(session.sessionId)
    })

    it("should return undefined for non-existent session", () => {
      const retrieved = sessionManager.get("non_existent_session")
      
      expect(retrieved).toBeUndefined()
    })

    it("should get all sessions", () => {
      const sessions = Array.from({ length: 3 }, () => createMockSession())
      sessions.forEach(session => sessionManager.create(session))
      
      const allSessions = sessionManager.getAll()
      
      expect(allSessions).toHaveLength(3)
      expect(allSessions).toEqual(expect.arrayContaining(sessions))
    })

    it("should return empty array when no sessions exist", () => {
      const allSessions = sessionManager.getAll()
      
      expect(allSessions).toEqual([])
    })
  })

  describe("Session Updates", () => {
    it("should update session properties", () => {
      const session = createMockSession()
      sessionManager.create(session)
      
      const success = sessionManager.update(session.sessionId, {
        used: true,
        playCount: 1,
        lastPlayAt: new Date().toISOString(),
      })
      
      expect(success).toBe(true)
      
      const updated = sessionManager.get(session.sessionId)
      expect(updated?.used).toBe(true)
      expect(updated?.playCount).toBe(1)
      expect(updated?.lastPlayAt).toBeDefined()
    })

    it("should return false when updating non-existent session", () => {
      const success = sessionManager.update("non_existent", { used: true })
      
      expect(success).toBe(false)
    })

    it("should partially update session", () => {
      const session = createMockSession({ playCount: 0 })
      sessionManager.create(session)
      
      sessionManager.update(session.sessionId, { playCount: 5 })
      
      const updated = sessionManager.get(session.sessionId)
      expect(updated?.playCount).toBe(5)
      expect(updated?.used).toBe(false) // Should remain unchanged
    })

    it("should preserve unchanged properties", () => {
      const session = createMockSession({
        seed: 12345,
        couponIds: ["a", "b", "c", "d", "e"],
      })
      sessionManager.create(session)
      
      sessionManager.update(session.sessionId, { used: true })
      
      const updated = sessionManager.get(session.sessionId)
      expect(updated?.seed).toBe(12345)
      expect(updated?.couponIds).toEqual(["a", "b", "c", "d", "e"])
    })

    it("should handle multiple updates", () => {
      const session = createMockSession()
      sessionManager.create(session)
      
      sessionManager.update(session.sessionId, { playCount: 1 })
      sessionManager.update(session.sessionId, { playCount: 2 })
      sessionManager.update(session.sessionId, { used: true })
      
      const updated = sessionManager.get(session.sessionId)
      expect(updated?.playCount).toBe(2)
      expect(updated?.used).toBe(true)
    })
  })

  describe("Session Deletion", () => {
    it("should delete existing session", () => {
      const session = createMockSession()
      sessionManager.create(session)
      
      const success = sessionManager.delete(session.sessionId)
      
      expect(success).toBe(true)
      expect(sessionManager.get(session.sessionId)).toBeUndefined()
    })

    it("should return false when deleting non-existent session", () => {
      const success = sessionManager.delete("non_existent")
      
      expect(success).toBe(false)
    })

    it("should decrement session count", () => {
      const session = createMockSession()
      sessionManager.create(session)
      
      const sizeBefore = sessionManager.size()
      sessionManager.delete(session.sessionId)
      
      expect(sessionManager.size()).toBe(sizeBefore - 1)
    })

    it("should delete multiple sessions independently", () => {
      const sessions = Array.from({ length: 3 }, () => createMockSession())
      sessions.forEach(session => sessionManager.create(session))
      
      sessionManager.delete(sessions[0].sessionId)
      
      expect(sessionManager.get(sessions[0].sessionId)).toBeUndefined()
      expect(sessionManager.get(sessions[1].sessionId)).toBeDefined()
      expect(sessionManager.get(sessions[2].sessionId)).toBeDefined()
    })
  })

  describe("Clear All Sessions", () => {
    it("should clear all sessions", () => {
      const sessions = Array.from({ length: 5 }, () => createMockSession())
      sessions.forEach(session => sessionManager.create(session))
      
      sessionManager.clear()
      
      expect(sessionManager.size()).toBe(0)
      expect(sessionManager.getAll()).toEqual([])
    })

    it("should allow creating new sessions after clear", () => {
      const session1 = createMockSession()
      sessionManager.create(session1)
      
      sessionManager.clear()
      
      const session2 = createMockSession()
      sessionManager.create(session2)
      
      expect(sessionManager.size()).toBe(1)
      expect(sessionManager.get(session2.sessionId)).toBeDefined()
    })
  })

  describe("Session Size", () => {
    it("should return correct size", () => {
      expect(sessionManager.size()).toBe(0)
      
      sessionManager.create(createMockSession())
      expect(sessionManager.size()).toBe(1)
      
      sessionManager.create(createMockSession())
      expect(sessionManager.size()).toBe(2)
    })

    it("should update size on deletion", () => {
      const session = createMockSession()
      sessionManager.create(session)
      
      expect(sessionManager.size()).toBe(1)
      
      sessionManager.delete(session.sessionId)
      
      expect(sessionManager.size()).toBe(0)
    })
  })

  describe("Session Expiration", () => {
    it("should create session with expiration time", () => {
      const expiresAt = new Date(Date.now() + 30 * 60 * 1000).toISOString()
      const session = createMockSession({ expiresAt })
      
      sessionManager.create(session)
      
      const retrieved = sessionManager.get(session.sessionId)
      expect(retrieved?.expiresAt).toBe(expiresAt)
    })

    it("should detect expired sessions", () => {
      const expiredTime = new Date(Date.now() - 1000).toISOString() // 1 second ago
      const session = createMockSession({ expiresAt: expiredTime })
      
      sessionManager.create(session)
      
      const retrieved = sessionManager.get(session.sessionId)
      const isExpired = new Date(retrieved!.expiresAt) < new Date()
      
      expect(isExpired).toBe(true)
    })

    it("should detect non-expired sessions", () => {
      const futureTime = new Date(Date.now() + 30 * 60 * 1000).toISOString()
      const session = createMockSession({ expiresAt: futureTime })
      
      sessionManager.create(session)
      
      const retrieved = sessionManager.get(session.sessionId)
      const isExpired = new Date(retrieved!.expiresAt) < new Date()
      
      expect(isExpired).toBe(false)
    })
  })

  describe("Session Usage Tracking", () => {
    it("should track session usage", () => {
      const session = createMockSession({ used: false, playCount: 0 })
      sessionManager.create(session)
      
      sessionManager.update(session.sessionId, {
        used: true,
        playCount: 1,
        lastPlayAt: new Date().toISOString(),
      })
      
      const updated = sessionManager.get(session.sessionId)
      expect(updated?.used).toBe(true)
      expect(updated?.playCount).toBe(1)
      expect(updated?.lastPlayAt).toBeDefined()
    })

    it("should increment play count", () => {
      const session = createMockSession({ playCount: 0 })
      sessionManager.create(session)
      
      for (let i = 1; i <= 5; i++) {
        sessionManager.update(session.sessionId, { playCount: i })
        const updated = sessionManager.get(session.sessionId)
        expect(updated?.playCount).toBe(i)
      }
    })
  })

  describe("Concurrent Operations", () => {
    it("should handle multiple rapid creates", () => {
      const sessions = Array.from({ length: 10 }, () => createMockSession())
      
      sessions.forEach(session => sessionManager.create(session))
      
      expect(sessionManager.size()).toBe(10)
      sessions.forEach(session => {
        expect(sessionManager.get(session.sessionId)).toBeDefined()
      })
    })

    it("should handle interleaved operations", () => {
      const session1 = createMockSession()
      const session2 = createMockSession()
      
      sessionManager.create(session1)
      sessionManager.create(session2)
      sessionManager.update(session1.sessionId, { used: true })
      sessionManager.delete(session2.sessionId)
      
      expect(sessionManager.get(session1.sessionId)?.used).toBe(true)
      expect(sessionManager.get(session2.sessionId)).toBeUndefined()
    })
  })

  describe("Edge Cases", () => {
    it("should handle empty session ID", () => {
      const session = createMockSession({ sessionId: "" })
      sessionManager.create(session)
      
      expect(sessionManager.get("")).toEqual(session)
    })

    it("should handle very long session ID", () => {
      const longId = "session_" + "x".repeat(1000)
      const session = createMockSession({ sessionId: longId })
      
      sessionManager.create(session)
      
      expect(sessionManager.get(longId)).toEqual(session)
    })

    it("should handle special characters in session ID", () => {
      const specialId = "session_@#$%^&*()"
      const session = createMockSession({ sessionId: specialId })
      
      sessionManager.create(session)
      
      expect(sessionManager.get(specialId)).toEqual(session)
    })

    it("should handle session with no coupons", () => {
      const session = createMockSession({ couponIds: [] })
      sessionManager.create(session)
      
      const retrieved = sessionManager.get(session.sessionId)
      expect(retrieved?.couponIds).toEqual([])
    })

    it("should handle session with seed of 0", () => {
      const session = createMockSession({ seed: 0 })
      sessionManager.create(session)
      
      const retrieved = sessionManager.get(session.sessionId)
      expect(retrieved?.seed).toBe(0)
    })

    it("should handle negative seed", () => {
      const session = createMockSession({ seed: -12345 })
      sessionManager.create(session)
      
      const retrieved = sessionManager.get(session.sessionId)
      expect(retrieved?.seed).toBe(-12345)
    })
  })

  describe("Data Integrity", () => {
    it("should not modify original session object", () => {
      const session = createMockSession()
      const originalSeed = session.seed
      
      sessionManager.create(session)
      sessionManager.update(session.sessionId, { seed: 99999 })
      
      expect(session.seed).toBe(originalSeed) // Original should be unchanged
    })

    it("should create independent session copies", () => {
      const template = createMockSession()
      const session1 = { ...template, sessionId: "session_1" }
      const session2 = { ...template, sessionId: "session_2" }
      
      sessionManager.create(session1)
      sessionManager.create(session2)
      
      sessionManager.update("session_1", { used: true })
      
      expect(sessionManager.get("session_1")?.used).toBe(true)
      expect(sessionManager.get("session_2")?.used).toBe(false)
    })
  })

  describe("Real-World Scenarios", () => {
    it("should handle complete game lifecycle", () => {
      // Create session
      const session = createMockSession()
      sessionManager.create(session)
      
      // Verify session exists
      expect(sessionManager.get(session.sessionId)).toBeDefined()
      
      // Mark as used after play
      sessionManager.update(session.sessionId, {
        used: true,
        playCount: 1,
        lastPlayAt: new Date().toISOString(),
      })
      
      // Verify updates
      const updated = sessionManager.get(session.sessionId)
      expect(updated?.used).toBe(true)
      expect(updated?.playCount).toBe(1)
      
      // Clean up
      sessionManager.delete(session.sessionId)
      expect(sessionManager.get(session.sessionId)).toBeUndefined()
    })

    it("should handle multiple concurrent games", () => {
      const player1Session = createMockSession({ clientIP: "192.168.1.1" })
      const player2Session = createMockSession({ clientIP: "192.168.1.2" })
      const player3Session = createMockSession({ clientIP: "192.168.1.3" })
      
      sessionManager.create(player1Session)
      sessionManager.create(player2Session)
      sessionManager.create(player3Session)
      
      sessionManager.update(player1Session.sessionId, { playCount: 1 })
      sessionManager.update(player2Session.sessionId, { playCount: 1 })
      
      expect(sessionManager.size()).toBe(3)
      expect(sessionManager.get(player1Session.sessionId)?.playCount).toBe(1)
      expect(sessionManager.get(player2Session.sessionId)?.playCount).toBe(1)
      expect(sessionManager.get(player3Session.sessionId)?.playCount).toBe(0)
    })
  })
})