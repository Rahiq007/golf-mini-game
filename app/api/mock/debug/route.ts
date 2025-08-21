import { type NextRequest, NextResponse } from "next/server"
import { telemetry } from "@/lib/api/telemetry"
import { sessions } from "../session/route"
import type { ApiResponse } from "@/lib/api/types"

function generateRequestId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

export async function GET(request: NextRequest) {
  const requestId = generateRequestId()
  const sessionId = request.nextUrl.searchParams.get("sessionId")
  const minutes = Number.parseInt(request.nextUrl.searchParams.get("minutes") || "10")

  try {
    const events = sessionId ? telemetry.getEvents(sessionId) : telemetry.getRecentEvents(minutes)

    const activeSessions = Array.from(sessions.entries()).map(([id, session]) => ({
      sessionId: id,
      used: session.used,
      playCount: session.playCount,
      createdAt: session.createdAt,
      expiresAt: session.expiresAt,
    }))

    return NextResponse.json<ApiResponse>({
      success: true,
      data: {
        events,
        activeSessions,
        totalEvents: events.length,
        totalSessions: sessions.size,
      },
      timestamp: new Date().toISOString(),
      requestId,
    })
  } catch (error) {
    return NextResponse.json<ApiResponse>(
      {
        success: false,
        error: "Failed to fetch debug info",
        timestamp: new Date().toISOString(),
        requestId,
      },
      { status: 500 },
    )
  }
}
