"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Plus, Users, UserCheck, Activity, Shield, AlertTriangle } from "lucide-react"
import { adminApi } from "@/lib/api"
import { clearCurrentUser } from "@/lib/auth"
import { useRouter } from "next/navigation"
import { EmergencyAlertManagement } from "@/components/emergency/emergency-alert-management"

export function AdminDashboard() {
  const router = useRouter()
  const [users, setUsers] = useState<any[]>([])
  const [stats, setStats] = useState<any>({})
  const [loading, setLoading] = useState(true)
  const [showCreateDoctorDialog, setShowCreateDoctorDialog] = useState(false)
  const [showCreateVHVDialog, setShowCreateVHVDialog] = useState(false)

  const [doctorForm, setDoctorForm] = useState({
    email: "",
    password: "",
    firstName: "",
    lastName: "",
    licenseNumber: "",
    specialization: "",
    hospitalAffiliation: "",
  })

  const [vhvForm, setVhvForm] = useState({
    email: "",
    password: "",
    firstName: "",
    lastName: "",
    region: "",
    phoneNumber: "",
    trainingLevel: "",
  })

  // Load initial data
  useEffect(() => {
    loadAdminData()
  }, [])

  const loadAdminData = async () => {
    try {
      setLoading(true)
      
      console.log('Admin Dashboard: Starting data load...')
      
      // Get data from individual role tables instead of unified users table
      const [adminsResponse, doctorsResponse, vhvsResponse, patientsResponse, statsResponse] = await Promise.all([
        fetch('/api/admin/admins'),
        fetch('/api/admin/doctors'),
        fetch('/api/admin/vhvs'),
        fetch('/api/admin/patients'),
        fetch('/api/admin/stats')
      ])

      console.log('Admin Dashboard: API responses received', {
        adminsStatus: adminsResponse.status,
        doctorsStatus: doctorsResponse.status,
        vhvsStatus: vhvsResponse.status,
        patientsStatus: patientsResponse.status,
        statsStatus: statsResponse.status
      })

      // Check for errors
      if (!adminsResponse.ok) {
        const error = await adminsResponse.text()
        console.error('Admins API error:', error)
        throw new Error(`Admins API failed: ${adminsResponse.status}`)
      }
      if (!doctorsResponse.ok) {
        const error = await doctorsResponse.text()
        console.error('Doctors API error:', error)
        throw new Error(`Doctors API failed: ${doctorsResponse.status}`)
      }
      if (!vhvsResponse.ok) {
        const error = await vhvsResponse.text()
        console.error('VHVs API error:', error)
        throw new Error(`VHVs API failed: ${vhvsResponse.status}`)
      }
      if (!patientsResponse.ok) {
        const error = await patientsResponse.text()
        console.error('Patients API error:', error)
        throw new Error(`Patients API failed: ${patientsResponse.status}`)
      }
      if (!statsResponse.ok) {
        const error = await statsResponse.text()
        console.error('Stats API error:', error)
        throw new Error(`Stats API failed: ${statsResponse.status}`)
      }

      // Parse responses
      const adminsData = await adminsResponse.json()
      const doctorsData = await doctorsResponse.json()
      const vhvsData = await vhvsResponse.json()
      const patientsData = await patientsResponse.json()
      const statsData = await statsResponse.json()

      // Combine all users into a single array
      const allUsers = [
        ...adminsData.map((user: any) => ({ ...user, role: 'ADMIN' })),
        ...doctorsData.map((user: any) => ({ ...user, role: 'DOCTOR' })),
        ...vhvsData.map((user: any) => ({ ...user, role: 'VHV' })),
        ...patientsData.map((user: any) => ({ ...user, role: 'PATIENT' }))
      ]

      console.log('Admin Dashboard: Data loaded:', {
        admins: adminsData.length,
        doctors: doctorsData.length,
        vhvs: vhvsData.length,
        patients: patientsData.length,
        totalUsers: allUsers.length,
        stats: statsData
      })

      setUsers(allUsers)
      setStats(statsData)
    } catch (error) {
      console.error("Failed to load admin data:", error)
      // Fallback to mock data
      setUsers([
        {
          id: 1,
          email: "doctor@example.com",
          role: "DOCTOR",
          firstName: "Dr. Michael",
          lastName: "Chen",
          name: "Dr. Michael Chen",
          status: "active",
        },
        { 
          id: 2, 
          email: "vhv1@example.com", 
          role: "VHV", 
          firstName: "Maria", 
          lastName: "Santos", 
          name: "Maria Santos",
          status: "active" 
        },
        { 
          id: 3, 
          email: "vhv2@example.com", 
          role: "VHV", 
          firstName: "Carlos", 
          lastName: "Rodriguez", 
          name: "Carlos Rodriguez",
          status: "active" 
        },
      ])
      setStats({
        totalUsers: 3,
        totalDoctors: 1,
        totalVHVs: 2,
        totalPatients: 15,
        pendingReviews: 5,
      })
    } finally {
      setLoading(false)
    }
  }

  const handleSignOut = () => {
    clearCurrentUser()
    router.push("/")
  }

  const handleCreateDoctor = async () => {
    try {
      console.log("Creating doctor:", doctorForm)

      // Validate required fields
      if (!doctorForm.email || !doctorForm.password || !doctorForm.firstName || !doctorForm.lastName) {
        alert("Please fill in all required fields")
        return
      }

      // Call API to create doctor
      await adminApi.createDoctor(doctorForm)

      console.log("Doctor created successfully")
      alert("Doctor created successfully!")

      // Close dialog and reset form
      setShowCreateDoctorDialog(false)
      setDoctorForm({
        email: "",
        password: "",
        firstName: "",
        lastName: "",
        licenseNumber: "",
        specialization: "",
        hospitalAffiliation: "",
      })

      // Reload data to show new doctor
      loadAdminData()
    } catch (error) {
      console.error("Failed to create doctor:", error)
      alert("Failed to create doctor. Please try again.")
    }
  }

  const handleCreateVHV = async () => {
    try {
      console.log("Creating VHV:", vhvForm)

      // Validate required fields
      if (!vhvForm.email || !vhvForm.password || !vhvForm.firstName || !vhvForm.lastName) {
        alert("Please fill in all required fields")
        return
      }

      // Call API to create VHV
      await adminApi.createVHV(vhvForm)

      console.log("VHV created successfully")
      alert("VHV created successfully!")

      // Close dialog and reset form
      setShowCreateVHVDialog(false)
      setVhvForm({
        email: "",
        password: "",
        firstName: "",
        lastName: "",
        region: "",
        phoneNumber: "",
        trainingLevel: "",
      })

      // Reload data to show new VHV
      loadAdminData()
    } catch (error) {
      console.error("Failed to create VHV:", error)
      alert("Failed to create VHV. Please try again.")
    }
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Admin Dashboard</h1>
          <p className="text-muted-foreground">Manage users and system settings</p>
        </div>
        <div className="flex items-center gap-4">
          <Badge variant="outline" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Administrator
          </Badge>
          <Button variant="outline" onClick={handleSignOut}>
            Sign Out
          </Button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalUsers}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Doctors</CardTitle>
            <UserCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalDoctors}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">VHVs</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalVHVs}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Patients</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalPatients}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Reviews</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pendingReviews}</div>
          </CardContent>
        </Card>
      </div>

      {/* Emergency Alerts Tab */}
      <Tabs defaultValue="users" className="space-y-4">
        <TabsList>
          <TabsTrigger value="users">User Management</TabsTrigger>
          <TabsTrigger value="create">Create Users</TabsTrigger>
        </TabsList>

        <TabsContent value="users" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>System Users</CardTitle>
              <CardDescription>Manage doctors, VHVs, and other system users</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {loading ? (
                  <div className="flex items-center justify-center p-8">
                    <div className="text-muted-foreground">Loading users...</div>
                  </div>
                ) : !users || !Array.isArray(users) || users.length === 0 ? (
                  <div className="flex items-center justify-center p-8">
                    <div className="text-muted-foreground">No users found</div>
                  </div>
                ) : (
                  users.map((user) => (
                    <div key={user.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="space-y-1">
                        <p className="font-medium">
                          {user.name ||
                            `${user.firstName || ""} ${user.lastName || ""}`.trim() ||
                            user.email.split("@")[0]}
                        </p>
                        <p className="text-sm text-muted-foreground">{user.email}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge
                          variant={user.role === "DOCTOR" ? "default" : user.role === "VHV" ? "secondary" : "outline"}
                        >
                          {user.role}
                        </Badge>
                        <Badge variant="default">Active</Badge>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="create" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Create Doctor Card */}
            <Card>
              <CardHeader>
                <CardTitle>Create Doctor Account</CardTitle>
                <CardDescription>Add a new doctor to the system</CardDescription>
              </CardHeader>
              <CardContent>
                <Dialog open={showCreateDoctorDialog} onOpenChange={setShowCreateDoctorDialog}>
                  <DialogTrigger asChild>
                    <Button className="w-full">
                      <Plus className="h-4 w-4 mr-2" />
                      Add Doctor
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                      <DialogTitle>Create Doctor Account</DialogTitle>
                      <DialogDescription>Enter the doctor's information to create their account.</DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="firstName">First Name</Label>
                          <Input
                            id="firstName"
                            value={doctorForm.firstName}
                            onChange={(e) => setDoctorForm((prev) => ({ ...prev, firstName: e.target.value }))}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="lastName">Last Name</Label>
                          <Input
                            id="lastName"
                            value={doctorForm.lastName}
                            onChange={(e) => setDoctorForm((prev) => ({ ...prev, lastName: e.target.value }))}
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="email">Email</Label>
                        <Input
                          id="email"
                          type="email"
                          value={doctorForm.email}
                          onChange={(e) => setDoctorForm((prev) => ({ ...prev, email: e.target.value }))}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="password">Password</Label>
                        <Input
                          id="password"
                          type="password"
                          value={doctorForm.password}
                          onChange={(e) => setDoctorForm((prev) => ({ ...prev, password: e.target.value }))}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="licenseNumber">License Number (Optional)</Label>
                        <Input
                          id="licenseNumber"
                          value={doctorForm.licenseNumber}
                          onChange={(e) => setDoctorForm((prev) => ({ ...prev, licenseNumber: e.target.value }))}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="specialization">Specialization (Optional)</Label>
                        <Input
                          id="specialization"
                          value={doctorForm.specialization}
                          onChange={(e) => setDoctorForm((prev) => ({ ...prev, specialization: e.target.value }))}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="hospitalAffiliation">Hospital Affiliation (Optional)</Label>
                        <Input
                          id="hospitalAffiliation"
                          value={doctorForm.hospitalAffiliation}
                          onChange={(e) => setDoctorForm((prev) => ({ ...prev, hospitalAffiliation: e.target.value }))}
                        />
                      </div>
                    </div>
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" onClick={() => setShowCreateDoctorDialog(false)}>
                        Cancel
                      </Button>
                      <Button onClick={handleCreateDoctor}>Create Doctor</Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </CardContent>
            </Card>

            {/* Create VHV Card */}
            <Card>
              <CardHeader>
                <CardTitle>Create VHV Account</CardTitle>
                <CardDescription>Add a new Village Health Volunteer to the system</CardDescription>
              </CardHeader>
              <CardContent>
                <Dialog open={showCreateVHVDialog} onOpenChange={setShowCreateVHVDialog}>
                  <DialogTrigger asChild>
                    <Button className="w-full">
                      <Plus className="h-4 w-4 mr-2" />
                      Add VHV
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                      <DialogTitle>Create VHV Account</DialogTitle>
                      <DialogDescription>Enter the VHV's information to create their account.</DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="vhvFirstName">First Name</Label>
                          <Input
                            id="vhvFirstName"
                            value={vhvForm.firstName}
                            onChange={(e) => setVhvForm((prev) => ({ ...prev, firstName: e.target.value }))}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="vhvLastName">Last Name</Label>
                          <Input
                            id="vhvLastName"
                            value={vhvForm.lastName}
                            onChange={(e) => setVhvForm((prev) => ({ ...prev, lastName: e.target.value }))}
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="vhvEmail">Email</Label>
                        <Input
                          id="vhvEmail"
                          type="email"
                          value={vhvForm.email}
                          onChange={(e) => setVhvForm((prev) => ({ ...prev, email: e.target.value }))}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="vhvPassword">Password</Label>
                        <Input
                          id="vhvPassword"
                          type="password"
                          value={vhvForm.password}
                          onChange={(e) => setVhvForm((prev) => ({ ...prev, password: e.target.value }))}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="region">Region</Label>
                        <Input
                          id="region"
                          value={vhvForm.region}
                          onChange={(e) => setVhvForm((prev) => ({ ...prev, region: e.target.value }))}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="phoneNumber">Phone Number (Optional)</Label>
                        <Input
                          id="phoneNumber"
                          value={vhvForm.phoneNumber}
                          onChange={(e) => setVhvForm((prev) => ({ ...prev, phoneNumber: e.target.value }))}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="trainingLevel">Training Level (Optional)</Label>
                        <Input
                          id="trainingLevel"
                          value={vhvForm.trainingLevel}
                          onChange={(e) => setVhvForm((prev) => ({ ...prev, trainingLevel: e.target.value }))}
                        />
                      </div>
                    </div>
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" onClick={() => setShowCreateVHVDialog(false)}>
                        Cancel
                      </Button>
                      <Button onClick={handleCreateVHV}>Create VHV</Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Emergency Alert Management Tab Content */}
        <TabsContent value="emergency" className="space-y-4">
          <EmergencyAlertManagement />
        </TabsContent>
      </Tabs>

    </div>
  )
}
