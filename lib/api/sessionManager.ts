// Global session manager to persist sessions across API routes
// In development, this uses a global variable to persist across hot reloads
// In production, you should use Redis or a database

export interface GameSession {
  sessionId: string
  seed: number
  couponIds: string[]
  expiresAt: string
  used: boolean
  createdAt: string
  clientIP: string
  playCount: number
  lastPlayAt?: string
}

declare global {
  var __sessions: Map<string, GameSession> | undefined
  var __sessionCleanupInterval: NodeJS.Timeout | undefined
}

// Use a global variable to persist sessions across hot reloads in development
const sessions = global.__sessions || new Map<string, GameSession>()

if (!global.__sessions) {
  global.__sessions = sessions
}

// Clear old interval if it exists
if (global.__sessionCleanupInterval) {
  clearInterval(global.__sessionCleanupInterval)
}

// Set up cleanup interval
global.__sessionCleanupInterval = setInterval(() => {
  const now = new Date()
  for (const [sessionId, session] of sessions.entries()) {
    if (new Date(session.expiresAt) < now) {
      sessions.delete(sessionId)
      console.log(`[SESSION] Expired session ${sessionId}`)
    }
  }
}, 5 * 60 * 1000) // Every 5 minutes

export const sessionManager = {
  create(session: GameSession): void {
    sessions.set(session.sessionId, session)
    console.log(`[SESSION] Created session ${session.sessionId}, total sessions: ${sessions.size}`)
  },

  get(sessionId: string): GameSession | undefined {
    const session = sessions.get(sessionId)
    console.log(`[SESSION] Getting session ${sessionId}: ${session ? 'found' : 'not found'}, total sessions: ${sessions.size}`)
    return session
  },

  update(sessionId: string, updates: Partial<GameSession>): boolean {
    const session = sessions.get(sessionId)
    if (!session) {
      console.log(`[SESSION] Failed to update session ${sessionId}: not found`)
      return false
    }
    Object.assign(session, updates)
    sessions.set(sessionId, session)
    console.log(`[SESSION] Updated session ${sessionId}`)
    return true
  },

  delete(sessionId: string): boolean {
    const result = sessions.delete(sessionId)
    console.log(`[SESSION] Deleted session ${sessionId}: ${result}`)
    return result
  },

  getAll(): GameSession[] {
    return Array.from(sessions.values())
  },

  clear(): void {
    sessions.clear()
    console.log('[SESSION] Cleared all sessions')
  },

  size(): number {
    return sessions.size
  }
}
