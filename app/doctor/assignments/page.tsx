"use client"

import { RouteGuard } from "@/components/auth/route-guard"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { TaskManagement } from "@/components/tasks/task-management"
import { PatientAssignment } from "@/components/tasks/patient-assignment"
import { getCurrentUserFromStorage } from "@/lib/auth"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useCallback, useMemo, useState } from "react"
import { useApiData } from "@/lib/useApiData"
import { patientsApi } from "@/lib/api"
import { Skeleton } from "@/components/ui/skeleton"
import { useRouter } from "next/navigation"
import { ArrowLeft } from "lucide-react"
import { Input } from "@/components/ui/input"


export default function DoctorAssignmentsPage() {
  const currentUser = getCurrentUserFromStorage()
  const router = useRouter()
  const getAssignments = useCallback(async () => {
    if (!currentUser?.id) return []
    return patientsApi.getAssignments(currentUser.id)
  }, [currentUser?.id])
  const { data: allAssignments, loading: assignmentsLoading } = useApiData(getAssignments, [])

  const isAreaPlaceholder = (patient: any) => {
    if (!patient) return false
    const fn = (patient.firstName || patient.first_name || '').toString().trim()
    return fn === 'Area Task' || fn === 'Area'
  }
  const areaAssignments = (allAssignments || []).filter((a: any) => isAreaPlaceholder(a.patient))

  // Patients for stats + unassigned count (includes area placeholders)
  const getPatients = useCallback(async () => patientsApi.getAll(), [])
  const { data: allPatients, loading: patientsLoading } = useApiData(getPatients, [])

  const { unassignedCount, activeAssignCount, areaAssignCount } = useMemo(() => {
    const assignmentSet = new Set<string>((allAssignments || []).map((a: any) => a.patient?.id).filter(Boolean))
    const unassigned = (allPatients || []).filter((p: any) => !assignmentSet.has(p.id))
    return {
      unassignedCount: unassigned.length || 0,
      activeAssignCount: (allAssignments || []).length || 0,
      areaAssignCount: areaAssignments.length || 0,
    }
  }, [allAssignments, allPatients, areaAssignments])

  // Load area tasks from new table for the Area tab
  const getAreaTasks = useCallback(async () => {
    if (!currentUser?.id) return []
    return areaTasksApi.getByDoctor(currentUser.id)
  }, [currentUser?.id])
  const { data: doctorAreaTasks, loading: areaTasksLoading } = useApiData(getAreaTasks, [])

  // UI state: search and filters
  const [searchAssigned, setSearchAssigned] = useState("")
  const [searchUnassigned, setSearchUnassigned] = useState("")
  const [searchAreaText, setSearchAreaText] = useState("")
  const [areaStatus, setAreaStatus] = useState("all")
  const [areaDistrict, setAreaDistrict] = useState("all")

  return (
    <RouteGuard>
      <div className="min-h-screen bg-background">
        <header className="border-b bg-card">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold">Assignments & Tasks</h1>
                <p className="text-muted-foreground">Assign patients to VHVs and manage VHV tasks</p>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="ghost" onClick={() => router.back()}>
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back
                </Button>
              </div>
            </div>
          </div>
        </header>

        <main className="container mx-auto px-4 py-6 space-y-6">
          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Unassigned Patients</CardTitle>
                <CardDescription>Patients waiting for VHV</CardDescription>
              </CardHeader>
              <CardContent>
                {patientsLoading ? (
                  <Skeleton className="h-8 w-16" />
                ) : (
                  <div className="text-2xl font-bold">{unassignedCount}</div>
                )}
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Active Assignments</CardTitle>
                <CardDescription>Patients assigned to VHVs</CardDescription>
              </CardHeader>
              <CardContent>
                {assignmentsLoading ? (
                  <Skeleton className="h-8 w-16" />
                ) : (
                  <div className="text-2xl font-bold">{activeAssignCount}</div>
                )}
              </CardContent>
            </Card>
            
          </div>
          <Tabs defaultValue="assign" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="assign">Assign Patients</TabsTrigger>
              <TabsTrigger value="tasks">Task Management</TabsTrigger>
            </TabsList>

            <TabsContent value="assign" className="space-y-6 mt-4">
              {/* Sub-tabs for patient assignment views */}
              <Tabs defaultValue="current" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="current">Current Patient Assignments</TabsTrigger>
                  <TabsTrigger value="unassigned">Unassigned Patients</TabsTrigger>
                </TabsList>

                <TabsContent value="current" className="mt-4 space-y-3">
                  <div className="flex items-center gap-2">
                    <Input
                      placeholder="Search assigned (name or VHV)"
                      value={searchAssigned}
                      onChange={(e) => setSearchAssigned(e.target.value)}
                      className="w-full md:w-[320px]"
                    />
                  </div>
                  <PatientAssignment doctorId={currentUser?.id} hideUnassigned assignedSearch={searchAssigned} />
                </TabsContent>

                <TabsContent value="unassigned" className="mt-4 space-y-3">
                  <div className="flex items-center gap-2">
                    <Input
                      placeholder="Search unassigned (name or ID)"
                      value={searchUnassigned}
                      onChange={(e) => setSearchUnassigned(e.target.value)}
                      className="w-full md:w-[320px]"
                    />
                  </div>
                  <PatientAssignment doctorId={currentUser?.id} hideCurrentAssignments unassignedSearch={searchUnassigned} />
                </TabsContent>
              </Tabs>
            </TabsContent>


            <TabsContent value="tasks" className="space-y-6 mt-4">
              <Card>
                <CardHeader>
                  <CardTitle>Task Management</CardTitle>
                  <CardDescription>Create and manage tasks for VHVs</CardDescription>
                </CardHeader>
                <CardContent>
                  <TaskManagement doctorId={currentUser?.id} />
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </main>
      </div>
    </RouteGuard>
  )
}
