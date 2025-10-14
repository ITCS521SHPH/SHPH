"use client"

import { useState, useCallback } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Plus, Calendar, User, AlertCircle, CheckCircle, Clock, Target, Edit, Trash2, Filter } from "lucide-react"
import { tasksApi, patientsApi } from "@/lib/api"
import { useApiData } from "@/lib/useApiData"
import { getCurrentUserFromStorage } from "@/lib/auth"

interface TaskManagementProps {
  doctorId?: string
  patientId?: string
  vhvId?: string
}

export function TaskManagement({ doctorId, patientId, vhvId }: TaskManagementProps) {
  const currentUser = getCurrentUserFromStorage()
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [editingTask, setEditingTask] = useState<any>(null)
  const [filterStatus, setFilterStatus] = useState<string>("all")
  const [filterPriority, setFilterPriority] = useState<string>("all")

  const [taskForm, setTaskForm] = useState({
    title: "",
    description: "",
    patientId: patientId || "",
    vhvId: vhvId || "",
    priority: "MEDIUM" as "LOW" | "MEDIUM" | "HIGH" | "URGENT",
    dueDate: "",
  })

  // Get tasks based on the context
  const getTasks = useCallback(async () => {
    if (vhvId) {
      return tasksApi.getByVHV(vhvId)
    } else if (patientId) {
      return tasksApi.getByPatient(patientId)
    } else if (doctorId || currentUser?.id) {
      // Get all tasks created by this doctor
      const { getTasksByDoctor } = await import("@/lib/mock-data")
      return getTasksByDoctor(doctorId || currentUser?.id)
    }
    return []
  }, [vhvId, patientId, doctorId, currentUser?.id])

  const { data: tasks, loading: tasksLoading, refetch: refetchTasks } = useApiData(getTasks, [])

  // Get available patients and VHVs for task creation
  const getAvailablePatients = useCallback(async () => {
    if (doctorId || currentUser?.id) {
      return patientsApi.getAssignments(doctorId || currentUser?.id)
    }
    return []
  }, [doctorId, currentUser?.id])

  const { data: assignments } = useApiData(getAvailablePatients, [])

  const getAvailableVHVs = useCallback(async () => {
    return patientsApi.getAvailableVHVs()
  }, [])

  const { data: availableVHVs } = useApiData(getAvailableVHVs, [])

  const handleCreateTask = async () => {
    if (!taskForm.title || !taskForm.patientId || !taskForm.vhvId) {
      alert("Please fill in all required fields")
      return
    }

    try {
      await tasksApi.create({
        ...taskForm,
        doctorId: doctorId || currentUser?.id,
      })

      setTaskForm({
        title: "",
        description: "",
        patientId: patientId || "",
        vhvId: vhvId || "",
        priority: "MEDIUM",
        dueDate: "",
      })
      setShowCreateDialog(false)
      refetchTasks()
    } catch (error) {
      console.error("Failed to create task:", error)
      alert("Failed to create task. Please try again.")
    }
  }

  const handleEditTask = async () => {
    if (!editingTask || !taskForm.title) {
      alert("Please fill in all required fields")
      return
    }

    try {
      await tasksApi.update(editingTask.id, taskForm)
      setShowEditDialog(false)
      setEditingTask(null)
      refetchTasks()
    } catch (error) {
      console.error("Failed to update task:", error)
      alert("Failed to update task. Please try again.")
    }
  }

  const handleDeleteTask = async (taskId: string) => {
    if (!confirm("Are you sure you want to delete this task?")) {
      return
    }

    try {
      await tasksApi.delete(taskId)
      refetchTasks()
    } catch (error) {
      console.error("Failed to delete task:", error)
      alert("Failed to delete task. Please try again.")
    }
  }

  const handleCompleteTask = async (taskId: string) => {
    try {
      await tasksApi.complete(taskId)
      refetchTasks()
    } catch (error) {
      console.error("Failed to complete task:", error)
      alert("Failed to complete task. Please try again.")
    }
  }

  const openEditDialog = (task: any) => {
    setEditingTask(task)
    setTaskForm({
      title: task.title,
      description: task.description,
      patientId: task.patientId,
      vhvId: task.vhvId,
      priority: task.priority,
      dueDate: task.dueDate ? new Date(task.dueDate).toISOString().split("T")[0] : "",
    })
    setShowEditDialog(true)
  }

  // Filter tasks based on status and priority
  const filteredTasks =
    tasks?.filter((task: any) => {
      const statusMatch = filterStatus === "all" || task.status === filterStatus
      const priorityMatch = filterPriority === "all" || task.priority === filterPriority
      return statusMatch && priorityMatch
    }) || []

  // Calculate statistics
  const pendingTasks = tasks?.filter((t: any) => t.status === "PENDING").length || 0
  const inProgressTasks = tasks?.filter((t: any) => t.status === "IN_PROGRESS").length || 0
  const completedTasks = tasks?.filter((t: any) => t.status === "COMPLETED").length || 0
  const overdueTasks =
    tasks?.filter((t: any) => t.dueDate && new Date(t.dueDate) < new Date() && t.status !== "COMPLETED").length || 0

  const getPatientName = (patientId: string) => {
    const assignment = assignments?.find((a: any) => a.patient?.id === patientId)
    return assignment?.patient ? `${assignment.patient.firstName} ${assignment.patient.lastName}` : "Unknown Patient"
  }

  const getVHVName = (vhvId: string) => {
    const vhv = availableVHVs?.find((v: any) => v.id === vhvId)
    return vhv?.name || vhv?.email?.split("@")[0] || "Unknown VHV"
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "URGENT":
        return "destructive"
      case "HIGH":
        return "destructive"
      case "MEDIUM":
        return "secondary"
      case "LOW":
        return "outline"
      default:
        return "outline"
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "COMPLETED":
        return "default"
      case "IN_PROGRESS":
        return "secondary"
      case "PENDING":
        return "outline"
      default:
        return "outline"
    }
  }

  return (
    <div className="space-y-6">
      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Tasks</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingTasks}</div>
            <p className="text-xs text-muted-foreground">Awaiting action</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">In Progress</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{inProgressTasks}</div>
            <p className="text-xs text-muted-foreground">Being worked on</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{completedTasks}</div>
            <p className="text-xs text-muted-foreground">Successfully finished</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Overdue</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{overdueTasks}</div>
            <p className="text-xs text-muted-foreground">Past due date</p>
          </CardContent>
        </Card>
      </div>

      {/* Task Management */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Task Management</CardTitle>
              <CardDescription>Create and manage tasks for VHVs</CardDescription>
            </div>
            <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Task
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                  <DialogTitle>Create New Task</DialogTitle>
                  <DialogDescription>Assign a new task to a VHV for a specific patient.</DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="title">Task Title</Label>
                    <Input
                      id="title"
                      value={taskForm.title}
                      onChange={(e) => setTaskForm((prev) => ({ ...prev, title: e.target.value }))}
                      placeholder="Enter task title"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      value={taskForm.description}
                      onChange={(e) => setTaskForm((prev) => ({ ...prev, description: e.target.value }))}
                      placeholder="Describe the task in detail"
                      rows={3}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="patient">Patient</Label>
                      <Select
                        value={taskForm.patientId}
                        onValueChange={(value) => setTaskForm((prev) => ({ ...prev, patientId: value }))}
                        disabled={!!patientId}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select patient" />
                        </SelectTrigger>
                        <SelectContent>
                          {assignments?.map((assignment: any) => (
                            <SelectItem key={assignment.patient?.id} value={assignment.patient?.id}>
                              {assignment.patient?.firstName} {assignment.patient?.lastName}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="vhv">Assign to VHV</Label>
                      <Select
                        value={taskForm.vhvId}
                        onValueChange={(value) => setTaskForm((prev) => ({ ...prev, vhvId: value }))}
                        disabled={!!vhvId}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select VHV" />
                        </SelectTrigger>
                        <SelectContent>
                          {availableVHVs?.map((vhv: any) => (
                            <SelectItem key={vhv.id} value={vhv.id}>
                              {vhv.name || vhv.email.split("@")[0]}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="priority">Priority</Label>
                      <Select
                        value={taskForm.priority}
                        onValueChange={(value: any) => setTaskForm((prev) => ({ ...prev, priority: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="LOW">Low</SelectItem>
                          <SelectItem value="MEDIUM">Medium</SelectItem>
                          <SelectItem value="HIGH">High</SelectItem>
                          <SelectItem value="URGENT">Urgent</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="dueDate">Due Date (Optional)</Label>
                      <Input
                        id="dueDate"
                        type="date"
                        value={taskForm.dueDate}
                        onChange={(e) => setTaskForm((prev) => ({ ...prev, dueDate: e.target.value }))}
                      />
                    </div>
                  </div>
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleCreateTask}>Create Task</Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="flex items-center gap-4 mb-4">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4" />
              <Label>Filters:</Label>
            </div>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-[150px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="PENDING">Pending</SelectItem>
                <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                <SelectItem value="COMPLETED">Completed</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterPriority} onValueChange={setFilterPriority}>
              <SelectTrigger className="w-[150px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Priority</SelectItem>
                <SelectItem value="URGENT">Urgent</SelectItem>
                <SelectItem value="HIGH">High</SelectItem>
                <SelectItem value="MEDIUM">Medium</SelectItem>
                <SelectItem value="LOW">Low</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Tasks List */}
          <div className="space-y-4">
            {tasksLoading ? (
              <div className="text-center py-4">Loading tasks...</div>
            ) : filteredTasks.length === 0 ? (
              <div className="text-center py-4 text-muted-foreground">No tasks found</div>
            ) : (
              filteredTasks.map((task: any) => {
                const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && task.status !== "COMPLETED"
                return (
                  <Card
                    key={task.id}
                    className={`border-l-4 ${
                      task.status === "COMPLETED"
                        ? "border-l-green-500"
                        : task.status === "IN_PROGRESS"
                          ? "border-l-yellow-500"
                          : isOverdue
                            ? "border-l-red-500"
                            : task.priority === "HIGH" || task.priority === "URGENT"
                              ? "border-l-orange-500"
                              : "border-l-blue-500"
                    }`}
                  >
                    <CardContent className="pt-4">
                      <div className="flex items-start justify-between">
                        <div className="space-y-2 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="font-semibold">{task.title}</h3>
                            <Badge variant={getPriorityColor(task.priority)}>{task.priority}</Badge>
                            <Badge variant={getStatusColor(task.status)}>{task.status}</Badge>
                            {isOverdue && <Badge variant="destructive">OVERDUE</Badge>}
                          </div>
                          <p className="text-sm text-muted-foreground">{task.description}</p>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <User className="h-3 w-3" />
                              Patient: {getPatientName(task.patientId)}
                            </div>
                            <div className="flex items-center gap-1">
                              <User className="h-3 w-3" />
                              VHV: {getVHVName(task.vhvId)}
                            </div>
                            {task.dueDate && (
                              <div className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                Due: {new Date(task.dueDate).toLocaleDateString()}
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2 ml-4">
                          {task.status !== "COMPLETED" && (
                            <>
                              <Button variant="outline" size="sm" onClick={() => openEditDialog(task)}>
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button variant="outline" size="sm" onClick={() => handleCompleteTask(task.id)}>
                                <CheckCircle className="h-4 w-4" />
                              </Button>
                            </>
                          )}
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeleteTask(task.id)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })
            )}
          </div>
        </CardContent>
      </Card>

      {/* Edit Task Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Edit Task</DialogTitle>
            <DialogDescription>Update the task details.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="editTitle">Task Title</Label>
              <Input
                id="editTitle"
                value={taskForm.title}
                onChange={(e) => setTaskForm((prev) => ({ ...prev, title: e.target.value }))}
                placeholder="Enter task title"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="editDescription">Description</Label>
              <Textarea
                id="editDescription"
                value={taskForm.description}
                onChange={(e) => setTaskForm((prev) => ({ ...prev, description: e.target.value }))}
                placeholder="Describe the task in detail"
                rows={3}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="editPriority">Priority</Label>
                <Select
                  value={taskForm.priority}
                  onValueChange={(value: any) => setTaskForm((prev) => ({ ...prev, priority: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="LOW">Low</SelectItem>
                    <SelectItem value="MEDIUM">Medium</SelectItem>
                    <SelectItem value="HIGH">High</SelectItem>
                    <SelectItem value="URGENT">Urgent</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="editDueDate">Due Date (Optional)</Label>
                <Input
                  id="editDueDate"
                  type="date"
                  value={taskForm.dueDate}
                  onChange={(e) => setTaskForm((prev) => ({ ...prev, dueDate: e.target.value }))}
                />
              </div>
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleEditTask}>Update Task</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
