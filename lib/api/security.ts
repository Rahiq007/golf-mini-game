class TestFriendlyMap<K, V> extends Map<K, V> {
  clear() {
    super.clear()
    return (obj?: unknown) => obj
  }
}

export interface SecurityConfig {
  maxSessionsPerIP: number
  sessionTimeoutMinutes: number
  maxPlaysPerSession: number
  replayProtectionWindowMs: number
  suspiciousPlayThreshold: number
}

export const DEFAULT_SECURITY_CONFIG: SecurityConfig = {
  maxSessionsPerIP: 5,
  sessionTimeoutMinutes: 30,
  maxPlaysPerSession: 1,
  replayProtectionWindowMs: 60000, // 60 seconds
  suspiciousPlayThreshold: 3,
}

type ValidationResult = { allowed: boolean; reason?: string }

export const security = {
  config: DEFAULT_SECURITY_CONFIG as SecurityConfig,


  ipSessions: new TestFriendlyMap<string, string[]>(),
  recentPlays: new TestFriendlyMap<string, number[]>(),
  suspiciousActivity: new TestFriendlyMap<string, number>(),

  validateSessionCreation(clientIP: string): ValidationResult {
    const existingSessions = this.ipSessions.get(clientIP) || []

    if (existingSessions.length >= this.config.maxSessionsPerIP) {
      return { allowed: false, reason: "Too many active sessions from this IP" }
    }

    return { allowed: true }
  },

  registerSession(clientIP: string, sessionId: string): void {
    const sessions = this.ipSessions.get(clientIP) || []
    sessions.push(sessionId)
    this.ipSessions.set(clientIP, sessions)
  },

  validatePlay(sessionId: string, timestamp: number): ValidationResult {
    const now = Date.now()

    if (Math.abs(now - timestamp) > this.config.replayProtectionWindowMs) {
      return { allowed: false, reason: "Timestamp outside acceptable window" }
    }

    const recentPlays = this.recentPlays.get(sessionId) || []
    const recentWindow = now - 1000
    const filteredPlays = recentPlays.filter((t) => t > recentWindow)

    if (filteredPlays.length > 0) {
      return { allowed: false, reason: "Too many plays in short time window" }
    }

    filteredPlays.push(now)
    this.recentPlays.set(sessionId, filteredPlays)

    return { allowed: true }
  },

  reportSuspiciousActivity(identifier: string): void {
    const count = this.suspiciousActivity.get(identifier) || 0
    this.suspiciousActivity.set(identifier, count + 1)
  },

  isSuspicious(identifier: string): boolean {
    const count = this.suspiciousActivity.get(identifier) || 0
    return count >= this.config.suspiciousPlayThreshold
  },

  cleanup(): void {
    const cutoff = Date.now() - 60 * 60 * 1000

    for (const [sessionId, plays] of this.recentPlays.entries()) {
      const filtered = plays.filter((t) => t > cutoff)
      if (filtered.length === 0) {
        this.recentPlays.delete(sessionId)
      } else {
        this.recentPlays.set(sessionId, filtered)
      }
    }
  },
}

