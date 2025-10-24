"use client"

import { useState, useCallback, useMemo, useEffect } from "react"
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
import {
  Plus,
  Calendar,
  User,
  AlertCircle,
  CheckCircle,
  Clock,
  Target,
  Edit,
  Trash2,
  Filter,
  ListChecks,
  Save,
  CopyPlus,
  Search,
  MapPin,
  FileText,
} from "lucide-react"
import { tasksApi, patientsApi, areaTasksApi } from "@/lib/api"
import { useApiData } from "@/lib/useApiData"
import { getCurrentUserFromStorage } from "@/lib/auth"
import { Checkbox } from "@/components/ui/checkbox"
import { ScrollArea } from "@/components/ui/scroll-area"
import { BANGKOK_DISTRICTS } from "@/lib/bangkok-districts"
import VhvMapSelector from "@/components/tasks/vhv-map-selector"
// Area workflow removed from UI

interface TaskManagementProps {
  doctorId?: string
  patientId?: string
  vhvId?: string
  defaultTaskType?: "patient" | "area"
}

export function TaskManagement({ doctorId, patientId, vhvId, defaultTaskType }: TaskManagementProps) {
  const currentUser = getCurrentUserFromStorage()
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [editingTask, setEditingTask] = useState<any>(null)
  const [filterStatus, setFilterStatus] = useState<string>("all")
  const [filterPriority, setFilterPriority] = useState<string>("all")
  const [selectedVhvIds, setSelectedVhvIds] = useState<string[]>(vhvId ? [vhvId] : [])
  const [vhvSearch, setVhvSearch] = useState<string>("")
  const [taskType, setTaskType] = useState<"patient" | "area">(defaultTaskType || "patient")
  const [filterType, setFilterType] = useState<"all" | "patient" | "area">("all")
  const [selectedDistrict, setSelectedDistrict] = useState<string>("")
  const [useMapSelector, setUseMapSelector] = useState(false)
  const [selectedDistricts, setSelectedDistricts] = useState<string[]>([])
  const chosenDistricts = useMemo(
    () => (useMapSelector ? selectedDistricts : selectedDistrict ? [selectedDistrict] : []),
    [useMapSelector, selectedDistricts, selectedDistrict],
  )

  const [taskForm, setTaskForm] = useState({
    title: "",
    description: "",
    patientId: patientId || "",
    vhvId: vhvId || "",
    priority: "medium" as "low" | "medium" | "high" | "urgent",
    dueDate: "",
  })

  // Form builder state
  type Question = {
    id: string
    text: string
    type: "open" | "close"
    options?: string[]
  }
  const [questions, setQuestions] = useState<Question[]>([])
  const [newQuestion, setNewQuestion] = useState<{
    text: string
    type: "open" | "close"
    optionInput: string
    options: string[]
  }>({
    text: "",
    type: "open",
    optionInput: "",
    options: [],
  })
  const [editingQuestionId, setEditingQuestionId] = useState<string | null>(null)

  // Templates (local persistence for now)
  type TaskTemplate = {
    id: string
    name: string
    title: string
    description: string
    questions: Question[]
  }
  const [templates, setTemplates] = useState<TaskTemplate[]>([])
  const templatesKey = useMemo(
    () => `taskTemplates_${doctorId || currentUser?.id || "unknown"}`,
    [doctorId, currentUser?.id],
  )

  // Get tasks based on the context
  const getTasks = useCallback(async () => {
    if (vhvId) {
      const [patientTasks, areaTasks] = await Promise.all([
        tasksApi.getByVHV(vhvId),
        areaTasksApi.getByVHV(vhvId).catch(() => []),
      ])
      return [...patientTasks, ...areaTasks]
    } else if (patientId) {
      return tasksApi.getByPatient(patientId)
    } else if (doctorId || currentUser?.id) {
      const effectiveDoctorId = doctorId || currentUser?.id
      if (effectiveDoctorId) {
        const [patientTasks, areaTasks] = await Promise.all([
          tasksApi.getByDoctor(effectiveDoctorId),
          areaTasksApi.getByDoctor(effectiveDoctorId).catch(() => []),
        ])
        return [...patientTasks, ...areaTasks]
      }
    }
    return []
  }, [vhvId, patientId, doctorId, currentUser?.id])

  const { data: tasks, loading: tasksLoading, refetch: refetchTasks } = useApiData(getTasks, [])

  // Debug logging for tasks
  console.log("TaskManagement - tasks:", tasks)
  console.log("TaskManagement - tasksLoading:", tasksLoading)
  console.log("TaskManagement - currentUser:", currentUser)
  console.log("TaskManagement - doctorId:", doctorId)

  // Get available patients and VHVs for task creation
  const getAvailablePatients = useCallback(async () => {
    const effectiveDoctorId = doctorId || currentUser?.id
    if (effectiveDoctorId) {
      return patientsApi.getAssignments(effectiveDoctorId)
    }
    return []
  }, [doctorId, currentUser?.id])

  const {
    data: assignments,
    loading: assignmentsLoading,
    error: assignmentsError,
  } = useApiData(getAvailablePatients, [])

  // Debug logging
  console.log("TaskManagement - assignments:", assignments)
  console.log("TaskManagement - assignmentsLoading:", assignmentsLoading)
  console.log("TaskManagement - assignmentsError:", assignmentsError)

  const getAvailableVHVs = useCallback(async () => {
    return patientsApi.getAvailableVHVs()
  }, [])

  const { data: availableVHVs } = useApiData(getAvailableVHVs, [])
  // No tabs; keep taskType independent. Filter is handled via filterType.

  // UI helper: filter VHVs by search term and, for area tasks, by district
  const filteredVHVs = useMemo(() => {
    try {
      let list = (availableVHVs || []) as any[]
      const term = vhvSearch.trim().toLowerCase()
      if (term) {
        list = list.filter(
          (v: any) => v.email?.toLowerCase().includes(term) || v.district?.toLowerCase().includes(term),
        )
      }
      return list
    } catch {
      return [] as any[]
    }
  }, [availableVHVs, vhvSearch])

  const selectedVhvCount = vhvId ? 1 : selectedVhvIds.length
  const areaCount = chosenDistricts.length
  const hasSelectedVhvs = selectedVhvCount > 0
  const hasPatientTarget = taskType === "patient" ? !!patientId || !!taskForm.patientId : true
  const createEnabled =
    Boolean(taskForm.title.trim()) &&
    questions.length > 0 &&
    hasPatientTarget &&
    (taskType === "patient" ? hasSelectedVhvs : areaCount > 0 || hasSelectedVhvs)

  // Template helpers
  const loadTemplates = useCallback(() => {
    try {
      const raw = typeof window !== "undefined" ? localStorage.getItem(templatesKey) : null
      if (!raw) return []
      const parsed = JSON.parse(raw)
      return Array.isArray(parsed) ? parsed : []
    } catch {
      return []
    }
  }, [templatesKey])

  const saveTemplates = (list: TaskTemplate[]) => {
    if (typeof window !== "undefined") {
      localStorage.setItem(templatesKey, JSON.stringify(list))
    }
  }

  useEffect(() => {
    setTemplates(loadTemplates())
  }, [loadTemplates])

  useEffect(() => {
    if (taskType === "area") {
      setUseMapSelector(true)
    } else {
      setUseMapSelector(false)
      setSelectedDistricts([])
    }
  }, [taskType])

  useEffect(() => {
    if (taskType === "area") {
      setUseMapSelector(true)
    } else {
      setUseMapSelector(false)
      setSelectedDistricts([])
    }
  }, [taskType])

  const handleSaveTemplate = () => {
    if (!taskForm.title || questions.length === 0) {
      alert("Template requires a title and at least one question")
      return
    }
    const name = prompt("Template name")?.trim()
    if (!name) return
    const template: TaskTemplate = {
      id: `${Date.now()}`,
      name,
      title: taskForm.title,
      description: taskForm.description,
      questions,
    }
    const updated = [template, ...templates]
    setTemplates(updated)
    saveTemplates(updated)
    alert("Template saved")
  }

  const applyTemplate = (templateId: string) => {
    const t = templates.find((x) => x.id === templateId)
    if (!t) return
    setTaskForm((prev) => ({ ...prev, title: t.title, description: t.description }))
    setQuestions(t.questions)
  }

  // Embed form schema into description using a marker that VHV can later parse if needed
  const FORM_OPEN = "<FORM_SCHEMA>"
  const FORM_CLOSE = "</FORM_SCHEMA>"
  const FORM_REGEX = /<FORM_SCHEMA>[\s\S]*?<\/FORM_SCHEMA>/gi
  const buildDescriptionWithSchema = (base: string, qs: Question[]) => {
    const cleanBase = (base || "").replace(FORM_REGEX, "").trim()
    const schema = { questions: qs }
    return `${cleanBase}\n\n${FORM_OPEN}${JSON.stringify(schema)}${FORM_CLOSE}`.trim()
  }
  const stripFormSchema = (text?: string) => {
    if (!text) return ""
    try {
      return text.replace(FORM_REGEX, "").trim()
    } catch {
      return text
    }
  }

  const AREA_OPEN = "<AREA_DISTRICT>"
  const AREA_CLOSE = "</AREA_DISTRICT>"
  const AREA_REGEX = /<AREA_DISTRICT>(.*?)<\/AREA_DISTRICT>/i
  const embedAreaDistrict = (text: string, district: string) => {
    const trimmed = text.trim()
    return `${AREA_OPEN}${district}${AREA_CLOSE}${trimmed ? `\n\n${trimmed}` : ""}`.trim()
  }
  const extractAreaInfo = (text?: string) => {
    if (!text) return { district: undefined, remainder: "" }
    const match = text.match(AREA_REGEX)
    const district = match ? match[1]?.trim() : undefined
    const remainder = match ? text.replace(AREA_REGEX, "").trim() : text
    return { district, remainder }
  }

  // Multi-VHV selection helpers
  const toggleVhvSelection = (id: string) => {
    setSelectedVhvIds((prev) => (prev.includes(id) ? prev.filter((v) => v !== id) : [...prev, id]))
  }

  // District selection helper (select all VHVs in district)
  const selectByDistrict = (district: string) => {
    setSelectedDistrict(district)
    if (taskType === "area" && !useMapSelector) {
      setSelectedDistricts(district ? [district] : [])
    }
    try {
      const list = (availableVHVs || []) as any[]
      const inDistrict = district ? list.filter((v) => (v as any).district === district) : []
      setSelectedVhvIds(inDistrict.map((v) => (v as any).id))
    } catch {
      setSelectedVhvIds([])
    }
  }

  const toggleDistrictMulti = (district: string) => {
    setSelectedDistricts((prev) => (prev.includes(district) ? prev.filter((d) => d !== district) : [...prev, district]))
  }

  const handleCreateTask = async () => {
    const effectiveDoctorId = doctorId || currentUser?.id
    const hasVhvContext = !!vhvId
    const targetVhvs = hasVhvContext ? [vhvId!] : selectedVhvIds

    if (!taskForm.title || !effectiveDoctorId) {
      alert("Please fill in required fields: Title")
      return
    }
    if (questions.length === 0) {
      alert("Please add at least one question (open or close ended)")
      return
    }
    if (!hasVhvContext && targetVhvs.length === 0) {
      alert("Please select at least one VHV or choose a district")
      return
    }

    try {
      const descWithSchema = buildDescriptionWithSchema(taskForm.description, questions)
      const createFor = targetVhvs.length > 0 ? targetVhvs : []

      if (taskType === "area") {
        if (areaCount === 0 && createFor.length === 0) {
          alert("Select at least one district or VHV for area tasks")
          return
        }

        const vhvList = (availableVHVs || []) as any[]
        const vhvById = new Map(vhvList.map((v) => [v.id, v]))

        if (createFor.length > 0) {
          const byDistrict = new Map<string, string[]>()
          for (const vid of createFor) {
            const v = vhvById.get(vid)
            const d = (v?.district || "").trim()
            if (!d) continue
            if (!byDistrict.has(d)) byDistrict.set(d, [])
            byDistrict.get(d)!.push(vid)
          }

          for (const [district, vids] of byDistrict.entries()) {
            const base = {
              title: taskForm.title,
              description: descWithSchema,
              district,
              priority: taskForm.priority,
              dueDate: taskForm.dueDate,
              doctorId: effectiveDoctorId,
            }
            for (const vid of vids) {
              await areaTasksApi.create({ ...base, vhvId: vid })
            }
          }
        }

        if (areaCount > 0) {
          for (const district of chosenDistricts) {
            const base = {
              title: taskForm.title,
              description: descWithSchema,
              district,
              priority: taskForm.priority,
              dueDate: taskForm.dueDate,
              doctorId: effectiveDoctorId,
            }
            const inDistrict = vhvList.filter((v) => (v as any).district === district)
            for (const v of inDistrict) {
              await areaTasksApi.create({ ...base, vhvId: (v as any).id })
            }
          }
        }
      } else {
        // Patient task
        if (!taskForm.patientId) {
          alert("Please select a patient")
          return
        }
        const payloadBase = {
          title: taskForm.title,
          description: descWithSchema,
          patientId: taskForm.patientId,
          priority: taskForm.priority,
          dueDate: taskForm.dueDate,
          doctorId: effectiveDoctorId,
        }
        for (const vid of createFor) {
          await tasksApi.create({ ...payloadBase, vhvId: vid })
        }
      }

      // Reset form after successful creation
      setTaskForm({
        title: "",
        description: "",
        patientId: patientId || "",
        vhvId: vhvId || "",
        priority: "medium",
        dueDate: "",
      })
      setQuestions([])
      setSelectedVhvIds(vhvId ? [vhvId] : [])
      setVhvSearch("")
      setSelectedDistrict("")
      setSelectedDistricts([])
      setUseMapSelector(false)
      setShowCreateDialog(false)
      refetchTasks()
    } catch (error) {
      console.error("Failed to create task:", error)
      const message = error instanceof Error ? error.message : "Unknown error"
      alert(`Failed to create task: ${message}`)
    }
  }

  const handleEditTask = async () => {
    if (!editingTask || !taskForm.title) {
      alert("Please fill in all required fields")
      return
    }

    try {
      // Preserve embedded form schema if present on existing task
      const existingSchema = parseFormSchema(editingTask?.description)
      const nextDescription = existingSchema
        ? buildDescriptionWithSchema(taskForm.description, existingSchema.questions || [])
        : taskForm.description
      const isAreaTask = !editingTask?.patientId
      if (isAreaTask) {
        await areaTasksApi.update(editingTask.id, {
          title: taskForm.title,
          description: nextDescription,
          priority: taskForm.priority,
          dueDate: taskForm.dueDate,
          district: selectedDistrict || editingTask.district,
        })
      } else {
        await tasksApi.update(editingTask.id, { ...taskForm, description: nextDescription })
      }
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
      const t = tasks?.find((x: any) => x.id === taskId)
      if (t && !t.patientId) {
        await areaTasksApi.delete(taskId)
      } else {
        await tasksApi.delete(taskId)
      }
      refetchTasks()
    } catch (error) {
      console.error("Failed to delete task:", error)
      alert("Failed to delete task. Please try again.")
    }
  }

  const handleCompleteTask = async (taskId: string) => {
    try {
      const t = tasks?.find((x: any) => x.id === taskId)
      if (t && !t.patientId) {
        await areaTasksApi.complete(taskId)
      } else {
        await tasksApi.complete(taskId)
      }
      refetchTasks()
    } catch (error) {
      console.error("Failed to complete task:", error)
      alert("Failed to complete task. Please try again.")
    }
  }

  const openEditDialog = (task: any) => {
    setEditingTask(task)
    const isAreaTask = !task.patientId
    setTaskType(isAreaTask ? "area" : "patient")
    const { district, remainder } = extractAreaInfo(task.description)
    if (isAreaTask) {
      setSelectedDistrict(task.district || district || "")
    } else {
      setSelectedDistrict("")
    }
    if (task.vhvId) {
      setSelectedVhvIds([task.vhvId])
    }

    const existingSchema = parseFormSchema(task.description)
    if (existingSchema && existingSchema.questions) {
      setQuestions(existingSchema.questions)
    } else {
      setQuestions([])
    }

    setTaskForm({
      title: task.title,
      description: stripFormSchema(remainder),
      patientId: isAreaTask ? "" : task.patientId,
      vhvId: task.vhvId,
      priority: task.priority,
      dueDate: task.dueDate ? new Date(task.dueDate).toISOString().split("T")[0] : "",
    })
    setShowEditDialog(true)
  }

  // Filter tasks based on status and priority
  const filteredTasks =
    tasks?.filter((task: any) => {
      const normStatus = (task.status || "").toString().toLowerCase()
      const normPriority = (task.priority || "").toString().toLowerCase()
      const statusMatch = filterStatus === "all" || normStatus === filterStatus
      const priorityMatch = filterPriority === "all" || normPriority === filterPriority
      const isPatientTask = !!task.patientId
      const typeMatch = filterType === "all" ? true : filterType === "patient" ? isPatientTask : !isPatientTask
      return statusMatch && priorityMatch && typeMatch
    }) || []

  // Calculate statistics
  const pendingTasks =
    filteredTasks.filter((t: any) => (t.status || "").toString().toLowerCase() === "pending").length || 0
  const inProgressTasks =
    filteredTasks.filter((t: any) => (t.status || "").toString().toLowerCase() === "in_progress").length || 0
  const completedTasks =
    filteredTasks.filter((t: any) => (t.status || "").toString().toLowerCase() === "completed").length || 0
  const overdueTasks =
    filteredTasks.filter(
      (t: any) =>
        t.dueDate && new Date(t.dueDate) < new Date() && (t.status || "").toString().toLowerCase() !== "completed",
    ).length || 0

  const getPatientName = (patientId: string) => {
    const assignment = assignments?.find((a: any) => a.patient?.id === patientId)
    if (!assignment?.patient) return "Unknown Patient"
    const p = assignment.patient
    if (p.firstName === "Area Task" || p.firstName === "Area") {
      const label = p.district || p.lastName || "Unknown Area"
      return `Area: ${label}`
    }
    return `${p.firstName} ${p.lastName}`
  }

  const getVHVName = (vhvId: string) => {
    const vhv = availableVHVs?.find((v: any) => v.id === vhvId)
    return vhv?.email?.split("@")[0] || "Unknown VHV"
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "urgent":
        return "destructive"
      case "high":
        return "destructive"
      case "medium":
        return "secondary"
      case "low":
        return "outline"
      default:
        return "outline"
    }
  }

  const getStatusColor = (status: string) => {
    switch ((status || "").toString().toLowerCase()) {
      case "completed":
        return "default"
      case "in_progress":
        return "secondary"
      case "pending":
        return "outline"
      default:
        return "outline"
    }
  }

  const parseFormSchema = (description: string | undefined) => {
    if (!description) return null
    const start = description.indexOf(FORM_OPEN)
    const end = description.indexOf(FORM_CLOSE)
    if (start === -1 || end === -1 || end <= start) return null
    const json = description.substring(start + FORM_OPEN.length, end)
    try {
      return JSON.parse(json)
    } catch {
      return null
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
              <DialogContent className="w-full sm:max-w-[1000px] lg:max-w-[1200px] max-h-[85vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Create New Task</DialogTitle>
                  <DialogDescription>
                    Fill in task details, assign to VHVs, and add the data items to collect.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-6 py-4">
                  <div className="text-xs uppercase tracking-wide text-muted-foreground">Basic Info</div>
                  <div className="space-y-2">
                    <Label htmlFor="title">Task Title</Label>
                    <Input
                      id="title"
                      value={taskForm.title}
                      onChange={(e) => setTaskForm((prev) => ({ ...prev, title: e.target.value }))}
                      placeholder="e.g. Follow-up assessment, blood pressure check"
                    />
                    <p className="text-xs text-muted-foreground">
                      Clear titles help VHVs understand the ask at a glance.
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      value={taskForm.description}
                      onChange={(e) => setTaskForm((prev) => ({ ...prev, description: e.target.value }))}
                      placeholder="Add context, instructions, and any notes for the VHV"
                      rows={3}
                    />
                    <p className="text-xs text-muted-foreground">
                      Use concise instructions. You can save this setup as a template.
                    </p>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Task Type</Label>
                      <Select value={taskType} onValueChange={(v: any) => setTaskType(v)}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="patient">For Patient</SelectItem>
                          <SelectItem value="area">For Area (by District)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  {/* Template controls */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Load Template</Label>
                      <Select onValueChange={applyTemplate}>
                        <SelectTrigger>
                          <SelectValue placeholder={templates.length ? "Choose template" : "No templates saved"} />
                        </SelectTrigger>
                        <SelectContent>
                          {templates.map((t) => (
                            <SelectItem key={t.id} value={t.id}>
                              {t.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex items-end">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={handleSaveTemplate}
                        className="w-full bg-transparent"
                      >
                        <Save className="h-4 w-4 mr-2" /> Save as Template
                      </Button>
                    </div>
                  </div>

                  <div className="text-xs uppercase tracking-wide text-muted-foreground">Data To Collect</div>
                  {/* Form builder */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <ListChecks className="h-4 w-4" />
                      <Label>Data to Collect (at least one)</Label>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      These items appear in the VHV form and will be embedded in the task description.
                    </p>

                    {/* Add / edit question */}
                    <div className="grid grid-cols-1 md:grid-cols-5 gap-2 items-end">
                      <div className="md:col-span-3">
                        <Input
                          placeholder="Question text"
                          value={newQuestion.text}
                          onChange={(e) => setNewQuestion((prev) => ({ ...prev, text: e.target.value }))}
                        />
                      </div>
                      <div className="md:col-span-1">
                        <Select
                          value={newQuestion.type}
                          onValueChange={(v: any) => setNewQuestion((prev) => ({ ...prev, type: v }))}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="open">Open-ended</SelectItem>
                            <SelectItem value="close">Close-ended</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="md:col-span-1 flex justify-end">
                        <Button
                          type="button"
                          onClick={() => {
                            if (!newQuestion.text.trim()) return
                            if (editingQuestionId) {
                              setQuestions((prev) =>
                                prev.map((q) =>
                                  q.id === editingQuestionId
                                    ? {
                                        ...q,
                                        text: newQuestion.text,
                                        type: newQuestion.type,
                                        options: newQuestion.type === "close" ? [...newQuestion.options] : undefined,
                                      }
                                    : q,
                                ),
                              )
                              setEditingQuestionId(null)
                            } else {
                              setQuestions((prev) => [
                                ...prev,
                                {
                                  id: `${Date.now()}`,
                                  text: newQuestion.text.trim(),
                                  type: newQuestion.type,
                                  options: newQuestion.type === "close" ? [...newQuestion.options] : undefined,
                                },
                              ])
                            }
                            setNewQuestion({ text: "", type: "open", optionInput: "", options: [] })
                          }}
                        >
                          {editingQuestionId ? "Update Question" : "Add Question"}
                        </Button>
                      </div>
                    </div>
                    {newQuestion.type === "close" && (
                      <div className="grid grid-cols-1 md:grid-cols-5 gap-2 items-end">
                        <div className="md:col-span-3">
                          <Input
                            placeholder="Add option"
                            value={newQuestion.optionInput}
                            onChange={(e) => setNewQuestion((prev) => ({ ...prev, optionInput: e.target.value }))}
                          />
                        </div>
                        <div className="md:col-span-1 flex items-end">
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => {
                              if (!newQuestion.optionInput.trim()) return
                              setNewQuestion((prev) => ({
                                ...prev,
                                options: [...prev.options, prev.optionInput.trim()],
                                optionInput: "",
                              }))
                          }}
                          >
                            Add Option
                          </Button>
                        </div>
                        {newQuestion.options.length > 0 && (
                          <div className="md:col-span-5 flex flex-wrap gap-2 text-xs text-muted-foreground">
                            {newQuestion.options.map((opt: string, i: number) => (
                              <span key={i} className="px-2 py-1 rounded border bg-muted/50">
                                {opt}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Questions list */}
                    <div className="border rounded p-2">
                      {questions.length === 0 ? (
                        <div className="text-sm text-muted-foreground">No questions added yet</div>
                      ) : (
                        <div className="space-y-2">
                          {questions.map((q, idx) => (
                            <div key={q.id} className="flex items-start justify-between bg-muted/30 rounded p-2">
                              <div className="text-sm">
                                <div className="font-medium">
                                  {idx + 1}. {q.text}{" "}
                                  <span className="text-muted-foreground">
                                    ({q.type === "open" ? "Open-ended" : "Close-ended"})
                                  </span>
                                </div>
                                {q.type === "close" && q.options && q.options.length > 0 && (
                                  <div className="text-xs text-muted-foreground">Options: {q.options.join(", ")}</div>
                                )}
                              </div>
                              <div className="flex items-center gap-2">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => {
                                    setEditingQuestionId(q.id)
                                    setNewQuestion({ text: q.text, type: q.type, optionInput: "", options: q.options || [] })
                                  }}
                                >
                                  Edit
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="text-red-600 hover:text-red-700 bg-transparent"
                                  onClick={() => setQuestions((prev) => prev.filter((x) => x.id !== q.id))}
                                >
                                  Delete
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    {taskType === "patient" && (
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
                            {(() => {
                              const uniquePatients =
                                assignments?.reduce((uniquePatients: any[], assignment: any) => {
                                  if (
                                    assignment.patient &&
                                    !uniquePatients.find((p) => p.id === assignment.patient.id)
                                  ) {
                                    uniquePatients.push(assignment.patient)
                                  }
                                  return uniquePatients
                                }, []) || []

                              return uniquePatients.map((patient: any) => (
                                <SelectItem key={patient.id} value={patient.id}>
                                  {patient.firstName} {patient.lastName}
                                </SelectItem>
                              ))
                            })()}
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                    <div className={"space-y-3 " + (taskType === "area" ? "md:col-span-2" : "")}>
                      <Label>{taskType === "area" ? "Areas & VHVs" : "Assign to VHVs"}</Label>
                      {vhvId ? (
                        <Input
                          value={
                            availableVHVs?.find((v: any) => v.id === vhvId)?.email?.split("@")[0] || "Selected VHV"
                          }
                          disabled
                        />
                      ) : (
                        <div className="border rounded-lg p-4 space-y-4">
                          {taskType === "area" && (
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <p className="text-xs text-muted-foreground">
                                Use the interactive map to highlight districts or switch to the list to pick manually.
                              </p>
                              <div className="flex gap-2">
                                <Button
                                  type="button"
                                  size="sm"
                                  variant={useMapSelector ? "secondary" : "outline"}
                                  onClick={() => setUseMapSelector(true)}
                                >
                                  Map
                                </Button>
                                <Button
                                  type="button"
                                  size="sm"
                                  variant={!useMapSelector ? "secondary" : "outline"}
                                  onClick={() => setUseMapSelector(false)}
                                >
                                  List
                                </Button>
                              </div>
                            </div>
                          )}
                          {taskType === "area" && useMapSelector ? (
                            <VhvMapSelector
                              vhvs={(availableVHVs || []) as any[]}
                              selectedDistricts={selectedDistricts}
                              onToggleDistrict={toggleDistrictMulti}
                              selectedVhvIds={selectedVhvIds}
                              onToggleVhv={toggleVhvSelection}
                              mode="area"
                            />
                          ) : (
                            <div className="space-y-3">
                              <div className="grid grid-cols-1 sm:grid-cols-[minmax(0,1fr)_auto] gap-2">
                                <Select value={selectedDistrict} onValueChange={(v) => selectByDistrict(v)}>
                                  <SelectTrigger>
                                    <SelectValue
                                      placeholder={taskType === "area" ? "Select district" : "Filter by district"}
                                    />
                                  </SelectTrigger>
                                  <SelectContent className="max-h-64 overflow-y-auto">
                                    {BANGKOK_DISTRICTS.map((d) => (
                                      <SelectItem key={d} value={d}>
                                        {d}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                                {taskType === "patient" && (
                                  <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => setSelectedVhvIds(filteredVHVs.map((v: any) => v.id))}
                                  >
                                    <CopyPlus className="h-4 w-4 mr-2" /> Select All
                                  </Button>
                                )}
                              </div>
                              <div className="relative">
                                <Search className="h-4 w-4 absolute left-2 top-2.5 text-muted-foreground" />
                                <Input
                                  className="pl-8"
                                  placeholder="Search VHVs by name or district"
                                  value={vhvSearch}
                                  onChange={(e) => setVhvSearch(e.target.value)}
                                />
                              </div>
                              <div className="flex items-center justify-between text-xs text-muted-foreground">
                                <span>{filteredVHVs.length} VHV(s) shown</span>
                                <span>Selected: {selectedVhvIds.length}</span>
                              </div>
                              <ScrollArea className="h-40 pr-2">
                                <div className="space-y-2">
                                  {filteredVHVs.map((v: any) => (
                                    <label key={v.id} className="flex items-center gap-2 text-sm">
                                      <Checkbox
                                        checked={selectedVhvIds.includes(v.id)}
                                        onCheckedChange={() => toggleVhvSelection(v.id)}
                                      />
                                      <span>
                                        {v.email?.split("@")[0]}
                                        {v.district ? " - " + v.district : ""}
                                      </span>
                                    </label>
                                  ))}
                                </div>
                              </ScrollArea>
                            </div>
                          )}
                          <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                            <Badge variant="secondary">VHVs selected: {selectedVhvCount}</Badge>
                            {taskType === "area" && <Badge variant="secondary">Areas selected: {areaCount}</Badge>}
                            {taskType === "area" && areaCount === 0 && !hasSelectedVhvs && (
                              <span>Pick at least one area or VHV.</span>
                            )}
                          </div>
                        </div>
                      )}
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
                          <SelectItem value="low">Low</SelectItem>
                          <SelectItem value="medium">Medium</SelectItem>
                          <SelectItem value="high">High</SelectItem>
                          <SelectItem value="urgent">Urgent</SelectItem>
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
                  <Button onClick={handleCreateTask} disabled={!createEnabled}>
                    <Plus className="h-4 w-4 mr-2" />
                    Create Task
                  </Button>
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
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-[170px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="patient">Patient Tasks</SelectItem>
                <SelectItem value="area">Area Tasks</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-[150px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterPriority} onValueChange={setFilterPriority}>
              <SelectTrigger className="w-[150px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Priority</SelectItem>
                <SelectItem value="urgent">Urgent</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="low">Low</SelectItem>
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
                const tStatus = (task.status || "").toString().toLowerCase()
                const tPriority = (task.priority || "").toString().toLowerCase()
                const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && tStatus !== "completed"
                const schema = parseFormSchema(task.description)
                const extracted = extractAreaInfo(task.description)
                const areaDistrict = task.district || extracted.district
                const cleanDescription = stripFormSchema(extracted.remainder)
                const isAreaTask = !task.patientId
                return (
                  <Card
                    key={task.id}
                    className={`border-l-4 ${
                      tStatus === "completed"
                        ? "border-l-green-500"
                        : tStatus === "in_progress"
                          ? "border-l-yellow-500"
                          : isOverdue
                            ? "border-l-red-500"
                            : tPriority === "high" || tPriority === "urgent"
                              ? "border-l-orange-500"
                              : "border-l-blue-500"
                    }`}
                  >
                    <CardContent className="pt-4">
                      <div className="flex items-start justify-between">
                        <div className="space-y-2 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="font-semibold">{task.title}</h3>
                            <Badge variant={getPriorityColor(tPriority)}>{tPriority}</Badge>
                            <Badge variant={getStatusColor(tStatus)}>{tStatus}</Badge>
                            {schema?.questions && (
                              <Badge variant="secondary">Form items: {schema.questions.length}</Badge>
                            )}
                            {isOverdue && <Badge variant="destructive">OVERDUE</Badge>}
                          </div>
                          <p className="text-sm text-muted-foreground">{cleanDescription}</p>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            {isAreaTask ? (
                              <div className="flex items-center gap-1">
                                <MapPin className="h-3 w-3" />
                                Area: {areaDistrict || "Unknown"}
                              </div>
                            ) : (
                              <div className="flex items-center gap-1">
                                <User className="h-3 w-3" />
                                Patient: {getPatientName(task.patientId)}
                              </div>
                            )}
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

                          {/* VHV Form Responses for completed tasks */}
                          {tStatus === "completed" && task.formResponse && (
                            <div className="mt-4 p-4 bg-muted/50 rounded-lg space-y-3">
                              <h4 className="font-semibold text-sm flex items-center gap-2">
                                <FileText className="h-4 w-4" />
                                VHV Form Responses
                              </h4>
                              {schema?.questions &&
                                schema.questions.map((question: any) => {
                                  const answer = task.formResponse[question.id]
                                  if (!answer) return null

                                  return (
                                    <div key={question.id} className="space-y-1">
                                      <p className="text-sm font-medium">{question.text}</p>
                                      <p className="text-sm text-muted-foreground pl-4">
                                        {Array.isArray(answer) ? answer.join(", ") : answer}
                                      </p>
                                    </div>
                                  )
                                })}
                            </div>
                          )}
                        </div>
                        <div className="flex items-center gap-2 ml-4">
                          {tStatus !== "completed" && (
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
        <DialogContent className="max-w-md md:max-w-lg max-h-[80vh] overflow-y-auto">
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
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="urgent">Urgent</SelectItem>
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
