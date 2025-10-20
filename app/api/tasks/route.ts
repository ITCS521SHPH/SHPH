import { type NextRequest, NextResponse } from "next/server"
import { supabaseApi } from "@/lib/supabase-api"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const doctorId = searchParams.get("doctorId")
    const vhvId = searchParams.get("vhvId")
    const patientId = searchParams.get("patientId")

    let result

    if (doctorId) {
      result = await supabaseApi.getTasksByDoctor(doctorId)
    } else if (vhvId) {
      result = await supabaseApi.getTasksByVHV(vhvId)
    } else if (patientId) {
      result = await supabaseApi.getTasksByPatient(patientId)
    } else {
      return NextResponse.json({ error: "doctorId, vhvId, or patientId is required" }, { status: 400 })
    }

    return NextResponse.json(result)
  } catch (error) {
    console.error("Get tasks error:", error)
    return NextResponse.json({ error: error instanceof Error ? error.message : "Failed to get tasks" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { title, description, patientId, vhvId, doctorId, priority, dueDate, areaTask, areaDistrict } = body

    if (!title || !vhvId || !doctorId) {
      return NextResponse.json({ error: "title, vhvId, and doctorId are required" }, { status: 400 })
    }

    if (!areaTask && !patientId) {
      return NextResponse.json({ error: "patientId is required for patient tasks" }, { status: 400 })
    }

    // For patient tasks, ensure assignment exists; for area tasks, skip
    if (!areaTask && patientId) {
      try {
        await supabaseApi.assignPatient({
          patientId,
          vhvId,
          doctorId,
        } as any)
      } catch (e) {
        console.warn("POST /api/tasks: assignment upsert warning", e)
      }
    }

    const result = await supabaseApi.createTask({
      title,
      description,
      patientId: areaTask ? undefined : patientId,
      vhvId,
      doctorId,
      priority,
      dueDate: dueDate && `${dueDate}`.trim() !== "" ? dueDate : undefined,
      areaTask: !!areaTask,
      areaDistrict,
    } as any)

    return NextResponse.json(result)
  } catch (error) {
    console.error("Create task error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to create task" },
      { status: 500 },
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, ...updateData } = body

    if (!id) {
      return NextResponse.json({ error: "Task ID is required" }, { status: 400 })
    }

    // Convert string dates to Date objects for the update function
    const processedUpdateData: any = { ...updateData }
    if (processedUpdateData.dueDate) {
      if (processedUpdateData.dueDate.trim() === "") {
        processedUpdateData.dueDate = undefined
      } else {
        processedUpdateData.dueDate = new Date(processedUpdateData.dueDate)
      }
    }
    if (processedUpdateData.completedAt) {
      processedUpdateData.completedAt = new Date(processedUpdateData.completedAt)
    }

    const result = await supabaseApi.updateTask(id, processedUpdateData)
    return NextResponse.json(result)
  } catch (error) {
    console.error("Update task error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to update task" },
      { status: 500 },
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")

    if (!id) {
      return NextResponse.json({ error: "Task ID is required" }, { status: 400 })
    }

    await supabaseApi.deleteTask(id)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Delete task error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to delete task" },
      { status: 500 },
    )
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")
    const action = searchParams.get("action")

    if (!id) {
      return NextResponse.json({ error: "Task ID is required" }, { status: 400 })
    }

    if (action === "complete") {
      const body = await request.json().catch(() => ({}))
      const formData = body.formData || null

      const result = await supabaseApi.completeTask(id, formData)
      return NextResponse.json(result)
    }

    if (action === "reopen") {
      const result = await supabaseApi.reopenTask(id)
      return NextResponse.json(result)
    }

    return NextResponse.json({ error: 'Invalid action. Use "complete" or "reopen"' }, { status: 400 })
  } catch (error) {
    console.error("Task action error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to perform task action" },
      { status: 500 },
    )
  }
}
