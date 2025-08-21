import { NextResponse } from "next/server"

export interface Coupon {
  id: string
  title: string
  description: string
  type: "percentage" | "fixed" | "shipping" | "bogo"
  value: number
  expiry: string
  metadata: Record<string, any>
}

// Mock coupon data as specified in requirements
const MOCK_COUPONS: Coupon[] = [
  {
    id: "c1",
    title: "10% OFF - Sitewide",
    description: "10% off any order over $20",
    type: "percentage",
    value: 10,
    expiry: "2025-12-31",
    metadata: { minPurchase: 20 },
  },
  {
    id: "c2",
    title: "$5 OFF",
    description: "$5 off your next purchase",
    type: "fixed",
    value: 5,
    expiry: "2025-12-31",
    metadata: { minPurchase: 0 },
  },
  {
    id: "c3",
    title: "Free Shipping",
    description: "Free shipping on orders over $15",
    type: "shipping",
    value: 0,
    expiry: "2025-12-31",
    metadata: { minPurchase: 15 },
  },
  {
    id: "c4",
    title: "15% OFF - Clearance",
    description: "15% off clearance items",
    type: "percentage",
    value: 15,
    expiry: "2025-12-31",
    metadata: {},
  },
  {
    id: "c5",
    title: "Buy 1 Get 1",
    description: "Buy 1 Get 1 on select items",
    type: "bogo",
    value: 0,
    expiry: "2025-12-31",
    metadata: {},
  },
]

export async function GET() {
  return NextResponse.json({
    success: true,
    data: {
      coupons: MOCK_COUPONS,
    },
  })
}
