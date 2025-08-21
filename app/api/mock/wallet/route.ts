import { type NextRequest, NextResponse } from "next/server"
import type { ApiResponse, WalletEntry } from "@/lib/api/types"

// Mock wallet storage (in production, this would be a database)
const walletStorage = new Map<string, WalletEntry[]>()

function generateRequestId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

export async function GET(request: NextRequest) {
  const requestId = generateRequestId()
  const userId = request.nextUrl.searchParams.get("userId") || "anonymous"

  try {
    const wallet = walletStorage.get(userId) || []

    return NextResponse.json<ApiResponse<WalletEntry[]>>({
      success: true,
      data: wallet,
      timestamp: new Date().toISOString(),
      requestId,
    })
  } catch (error) {
    return NextResponse.json<ApiResponse>(
      {
        success: false,
        error: "Failed to fetch wallet",
        timestamp: new Date().toISOString(),
        requestId,
      },
      { status: 500 },
    )
  }
}

export async function POST(request: NextRequest) {
  const requestId = generateRequestId()

  try {
    const { userId = "anonymous", coupon } = await request.json()

    if (!coupon) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          error: "Coupon data required",
          timestamp: new Date().toISOString(),
          requestId,
        },
        { status: 400 },
      )
    }

    const wallet = walletStorage.get(userId) || []
    const walletEntry: WalletEntry = {
      coupon,
      used: false,
    }

    wallet.push(walletEntry)
    walletStorage.set(userId, wallet)

    return NextResponse.json<ApiResponse<WalletEntry>>({
      success: true,
      data: walletEntry,
      timestamp: new Date().toISOString(),
      requestId,
    })
  } catch (error) {
    return NextResponse.json<ApiResponse>(
      {
        success: false,
        error: "Failed to add coupon to wallet",
        timestamp: new Date().toISOString(),
        requestId,
      },
      { status: 500 },
    )
  }
}
