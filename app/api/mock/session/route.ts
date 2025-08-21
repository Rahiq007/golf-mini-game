import { type NextRequest, NextResponse } from "next/server"
import { EVENT_TRACK } from "@/lib/api/telemetry"
import { security } from "@/lib/api/security"
import { sessionManager, type GameSession } from "@/lib/api/sessionManager"
import type { ApiResponse, SessionCreateRequest, SessionCreateResponse } from "@/lib/api/types"

function generateRequestId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

function getClientIP(request: NextRequest): string {
  return request.ip || request.headers.get("x-forwarded-for") || "unknown"
}

export async function POST(request: NextRequest) {
  const requestId = generateRequestId()
  const clientIP = getClientIP(request)

  try {
    const body: SessionCreateRequest = await request.json()
    const { couponIds, clientInfo } = body

    EVENT_TRACK("session_create_attempt", { couponIds, clientIP }, undefined, requestId)

    // Validate input
    if (!couponIds || !Array.isArray(couponIds) || couponIds.length !== 5) {
      EVENT_TRACK("session_create_failed", { reason: "invalid_coupons", couponIds }, undefined, requestId)
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          error: "Must provide exactly 5 coupon IDs",
          timestamp: new Date().toISOString(),
          requestId,
        },
        { status: 400 },
      )
    }

    // Security validation
    const securityCheck = security.validateSessionCreation(clientIP)
    if (!securityCheck.allowed) {
      EVENT_TRACK("session_create_blocked", { reason: securityCheck.reason, clientIP }, undefined, requestId)
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          error: securityCheck.reason || "Security check failed",
          timestamp: new Date().toISOString(),
          requestId,
        },
        { status: 429 },
      )
    }

    // Generate session
    const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    const seed = Math.floor(Math.random() * 1000000)
    const expiresAt = new Date(Date.now() + 30 * 60 * 1000).toISOString() // 30 minutes

    const session: GameSession = {
      sessionId,
      seed,
      couponIds: [...couponIds], // Clone array
      expiresAt,
      used: false,
      createdAt: new Date().toISOString(),
      clientIP,
      playCount: 0,
    }

    sessionManager.create(session)
    security.registerSession(clientIP, sessionId)

    EVENT_TRACK(
      "session_created",
      {
        sessionId,
        seed,
        couponCount: couponIds.length,
        expiresAt,
        clientIP,
      },
      sessionId,
      requestId,
    )

    const response: SessionCreateResponse = {
      sessionId: session.sessionId,
      seed: session.seed,
      expiresAt: session.expiresAt,
      couponIds: session.couponIds,
    }

    return NextResponse.json<ApiResponse<SessionCreateResponse>>({
      success: true,
      data: response,
      timestamp: new Date().toISOString(),
      requestId,
    })
  } catch (error) {
    EVENT_TRACK(
      "session_create_error",
      {
        error: error instanceof Error ? error.message : "Unknown error",
        clientIP,
      },
      undefined,
      requestId,
    )

    return NextResponse.json<ApiResponse>(
      {
        success: false,
        error: "Failed to create session",
        timestamp: new Date().toISOString(),
        requestId,
      },
      { status: 500 },
    )
  }
}

export async function GET(request: NextRequest) {
  const requestId = generateRequestId()
  const sessionId = request.nextUrl.searchParams.get("sessionId")

  if (!sessionId) {
    return NextResponse.json<ApiResponse>(
      {
        success: false,
        error: "Session ID required",
        timestamp: new Date().toISOString(),
        requestId,
      },
      { status: 400 },
    )
  }

  const session = sessionManager.get(sessionId)
  if (!session) {
    return NextResponse.json<ApiResponse>(
      {
        success: false,
        error: "Session not found",
        timestamp: new Date().toISOString(),
        requestId,
      },
      { status: 404 },
    )
  }

  // Don't expose sensitive data
  const publicSession = {
    sessionId: session.sessionId,
    expiresAt: session.expiresAt,
    used: session.used,
    playCount: session.playCount,
  }

  return NextResponse.json<ApiResponse>({
    success: true,
    data: publicSession,
    timestamp: new Date().toISOString(),
    requestId,
  })
}

// Export session manager for use in other API routes
export { sessionManager }
