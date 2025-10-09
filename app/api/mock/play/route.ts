import { type NextRequest, NextResponse } from "next/server"
import { createSimulator } from "@/lib/physics"
import { EVENT_TRACK } from "@/lib/api/telemetry"
import { security } from "@/lib/api/security"
import { sessionManager } from "@/lib/api/sessionManager"
import type { ApiResponse, PlayRequest, PlayResponse, AwardedCoupon } from "@/lib/api/types"

// Note: Simulator will be created per request with session-specific configuration

// Mock coupon data for reference
const COUPON_DATA = {
  c1: {
    title: "10% OFF - Sitewide",
    description: "10% off any order over $20",
    type: "percentage",
    value: 10,
    expiry: "2025-12-31",
    metadata: { minPurchase: 20 },
  },
  c2: {
    title: "$5 OFF",
    description: "$5 off your next purchase",
    type: "fixed",
    value: 5,
    expiry: "2025-12-31",
    metadata: { minPurchase: 0 },
  },
  c3: {
    title: "Free Shipping",
    description: "Free shipping on orders over $15",
    type: "shipping",
    value: 0,
    expiry: "2025-12-31",
    metadata: { minPurchase: 15 },
  },
  c4: {
    title: "15% OFF - Clearance",
    description: "15% off clearance items",
    type: "percentage",
    value: 15,
    expiry: "2025-12-31",
    metadata: {},
  },
  c5: {
    title: "Buy 1 Get 1",
    description: "Buy 1 Get 1 on select items",
    type: "bogo",
    value: 0,
    expiry: "2025-12-31",
    metadata: {},
  },
}

function generateRequestId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

function getClientIP(request: NextRequest): string {
  return request.ip || request.headers.get("x-forwarded-for") || "unknown"
}

