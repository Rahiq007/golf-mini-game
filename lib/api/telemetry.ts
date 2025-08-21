export interface TelemetryEvent {
  event: string
  data: Record<string, any>
  timestamp: string
  sessionId?: string
  requestId?: string
}

class TelemetryLogger {
  private events: TelemetryEvent[] = []
  private maxEvents = 1000

  log(event: string, data: Record<string, any> = {}, sessionId?: string, requestId?: string) {
    const telemetryEvent: TelemetryEvent = {
      event,
      data,
      timestamp: new Date().toISOString(),
      sessionId,
      requestId,
    }

    this.events.push(telemetryEvent)

    // Keep only recent events
    if (this.events.length > this.maxEvents) {
      this.events = this.events.slice(-this.maxEvents)
    }

    // Console logging for development
    console.log(`[GOLF-GAME] ${event}:`, {
      ...data,
      sessionId,
      requestId,
      timestamp: telemetryEvent.timestamp,
    })

    // In production, this would send to analytics service
    if (typeof window !== "undefined" && (window as any).dataLayer) {
      ;(window as any).dataLayer.push({
        event: "golf_game_event",
        eventName: event,
        eventData: data,
        sessionId,
        requestId,
      })
    }
  }

  getEvents(sessionId?: string): TelemetryEvent[] {
    if (sessionId) {
      return this.events.filter((e) => e.sessionId === sessionId)
    }
    return [...this.events]
  }

  getRecentEvents(minutes = 10): TelemetryEvent[] {
    const cutoff = new Date(Date.now() - minutes * 60 * 1000)
    return this.events.filter((e) => new Date(e.timestamp) > cutoff)
  }
}

export const telemetry = new TelemetryLogger()

export function EVENT_TRACK(event: string, data: Record<string, any> = {}, sessionId?: string, requestId?: string) {
  telemetry.log(event, data, sessionId, requestId)
}
