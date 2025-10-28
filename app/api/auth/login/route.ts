import { type NextRequest, NextResponse } from "next/server"
import * as supabaseApi from "@/lib/supabase-api"

export async function POST(request: NextRequest) {
  try {
    console.log("[v0] Login API route called")

    const body = await request.json()
    const { email, password } = body

    console.log("[v0] Login request for email:", email)

    if (!email || !password) {
      return NextResponse.json({ error: "Email and password are required" }, { status: 400 })
    }

    const result = await supabaseApi.login({ email, password })
    console.log("[v0] Login successful, returning result")
    return NextResponse.json(result)
  } catch (error) {
    console.error("[v0] Login error in API route:", error)
    const errorMessage = error instanceof Error ? error.message : "Login failed"
    return NextResponse.json({ error: errorMessage }, { status: 401 })
  }
}
