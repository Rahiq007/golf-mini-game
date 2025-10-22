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

class SecurityManager {
  private config: SecurityConfig
  private ipSessions = new Map<string, string[]>()
  private recentPlays = new Map<string, number[]>()
  private suspiciousActivity = new Map<string, number>()

  constructor(config: SecurityConfig = DEFAULT_SECURITY_CONFIG) {
    this.config = config
  }

  validateSessionCreation(clientIP: string): { allowed: boolean; reason?: string } {
    const existingSessions = this.ipSessions.get(clientIP) || []

    if (existingSessions.length >= this.config.maxSessionsPerIP) {
      return { allowed: false, reason: "Too many active sessions from this IP" }
    }

    return { allowed: true }
  }

  registerSession(clientIP: string, sessionId: string): void {
    const sessions = this.ipSessions.get(clientIP) || []
    sessions.push(sessionId)
    this.ipSessions.set(clientIP, sessions)
  }

  validatePlay(sessionId: string, timestamp: number): { allowed: boolean; reason?: string } {
    const now = Date.now()

    // Check replay protection
    // console.log("Inside validatePlay:")
    // console.log("now: ", now, "\ttimestamp: ", timestamp, "replayProtectionWindowMs", 
    //             "abs(now - timestamp)", Math.abs(now - timestamp), this.config.replayProtectionWindowMs)
    if (Math.abs(now - timestamp) > this.config.replayProtectionWindowMs) {
      return { allowed: false, reason: "Timestamp outside acceptable window" }
    }

    // Check for rapid successive plays
    const recentPlays = this.recentPlays.get(sessionId) || []
    const recentWindow = now - 1000 // 1 second window
    const filteredPlays = recentPlays.filter((t) => t > recentWindow)

    if (filteredPlays.length > 0) {
      return { allowed: false, reason: "Too many plays in short time window" }
    }

    // Register this play
    filteredPlays.push(now)
    this.recentPlays.set(sessionId, filteredPlays)

    return { allowed: true }
  }

  reportSuspiciousActivity(identifier: string): void {
    const count = this.suspiciousActivity.get(identifier) || 0
    this.suspiciousActivity.set(identifier, count + 1)
  }

  isSuspicious(identifier: string): boolean {
    const count = this.suspiciousActivity.get(identifier) || 0
    return count >= this.config.suspiciousPlayThreshold
  }

  cleanup(): void {
    // Clean up old data periodically
    const cutoff = Date.now() - 60 * 60 * 1000 // 1 hour

    for (const [sessionId, plays] of this.recentPlays.entries()) {
      const filtered = plays.filter((t) => t > cutoff)
      if (filtered.length === 0) {
        this.recentPlays.delete(sessionId)
      } else {
        this.recentPlays.set(sessionId, filtered)
      }
    }
  }
}

export const security = new SecurityManager()
