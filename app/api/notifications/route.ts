import { type NextRequest, NextResponse } from "next/server"
import { getUnreadNotifications } from "@/lib/notifications"

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const userId = searchParams.get("userId")

    if (!userId) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 })
    }

    const notifications = await getUnreadNotifications(userId)

    return NextResponse.json(notifications)
  } catch (error: any) {
    console.error("[v0] Notification fetch error:", error)
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 })
  }
}
