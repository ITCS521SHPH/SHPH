import { NextResponse } from "next/server"
import * as supabaseApi from "@/lib/supabase-api"

export async function GET(_request: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await ctx.params
    try {
      const task = await supabaseApi.getTaskById(id)
      return NextResponse.json({ kind: "patient", task })
    } catch (_e) {
      // fall through to area task
    }
    try {
      const area = await supabaseApi.getAreaTaskById(id)
      return NextResponse.json({ kind: "area", task: area })
    } catch (_e2) {}
    return NextResponse.json({ error: "Task not found" }, { status: 404 })
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || "Failed to load task" }, { status: 500 })
  }
}
