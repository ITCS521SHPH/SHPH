import { type NextRequest, NextResponse } from "next/server"
import { markNotificationAsRead } from "@/lib/notifications"

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params

    const success = await markNotificationAsRead(id)

    if (!success) {
      return NextResponse.json({ error: "Failed to mark notification as read" }, { status: 500 })
    }

    return NextResponse.json({ success: true, message: "Notification marked as read" })
  } catch (error: any) {
    console.error("[v0] Notification update error:", error)
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 })
  }
}
