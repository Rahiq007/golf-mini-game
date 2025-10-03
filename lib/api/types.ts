export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  timestamp: string
  requestId: string
}

export interface SessionCreateRequest {
  couponIds: string[]
  clientInfo?: {
    userAgent?: string
    timestamp: number
  }
}

export interface SessionCreateResponse {
  sessionId: string
  seed: number
  expiresAt: string
  couponIds: string[]
}

export interface PlayRequest {
  sessionId: string
  input: {
    angle: number
    anglePhi: number // TODO:
    power: number
    timestamp: number
  }
}

export interface PlayResponse {
  verified: boolean
  outcome: "win" | "lose"
  awardedCoupon?: AwardedCoupon
  simulation: {
    finalPosition: { x: number; y: number }
    totalTime: number
    trajectoryLength: number
    maxHeight: number
    windEffect: { x: number; y: number }
    stoppedReason: string
  }
  debugInfo?: {
    processingTime: number
    sessionAge: number
  }
}

export interface AwardedCoupon {
  id: string
  code: string
  title: string
  description: string
  type: string
  value: number
  expiry: string
  awardedAt: string
  metadata: Record<string, any>
}

export interface WalletEntry {
  coupon: AwardedCoupon
  used: boolean
  usedAt?: string
}