export async function POST(request: NextRequest) {
  const requestId = generateRequestId()
  const clientIP = getClientIP(request)
  const startTime = Date.now()

  try {
    const body: PlayRequest = await request.json()
    const { sessionId, input } = body
    const { angle, anglePhi, power, timestamp } = input

    EVENT_TRACK(
      "play_attempt",
      {
        sessionId,
        angle,
        anglePhi,
        power,
        timestamp,
        clientIP,
      },
      sessionId,
      requestId,
    )

    // Validate session
    const session = sessionManager.get(sessionId)
    if (!session) {
      EVENT_TRACK("play_failed", { reason: "invalid_session", sessionId }, sessionId, requestId)
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          error: "Invalid session",
          timestamp: new Date().toISOString(),
          requestId,
        },
        { status: 404 },
      )
    }

    // Check if session expired
    if (new Date() > new Date(session.expiresAt)) {
      EVENT_TRACK("play_failed", { reason: "session_expired", sessionId }, sessionId, requestId)
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          error: "Session expired",
          timestamp: new Date().toISOString(),
          requestId,
        },
        { status: 410 },
      )
    }

    // Check if session already used
    if (session.used) {
      EVENT_TRACK("play_failed", { reason: "session_already_used", sessionId }, sessionId, requestId)
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          error: "Session already used",
          timestamp: new Date().toISOString(),
          requestId,
        },
        { status: 409 },
      )
    }

    // Security validation
    const securityCheck = security.validatePlay(sessionId, timestamp)
    if (!securityCheck.allowed) {
      security.reportSuspiciousActivity(clientIP)
      EVENT_TRACK(
        "play_blocked",
        {
          reason: securityCheck.reason,
          sessionId,
          clientIP,
        },
        sessionId,
        requestId,
      )

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

    // Validate input parameters
    if (typeof angle !== "number" || typeof power !== "number" || typeof anglePhi !== "number") {
      EVENT_TRACK(
        "play_failed",
        {
          reason: "invalid_input",
          angle: typeof angle,
          anglePhi: typeof anglePhi,
          power: typeof power,
        },
        sessionId,
        requestId,
      )

      return NextResponse.json<ApiResponse>(
        {
          success: false,
          error: "Invalid input parameters",
          timestamp: new Date().toISOString(),
          requestId,
        },
        { status: 400 },
      )
    }

    if (angle < -Math.PI / 2 || angle > Math.PI / 2 || power < 0 || power > 1 || anglePhi < -Math.PI / 2 || 
        anglePhi > Math.PI / 2) {
      EVENT_TRACK(
        "play_failed",
        {
          reason: "input_out_of_range",
          angle,
          anglePhi, 
          power,
        },
        sessionId,
        requestId,
      )

      return NextResponse.json<ApiResponse>(
        {
          success: false,
          error: "Input parameters out of valid range",
          timestamp: new Date().toISOString(),
          requestId,
        },
        { status: 400 },
      )
    }

    // Run deterministic simulation using CourseManager configuration
    const simulator = createSimulator() // Create with CourseManager config
    const result = simulator.simulate({
      angle,
      anglePhi,
      power,
      seed: session.seed,
    })

    let awardedCoupon: AwardedCoupon | undefined = undefined

    // If win, award coupon and mark session as used
    if (result.outcome === "win") {
      // Deterministically select coupon based on seed
      const couponIndex = session.seed % session.couponIds.length
      const couponId = session.couponIds[couponIndex]
      const couponInfo = COUPON_DATA[couponId as keyof typeof COUPON_DATA]

      if (couponInfo) {
        awardedCoupon = {
          id: couponId,
          code: `MOCK-${couponId.toUpperCase()}-${Date.now().toString(36)}`,
          title: couponInfo.title,
          description: couponInfo.description,
          type: couponInfo.type,
          value: couponInfo.value,
          expiry: couponInfo.expiry,
          awardedAt: new Date().toISOString(),
          metadata: couponInfo.metadata,
        }

        EVENT_TRACK(
          "coupon_awarded",
          {
            sessionId,
            couponId,
            couponCode: awardedCoupon.code,
            finalPosition: result.finalPosition,
          },
          sessionId,
          requestId,
        )
      }

      // Mark session as used
      session.used = true
      session.lastPlayAt = new Date().toISOString()
    }

    // Update session play count
    session.playCount += 1
    sessionManager.update(sessionId, session)

    const processingTime = Date.now() - startTime
    const sessionAge = Date.now() - new Date(session.createdAt).getTime()

    EVENT_TRACK(
      "play_completed",
      {
        sessionId,
        outcome: result.outcome,
        processingTime,
        finalDistance: Math.sqrt((result.finalPosition.x - 45) ** 2 + (result.finalPosition.y - 0) ** 2), // Why does this calc finalPosition.x - 45?
        totalTime: result.totalTime,
      },
      sessionId,
      requestId,
    )

    const response: PlayResponse = {
      verified: true,
      outcome: result.outcome,
      awardedCoupon,
      simulation: {
        finalPosition: result.finalPosition,
        totalTime: result.totalTime,
        trajectoryLength: result.trajectory.length,
        maxHeight: result.maxHeight,
        windEffect: result.windEffect,
        stoppedReason: result.stoppedReason,
      },
      debugInfo: {
        processingTime,
        sessionAge,
      },
    }

    return NextResponse.json<ApiResponse<PlayResponse>>({
      success: true,
      data: response,
      timestamp: new Date().toISOString(),
      requestId,
    })
  } catch (error) {
    const processingTime = Date.now() - startTime

    EVENT_TRACK(
      "play_error",
      {
        error: error instanceof Error ? error.message : "Unknown error",
        processingTime,
        clientIP,
      },
      undefined,
      requestId,
    )

    return NextResponse.json<ApiResponse>(
      {
        success: false,
        error: "Failed to process play",
        timestamp: new Date().toISOString(),
        requestId,
      },
      { status: 500 },
    )
  }
}
