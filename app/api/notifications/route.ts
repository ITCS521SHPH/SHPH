import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase-server"

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient()
    const searchParams = request.nextUrl.searchParams
    const userId = searchParams.get("userId")
    const unreadOnly = searchParams.get("unreadOnly") === "true"

    if (!userId) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 })
    }

    let query = supabase
      .from("notifications")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })

    if (unreadOnly) {
      query = query.is("read_at", null)
    }

    const { data, error } = await query

    if (error) {
      console.error("[API] Error fetching notifications:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Transform snake_case to camelCase
    const notifications = (data || []).map((n: any) => ({
      id: n.id,
      userId: n.user_id,
      userRole: n.user_role,
      title: n.title,
      message: n.message,
      type: n.type,
      entityType: n.entity_type,
      entityId: n.entity_id,
      readAt: n.read_at,
      createdAt: n.created_at,
      updatedAt: n.updated_at,
    }))

    return NextResponse.json(notifications)
  } catch (error: any) {
    console.error("[API] Unexpected error:", error)
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 })
  }
}
