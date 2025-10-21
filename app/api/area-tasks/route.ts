import { type NextRequest, NextResponse } from "next/server"
import { supabaseApi } from "@/lib/supabase-api"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const doctorId = searchParams.get("doctorId")
    const vhvId = searchParams.get("vhvId")

    if (doctorId) {
      const result = await supabaseApi.getAreaTasksByDoctor(doctorId)
      return NextResponse.json(result)
    }

    if (vhvId) {
      const result = await supabaseApi.getAreaTasksByVHV(vhvId)
      return NextResponse.json(result)
    }

    return NextResponse.json({ error: "doctorId or vhvId is required" }, { status: 400 })
  } catch (error) {
    console.error("Get area tasks error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to get area tasks" },
      { status: 500 },
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { title, description, district, vhvId, doctorId, priority, dueDate } = body

    if (!title || !vhvId || !doctorId) {
      return NextResponse.json({ error: "title, vhvId and doctorId are required" }, { status: 400 })
    }

    const result = await supabaseApi.createAreaTask({
      title,
      description,
      district,
      vhvId,
      doctorId,
      priority,
      dueDate: dueDate && `${dueDate}`.trim() !== "" ? dueDate : undefined,
    } as any)

    return NextResponse.json(result)
  } catch (error) {
    console.error("Create area task error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to create area task" },
      { status: 500 },
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, ...updateData } = body
    if (!id) return NextResponse.json({ error: "id is required" }, { status: 400 })

    const result = await supabaseApi.updateAreaTask(id, updateData)
    return NextResponse.json(result)
  } catch (error) {
    console.error("Update area task error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to update area task" },
      { status: 500 },
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")
    if (!id) return NextResponse.json({ error: "id is required" }, { status: 400 })
    await supabaseApi.deleteAreaTask(id)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Delete area task error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to delete area task" },
      { status: 500 },
    )
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")
    const action = searchParams.get("action")
    if (!id) return NextResponse.json({ error: "id is required" }, { status: 400 })

    if (action === "complete") {
      const body = await request.json().catch(() => ({}))
      const formData = body.formData || null

      const result = await supabaseApi.completeAreaTask(id, formData)
      return NextResponse.json(result)
    }

    if (action === "reopen") {
      const result = await supabaseApi.reopenAreaTask(id)
      return NextResponse.json(result)
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 })
  } catch (error) {
    console.error("Area task action error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to perform area task action" },
      { status: 500 },
    )
  }
}
