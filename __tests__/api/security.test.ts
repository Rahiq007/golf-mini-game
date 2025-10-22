import { security, DEFAULT_SECURITY_CONFIG } from "@/lib/api/security"

// Helper to reset security manager state between tests
function resetSecurity() {
  // Clear all internal maps
  (security as any).ipSessions.clear()
  (security as any).recentPlays.clear()
  (security as any).suspiciousActivity.clear()
}

describe("SecurityManager - Comprehensive Tests", () => {
  beforeEach(() => {
    resetSecurity()
  })

  describe("Session Creation Validation", () => {
    it("should allow initial session creation", () => {
      const result = security.validateSessionCreation("192.168.1.1")
      
      expect(result.allowed).toBe(true)
      expect(result.reason).toBeUndefined()
    })

    it("should register sessions per IP", () => {
      const ip = "192.168.1.1"
      
      for (let i = 0; i < 5; i++) {
        security.registerSession(ip, `session_${i}`)
      }
      
      const result = security.validateSessionCreation(ip)
      expect(result.allowed).toBe(false)
      expect(result.reason).toContain("Too many active sessions")
    })

    it("should allow sessions from different IPs", () => {
      for (let i = 0; i < 5; i++) {
        security.registerSession(`192.168.1.${i}`, `session_${i}`)
      }
      
      // Each IP should still be able to create sessions
      const result = security.validateSessionCreation("192.168.1.10")
      expect(result.allowed).toBe(true)
    })

    it("should respect maxSessionsPerIP limit", () => {
      const ip = "192.168.1.1"
      const maxSessions = DEFAULT_SECURITY_CONFIG.maxSessionsPerIP
      
      // Register max allowed sessions
      for (let i = 0; i < maxSessions; i++) {
        security.registerSession(ip, `session_${i}`)
        const result = security.validateSessionCreation(ip)
        
        if (i < maxSessions - 1) {
          expect(result.allowed).toBe(true)
        } else {
          expect(result.allowed).toBe(false)
        }
      }
    })
  })

  describe("Play Validation - Timestamp Checks", () => {
    it("should allow play with valid timestamp", () => {
      const sessionId = "session_123"
      const now = Date.now()
      
      const result = security.validatePlay(sessionId, now)
      
      expect(result.allowed).toBe(true)
      expect(result.reason).toBeUndefined()
    })

    it("should reject old timestamps", () => {
      const sessionId = "session_123"
      const oldTimestamp = Date.now() - (DEFAULT_SECURITY_CONFIG.replayProtectionWindowMs + 1000)
      
      const result = security.validatePlay(sessionId, oldTimestamp)
      
      expect(result.allowed).toBe(false)
      expect(result.reason).toContain("Timestamp outside acceptable window")
    })

    it("should reject future timestamps", () => {
      const sessionId = "session_123"
      const futureTimestamp = Date.now() + (DEFAULT_SECURITY_CONFIG.replayProtectionWindowMs + 1000)
      
      const result = security.validatePlay(sessionId, futureTimestamp)
      
      expect(result.allowed).toBe(false)
      expect(result.reason).toContain("Timestamp outside acceptable window")
    })

    it("should accept timestamp at window boundary", () => {
      const sessionId = "session_123"
      const boundaryTimestamp = Date.now() - (DEFAULT_SECURITY_CONFIG.replayProtectionWindowMs - 100)
      
      const result = security.validatePlay(sessionId, boundaryTimestamp)
      
      expect(result.allowed).toBe(true)
    })

    it("should handle timestamp of exactly now", () => {
      const sessionId = "session_123"
      const result = security.validatePlay(sessionId, Date.now())
      
      expect(result.allowed).toBe(true)
    })
  })

  describe("Play Validation - Rapid Play Detection", () => {
    it("should reject rapid successive plays", async () => {
      const sessionId = "session_rapid"
      const now = Date.now()
      
      const first = security.validatePlay(sessionId, now)
      expect(first.allowed).toBe(true)
      
      // Try to play again immediately
      const second = security.validatePlay(sessionId, now + 100)
      expect(second.allowed).toBe(false)
      expect(second.reason).toContain("Too many plays in short time window")
    })

    it("should allow play after cooldown", async () => {
      const sessionId = "session_cooldown"
      const now = Date.now()
      
      security.validatePlay(sessionId, now)
      
      // Wait for cooldown window (1 second)
      await new Promise(resolve => setTimeout(resolve, 1100))
      
      const result = security.validatePlay(sessionId, Date.now())
      expect(result.allowed).toBe(true)
    })

    it("should track plays per session separately", () => {
      const session1 = "session_1"
      const session2 = "session_2"
      const now = Date.now()
      
      const result1 = security.validatePlay(session1, now)
      const result2 = security.validatePlay(session2, now)
      
      expect(result1.allowed).toBe(true)
      expect(result2.allowed).toBe(true)
    })
  })

  describe("Suspicious Activity Tracking", () => {
    it("should track suspicious activity", () => {
      const identifier = "suspicious_user"
      
      expect(security.isSuspicious(identifier)).toBe(false)
      
      security.reportSuspiciousActivity(identifier)
      expect(security.isSuspicious(identifier)).toBe(false) // Not yet threshold
      
      security.reportSuspiciousActivity(identifier)
      security.reportSuspiciousActivity(identifier)
      
      expect(security.isSuspicious(identifier)).toBe(true)
    })

    it("should increment suspicious activity counter", () => {
      const identifier = "test_user"
      const threshold = DEFAULT_SECURITY_CONFIG.suspiciousPlayThreshold
      
      for (let i = 0; i < threshold - 1; i++) {
        security.reportSuspiciousActivity(identifier)
        expect(security.isSuspicious(identifier)).toBe(false)
      }
      
      security.reportSuspiciousActivity(identifier)
      expect(security.isSuspicious(identifier)).toBe(true)
    })

    it("should track different identifiers separately", () => {
      security.reportSuspiciousActivity("user_1")
      security.reportSuspiciousActivity("user_1")
      security.reportSuspiciousActivity("user_1")
      
      expect(security.isSuspicious("user_1")).toBe(true)
      expect(security.isSuspicious("user_2")).toBe(false)
    })
  })

  describe("Cleanup", () => {
    it("should clean up old play records", async () => {
      const sessionId = "session_cleanup"
      const oldTimestamp = Date.now() - (2 * 60 * 60 * 1000) // 2 hours ago
      
      // Register an old play
      security.validatePlay(sessionId, oldTimestamp)
      
      // Run cleanup
      security.cleanup()
      
      // Old play should be removed, so new play should be allowed
      const result = security.validatePlay(sessionId, Date.now())
      expect(result.allowed).toBe(true)
    })
  })

  describe("Edge Cases", () => {
    it("should handle empty session ID", () => {
      const result = security.validatePlay("", Date.now())
      
      expect(result.allowed).toBe(true) // First play for this session
    })

    it("should handle very long session ID", () => {
      const longId = "session_" + "x".repeat(1000)
      const result = security.validatePlay(longId, Date.now())
      
      expect(result.allowed).toBe(true)
    })

    it("should handle special characters in identifiers", () => {
      const specialChars = "user@#$%^&*()"
      
      security.reportSuspiciousActivity(specialChars)
      expect(security.isSuspicious(specialChars)).toBe(false)
    })

    it("should handle zero timestamp", () => {
      const sessionId = "session_zero"
      const now = Date.now()
      
      const result = security.validatePlay(sessionId, 0)
      
      // Should be rejected as too old
      expect(result.allowed).toBe(false)
    })

    it("should handle negative timestamp", () => {
      const sessionId = "session_negative"
      const result = security.validatePlay(sessionId, -1000)
      
      expect(result.allowed).toBe(false)
    })

    it("should handle very large timestamp", () => {
      const sessionId = "session_future"
      const farFuture = Date.now() + (365 * 24 * 60 * 60 * 1000) // 1 year from now
      
      const result = security.validatePlay(sessionId, farFuture)
      
      expect(result.allowed).toBe(false)
    })
  })

  describe("Concurrent Sessions", () => {
    it("should handle multiple IPs registering sessions simultaneously", () => {
      const ips = Array.from({ length: 10 }, (_, i) => `192.168.1.${i}`)
      
      ips.forEach((ip, i) => {
        security.registerSession(ip, `session_${i}`)
        const result = security.validateSessionCreation(ip)
        expect(result.allowed).toBe(true)
      })
    })

    it("should track sessions per IP correctly with multiple registrations", () => {
      const ip = "192.168.1.100"
      const maxSessions = DEFAULT_SECURITY_CONFIG.maxSessionsPerIP
      
      // Register max sessions
      for (let i = 0; i < maxSessions; i++) {
        security.registerSession(ip, `session_${i}`)
      }
      
      // Should not allow more
      const result = security.validateSessionCreation(ip)
      expect(result.allowed).toBe(false)
      
      // But another IP should still be able to create sessions
      const otherResult = security.validateSessionCreation("192.168.1.101")
      expect(otherResult.allowed).toBe(true)
    })
  })

  describe("Security Configuration", () => {
    it("should use default config values", () => {
      expect(DEFAULT_SECURITY_CONFIG.maxSessionsPerIP).toBe(5)
      expect(DEFAULT_SECURITY_CONFIG.sessionTimeoutMinutes).toBe(30)
      expect(DEFAULT_SECURITY_CONFIG.maxPlaysPerSession).toBe(1)
      expect(DEFAULT_SECURITY_CONFIG.replayProtectionWindowMs).toBe(60000)
      expect(DEFAULT_SECURITY_CONFIG.suspiciousPlayThreshold).toBe(3)
    })
  })

  describe("Real-World Scenarios", () => {
    it("should handle normal game flow", () => {
      const ip = "192.168.1.50"
      const sessionId = "game_session_1"
      
      // Create session
      security.registerSession(ip, sessionId)
      const createCheck = security.validateSessionCreation(ip)
      expect(createCheck.allowed).toBe(true)
      
      // Play game
      const playCheck = security.validatePlay(sessionId, Date.now())
      expect(playCheck.allowed).toBe(true)
    })

    it("should block replay attacks", () => {
      const sessionId = "replay_attack"
      const timestamp = Date.now()
      
      // First play succeeds
      const first = security.validatePlay(sessionId, timestamp)
      expect(first.allowed).toBe(true)
      
      // Immediate replay fails
      const replay = security.validatePlay(sessionId, timestamp)
      expect(replay.allowed).toBe(false)
    })

    it("should block session creation spam", () => {
      const ip = "192.168.1.200"
      const maxSessions = DEFAULT_SECURITY_CONFIG.maxSessionsPerIP
      
      // Spam session creation
      for (let i = 0; i < maxSessions + 5; i++) {
        if (i < maxSessions) {
          security.registerSession(ip, `spam_session_${i}`)
        }
      }
      
      const result = security.validateSessionCreation(ip)
      expect(result.allowed).toBe(false)
    })

    it("should allow user to play again after session expires", async () => {
      const sessionId = "expired_session"
      
      // First play
      security.validatePlay(sessionId, Date.now())
      
      // Wait for cooldown
      await new Promise(resolve => setTimeout(resolve, 1100))
      
      // Should be able to play with new session
      const result = security.validatePlay(sessionId, Date.now())
      expect(result.allowed).toBe(true)
    })
  })
})