"use client"

import { useState, useCallback } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Plus, UserPlus, Calendar } from "lucide-react"
import { patientsApi } from "@/lib/api"
import { useApiData } from "@/lib/useApiData"
import { getCurrentUserFromStorage } from "@/lib/auth"

interface PatientAssignmentProps {
  doctorId?: string
  onAssignmentComplete?: () => void
}

export function PatientAssignment({ doctorId, onAssignmentComplete }: PatientAssignmentProps) {
  const currentUser = getCurrentUserFromStorage()
  const [showAssignDialog, setShowAssignDialog] = useState(false)
  const [selectedPatient, setSelectedPatient] = useState<any>(null)
  const [assignmentForm, setAssignmentForm] = useState({
    vhvId: "",
    tasks: [] as any[],
  })
  const [newTask, setNewTask] = useState({
    title: "",
    description: "",
    priority: "MEDIUM" as "LOW" | "MEDIUM" | "HIGH" | "URGENT",
    dueDate: "",
  })

  // Get all patients for assignment
  const getAllPatients = useCallback(async () => {
    return patientsApi.getAll()
  }, [])

  const { data: allPatients, loading: patientsLoading, refetch: refetchPatients } = useApiData(getAllPatients, [])

  // Get available VHVs
  const getAvailableVHVs = useCallback(async () => {
    return patientsApi.getAvailableVHVs()
  }, [])

  const { data: availableVHVs } = useApiData(getAvailableVHVs, [])

  // Get current assignments
  const getAssignments = useCallback(async () => {
    const effectiveDoctorId = doctorId || currentUser?.id
    if (effectiveDoctorId) {
      return patientsApi.getAssignments(effectiveDoctorId)
    }
    return []
  }, [doctorId, currentUser?.id])

  const { data: assignments, refetch: refetchAssignments } = useApiData(getAssignments, [])

  const handleOpenAssignDialog = (patient: any) => {
    setSelectedPatient(patient)
    setAssignmentForm({
      vhvId: "",
      tasks: [],
    })
    setShowAssignDialog(true)
  }

  const handleAddTask = () => {
    if (!newTask.title) {
      alert("Please enter a task title")
      return
    }

    setAssignmentForm((prev) => ({
      ...prev,
      tasks: [...prev.tasks, { ...newTask, id: Date.now().toString() }],
    }))

    setNewTask({
      title: "",
      description: "",
      priority: "MEDIUM",
      dueDate: "",
    })
  }

  const handleRemoveTask = (taskId: string) => {
    setAssignmentForm((prev) => ({
      ...prev,
      tasks: prev.tasks.filter((task) => task.id !== taskId),
    }))
  }

  const handleAssignPatient = async () => {
    if (!selectedPatient || !assignmentForm.vhvId) {
      alert("Please select a VHV")
      return
    }

    try {
      await patientsApi.assignVHV(selectedPatient.id, assignmentForm.vhvId, doctorId || currentUser?.id || '', assignmentForm.tasks)

      setShowAssignDialog(false)
      setSelectedPatient(null)
      refetchAssignments()
      refetchPatients()
      onAssignmentComplete?.()

      alert("Patient successfully assigned to VHV!")
    } catch (error) {
      console.error("Failed to assign patient:", error)
      alert("Failed to assign patient. Please try again.")
    }
  }

  // Get unassigned patients
  const assignedPatientIds = assignments?.map((a: any) => a.patient?.id) || []
  const unassignedPatients = allPatients?.filter((p: any) => !assignedPatientIds.includes(p.id)) || []

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

  return (
    <div className="space-y-6">
      {/* Current Assignments */}
      <Card>
        <CardHeader>
          <CardTitle>Current Patient Assignments</CardTitle>
          <CardDescription>Patients currently assigned to VHVs</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {assignments?.length === 0 ? (
              <div className="text-center py-4 text-muted-foreground">No patients assigned yet</div>
            ) : (
              assignments?.map((assignment: any) => (
                <Card key={assignment.id} className="border-l-4 border-l-green-500">
                  <CardContent className="pt-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold">
                            {assignment.patient?.firstName} {assignment.patient?.lastName}
                          </h3>
                          <Badge variant="default">{assignment.status}</Badge>
                          {assignment.tasks && assignment.tasks.length > 0 && (
                            <Badge variant="outline">
                              {assignment.tasks.length} task{assignment.tasks.length !== 1 ? "s" : ""}
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Assigned to: {assignment.vhv?.name || assignment.vhv?.email?.split("@")[0] || "Unknown VHV"}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Assigned: {new Date(assignment.assignedAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    {assignment.tasks && assignment.tasks.length > 0 && (
                      <div className="mt-3 pt-3 border-t">
                        <h4 className="font-medium text-sm mb-2">Assigned Tasks:</h4>
                        <div className="space-y-1">
                          {assignment.tasks.map((task: any) => (
                            <div key={task.id} className="flex items-center justify-between text-sm">
                              <span>{task.title}</span>
                              <div className="flex items-center gap-2">
                                <Badge variant={getPriorityColor(task.priority)} className="text-xs">
                                  {task.priority}
                                </Badge>
                                <Badge variant="outline" className="text-xs">
                                  {task.status}
                                </Badge>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Unassigned Patients */}
      <Card>
        <CardHeader>
          <CardTitle>Unassigned Patients</CardTitle>
          <CardDescription>Patients available for assignment to VHVs</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {patientsLoading ? (
              <div className="text-center py-4">Loading patients...</div>
            ) : unassignedPatients.length === 0 ? (
              <div className="text-center py-4 text-muted-foreground">All patients are assigned</div>
            ) : (
              unassignedPatients.map((patient: any) => (
                <Card key={patient.id} className="border-l-4 border-l-orange-500">
                  <CardContent className="pt-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <h3 className="font-semibold">
                          {patient.firstName} {patient.lastName}
                        </h3>
                        <p className="text-sm text-muted-foreground">ID: {patient.nationalId}</p>
                        <p className="text-sm text-muted-foreground">Phone: {patient.phone}</p>
                      </div>
                      <Button onClick={() => handleOpenAssignDialog(patient)}>
                        <UserPlus className="h-4 w-4 mr-2" />
                        Assign to VHV
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Assignment Dialog */}
      <Dialog open={showAssignDialog} onOpenChange={setShowAssignDialog}>
        <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              Assign Patient: {selectedPatient?.firstName} {selectedPatient?.lastName}
            </DialogTitle>
            <DialogDescription>Select a VHV and optionally create tasks for this patient assignment.</DialogDescription>
          </DialogHeader>
          <div className="space-y-6 py-4">
            {/* VHV Selection */}
            <div className="space-y-2">
              <Label htmlFor="vhv">Assign to VHV</Label>
              <Select
                value={assignmentForm.vhvId}
                onValueChange={(value) => setAssignmentForm((prev) => ({ ...prev, vhvId: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a VHV" />
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

            {/* Task Creation */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium">Tasks (Optional)</h3>
                <Badge variant="outline">{assignmentForm.tasks.length} tasks</Badge>
              </div>

              {/* Add New Task */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Add Task</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="taskTitle">Task Title</Label>
                    <Input
                      id="taskTitle"
                      value={newTask.title}
                      onChange={(e) => setNewTask((prev) => ({ ...prev, title: e.target.value }))}
                      placeholder="Enter task title"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="taskDescription">Description</Label>
                    <Textarea
                      id="taskDescription"
                      value={newTask.description}
                      onChange={(e) => setNewTask((prev) => ({ ...prev, description: e.target.value }))}
                      placeholder="Describe the task"
                      rows={2}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="taskPriority">Priority</Label>
                      <Select
                        value={newTask.priority}
                        onValueChange={(value: any) => setNewTask((prev) => ({ ...prev, priority: value }))}
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
                      <Label htmlFor="taskDueDate">Due Date (Optional)</Label>
                      <Input
                        id="taskDueDate"
                        type="date"
                        value={newTask.dueDate}
                        onChange={(e) => setNewTask((prev) => ({ ...prev, dueDate: e.target.value }))}
                      />
                    </div>
                  </div>
                  <Button onClick={handleAddTask} className="w-full">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Task
                  </Button>
                </CardContent>
              </Card>

              {/* Task List */}
              {assignmentForm.tasks.length > 0 && (
                <div className="space-y-2">
                  <h4 className="font-medium">Tasks to Assign:</h4>
                  {assignmentForm.tasks.map((task) => (
                    <Card key={task.id}>
                      <CardContent className="pt-4">
                        <div className="flex items-start justify-between">
                          <div className="space-y-1 flex-1">
                            <div className="flex items-center gap-2">
                              <h5 className="font-medium">{task.title}</h5>
                              <Badge variant={getPriorityColor(task.priority)}>{task.priority}</Badge>
                            </div>
                            {task.description && <p className="text-sm text-muted-foreground">{task.description}</p>}
                            {task.dueDate && (
                              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                                <Calendar className="h-3 w-3" />
                                Due: {new Date(task.dueDate).toLocaleDateString()}
                              </div>
                            )}
                          </div>
                          <Button variant="outline" size="sm" onClick={() => handleRemoveTask(task.id)}>
                            Remove
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setShowAssignDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleAssignPatient}>Assign Patient</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
