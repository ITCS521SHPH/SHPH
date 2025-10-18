"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { CheckCircle, Clock, AlertCircle, FileText } from "lucide-react"
import { tasksApi } from "@/lib/api"

type Task = {
  id: string
  title: string
  description: string
  status: string
  priority: string
  dueDate: string
  patientId?: string
  doctorId?: string
  completedAt?: string
  patient?: {
    firstName: string
    lastName: string
  }
}

type Props = {
  tasks: Task[]
  onTaskUpdate: () => void
}

export function TaskFormViewer({ tasks, onTaskUpdate }: Props) {
  const [selectedTask, setSelectedTask] = useState<Task | null>(null)
  const [completionNotes, setCompletionNotes] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleCompleteTask = async () => {
    if (!selectedTask) return

    setIsSubmitting(true)
    try {
      await tasksApi.update(selectedTask.id, {
        status: "COMPLETED",
        completedAt: new Date().toISOString(),
        notes: completionNotes,
      })

      alert("Task completed successfully!")
      setCompletionNotes("")
      setSelectedTask(null)
      onTaskUpdate()
    } catch (error) {
      console.error("Failed to complete task:", error)
      alert("Failed to complete task. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority?.toUpperCase()) {
      case "HIGH":
        return "bg-red-500"
      case "MEDIUM":
        return "bg-orange-500"
      case "LOW":
        return "bg-blue-500"
      default:
        return "bg-gray-500"
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status?.toUpperCase()) {
      case "COMPLETED":
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case "IN_PROGRESS":
        return <Clock className="h-4 w-4 text-blue-500" />
      case "PENDING":
        return <AlertCircle className="h-4 w-4 text-orange-500" />
      default:
        return <FileText className="h-4 w-4 text-gray-500" />
    }
  }

  const pendingTasks = tasks.filter((t) => t.status !== "COMPLETED")
  const completedTasks = tasks.filter((t) => t.status === "COMPLETED")

  return (
    <div className="space-y-6">
      {/* Pending Tasks */}
      <div>
        <h3 className="text-lg font-semibold mb-4">Pending Tasks ({pendingTasks.length})</h3>
        <div className="space-y-4">
          {pendingTasks.length === 0 ? (
            <Card>
              <CardContent className="pt-6 text-center text-muted-foreground">
                <CheckCircle className="h-12 w-12 mx-auto mb-2 text-green-500" />
                <p>No pending tasks. Great job!</p>
              </CardContent>
            </Card>
          ) : (
            pendingTasks.map((task) => (
              <Card
                key={task.id}
                className={`border-l-4 ${
                  task.priority === "HIGH"
                    ? "border-l-red-500"
                    : task.priority === "MEDIUM"
                      ? "border-l-orange-500"
                      : "border-l-blue-500"
                }`}
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-base flex items-center gap-2">
                        {getStatusIcon(task.status)}
                        {task.title}
                      </CardTitle>
                      <CardDescription className="mt-1">
                        {task.patient && (
                          <span>
                            Patient: {task.patient.firstName} {task.patient.lastName}
                          </span>
                        )}
                      </CardDescription>
                    </div>
                    <div className="flex flex-col gap-2 items-end">
                      <Badge className={getPriorityColor(task.priority)}>{task.priority || "NORMAL"}</Badge>
                      <Badge variant="outline" className="text-xs">
                        Due: {new Date(task.dueDate).toLocaleDateString()}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label className="text-sm font-medium">Task Description</Label>
                    <p className="text-sm text-muted-foreground mt-1">{task.description}</p>
                  </div>

                  {selectedTask?.id === task.id ? (
                    <div className="space-y-4 pt-4 border-t">
                      <div>
                        <Label htmlFor="completion-notes">Completion Notes *</Label>
                        <Textarea
                          id="completion-notes"
                          placeholder="Describe what you did to complete this task..."
                          value={completionNotes}
                          onChange={(e) => setCompletionNotes(e.target.value)}
                          rows={4}
                          className="mt-2"
                        />
                      </div>
                      <div className="flex gap-2">
                        <Button
                          onClick={handleCompleteTask}
                          disabled={!completionNotes.trim() || isSubmitting}
                          className="flex-1"
                        >
                          <CheckCircle className="h-4 w-4 mr-2" />
                          {isSubmitting ? "Submitting..." : "Mark as Complete"}
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => {
                            setSelectedTask(null)
                            setCompletionNotes("")
                          }}
                          disabled={isSubmitting}
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <Button onClick={() => setSelectedTask(task)} variant="default" className="w-full">
                      <FileText className="h-4 w-4 mr-2" />
                      Fill Task Form
                    </Button>
                  )}
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>

      {/* Completed Tasks */}
      {completedTasks.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold mb-4">Completed Tasks ({completedTasks.length})</h3>
          <div className="space-y-4">
            {completedTasks.map((task) => (
              <Card key={task.id} className="border-l-4 border-l-green-500 opacity-75">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-base flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        {task.title}
                      </CardTitle>
                      <CardDescription className="mt-1">
                        {task.patient && (
                          <span>
                            Patient: {task.patient.firstName} {task.patient.lastName}
                          </span>
                        )}
                      </CardDescription>
                    </div>
                    <Badge variant="default" className="bg-green-500">
                      Completed
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-sm text-muted-foreground">
                    Completed on: {task.completedAt ? new Date(task.completedAt).toLocaleDateString() : "N/A"}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
