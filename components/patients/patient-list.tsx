"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Search, Plus, Filter, User, Phone, MapPin, Calendar, AlertTriangle, Heart, Edit, Eye } from "lucide-react"
import type { Patient } from "@/lib/types"
import { mockPatients } from "@/lib/data"

interface PatientListProps {
  onAddPatient: () => void
  onEditPatient: (patient: Patient) => void
  onViewPatient: (patient: Patient) => void
}

export function PatientList({ onAddPatient, onEditPatient, onViewPatient }: PatientListProps) {
  const [patients] = useState<Patient[]>(mockPatients)
  const [searchTerm, setSearchTerm] = useState("")
  const [filterRisk, setFilterRisk] = useState<string>("all")
  const [filterDistrict, setFilterDistrict] = useState<string>("all")

  const filteredPatients = patients.filter((patient) => {
    const matchesSearch =
      patient.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      patient.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      patient.patientId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      patient.phoneNumber.includes(searchTerm)

    const matchesRisk = filterRisk === "all" || patient.riskLevel === filterRisk
    const matchesDistrict = filterDistrict === "all" || patient.district === filterDistrict

    return matchesSearch && matchesRisk && matchesDistrict
  })

  const getRiskBadgeVariant = (risk: string) => {
    switch (risk) {
      case "high":
        return "destructive"
      case "medium":
        return "default"
      case "low":
        return "secondary"
      default:
        return "outline"
    }
  }

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName[0]}${lastName[0]}`.toUpperCase()
  }

  const calculateAge = (dateOfBirth: string) => {
    const today = new Date()
    const birthDate = new Date(dateOfBirth)
    let age = today.getFullYear() - birthDate.getFullYear()
    const monthDiff = today.getMonth() - birthDate.getMonth()

    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--
    }

    return age
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold">Patient Registry</h2>
          <p className="text-muted-foreground">Manage patient records and information</p>
        </div>
        <Button onClick={onAddPatient} className="gap-2">
          <Plus className="w-4 h-4" />
          Add New Patient
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  placeholder="Search patients by name, ID, or phone..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <Select value={filterRisk} onValueChange={setFilterRisk}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Risk Level" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Risk Levels</SelectItem>
                <SelectItem value="high">High Risk</SelectItem>
                <SelectItem value="medium">Medium Risk</SelectItem>
                <SelectItem value="low">Low Risk</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filterDistrict} onValueChange={setFilterDistrict}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <MapPin className="w-4 h-4 mr-2" />
                <SelectValue placeholder="District" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Districts</SelectItem>
                <SelectItem value="District A">District A</SelectItem>
                <SelectItem value="District B">District B</SelectItem>
                <SelectItem value="District C">District C</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Patient Cards */}
      <div className="grid gap-4">
        {filteredPatients.map((patient) => (
          <Card key={patient.id} className="hover:shadow-md transition-shadow">
            <CardContent className="pt-6">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-4 flex-1">
                  <Avatar className="w-12 h-12">
                    <AvatarImage
                      src={`/placeholder-icon.png?height=48&width=48&text=${getInitials(patient.firstName, patient.lastName)}`}
                    />
                    <AvatarFallback>{getInitials(patient.firstName, patient.lastName)}</AvatarFallback>
                  </Avatar>

                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-semibold text-lg">
                        {patient.firstName} {patient.lastName}
                      </h3>
                      {patient.priority && (
                        <Badge variant="destructive" className="gap-1">
                          <AlertTriangle className="w-3 h-3" />
                          Priority
                        </Badge>
                      )}
                      <Badge variant={getRiskBadgeVariant(patient.riskLevel)}>
                        {patient.riskLevel.charAt(0).toUpperCase() + patient.riskLevel.slice(1)} Risk
                      </Badge>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <User className="w-3 h-3" />
                        {patient.patientId}
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        Age {calculateAge(patient.dateOfBirth)}
                      </div>
                      <div className="flex items-center gap-1">
                        <Phone className="w-3 h-3" />
                        {patient.phoneNumber}
                      </div>
                      <div className="flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        {patient.district || "No district"}
                      </div>
                    </div>

                    {/* Medical Info */}
                    <div className="flex flex-wrap gap-2">
                      {patient.bloodType && (
                        <Badge variant="outline" className="text-xs">
                          <Heart className="w-3 h-3 mr-1" />
                          {patient.bloodType}
                        </Badge>
                      )}
                      {patient.chronicConditions.length > 0 && (
                        <Badge variant="outline" className="text-xs">
                          {patient.chronicConditions.length} Condition
                          {patient.chronicConditions.length !== 1 ? "s" : ""}
                        </Badge>
                      )}
                      {patient.allergies.length > 0 && (
                        <Badge variant="outline" className="text-xs">
                          {patient.allergies.length} Allerg{patient.allergies.length !== 1 ? "ies" : "y"}
                        </Badge>
                      )}
                    </div>

                    {patient.lastVisit && (
                      <div className="text-xs text-muted-foreground">
                        Last visit: {new Date(patient.lastVisit).toLocaleDateString()}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => onViewPatient(patient)}>
                    <Eye className="w-4 h-4" />
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => onEditPatient(patient)}>
                    <Edit className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredPatients.length === 0 && (
        <Card>
          <CardContent className="pt-6 text-center">
            <User className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No patients found</h3>
            <p className="text-muted-foreground mb-4">
              {searchTerm || filterRisk !== "all" || filterDistrict !== "all"
                ? "Try adjusting your search or filters"
                : "Get started by adding your first patient"}
            </p>
            {!searchTerm && filterRisk === "all" && filterDistrict === "all" && (
              <Button onClick={onAddPatient} className="gap-2">
                <Plus className="w-4 h-4" />
                Add First Patient
              </Button>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
