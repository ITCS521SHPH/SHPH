"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Clock, Search, Filter, User, Calendar } from "lucide-react"
import Link from "next/link"

interface PendingRecord {
  id: string
  created_at: string
  symptoms: string
  blood_pressure: string | null
  heart_rate: number | null
  temperature: number | null
  patients: {
    patient_id: string
    users: {
      full_name: string
    }
  }
  users: {
    full_name: string
  }
}

export function PendingQueue() {
  const [records, setRecords] = useState<PendingRecord[]>([])
  const [filteredRecords, setFilteredRecords] = useState<PendingRecord[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [sortBy, setSortBy] = useState("newest")

  const supabase = createClient()

  useEffect(() => {
    fetchPendingRecords()
  }, [])

  useEffect(() => {
    filterAndSortRecords()
  }, [records, searchTerm, sortBy])

  const fetchPendingRecords = async () => {
    try {
      const { data, error } = await supabase
        .from("visit_records")
        .select(`
          id,
          created_at,
          symptoms,
          blood_pressure,
          heart_rate,
          temperature,
          patients!inner(
            patient_id,
            users!inner(full_name)
          ),
          users!vhv_id(full_name)
        `)
        .eq("status", "pending")
        .order("created_at", { ascending: false })

      if (error) throw error
      setRecords(data || [])
    } catch (error) {
      console.error("Error fetching pending records:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const filterAndSortRecords = () => {
    let filtered = records

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(
        (record) =>
          record.patients.users.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          record.patients.patient_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
          record.users.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          record.symptoms.toLowerCase().includes(searchTerm.toLowerCase()),
      )
    }

    // Sort records
    filtered.sort((a, b) => {
      switch (sortBy) {
        case "newest":
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        case "oldest":
          return new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        case "patient":
          return a.patients.users.full_name.localeCompare(b.patients.users.full_name)
        case "vhv":
          return a.users.full_name.localeCompare(b.users.full_name)
        default:
          return 0
      }
    })

    setFilteredRecords(filtered)
  }

  const getUrgencyLevel = (record: PendingRecord) => {
    const hoursOld = (new Date().getTime() - new Date(record.created_at).getTime()) / (1000 * 60 * 60)

    if (hoursOld > 24) return "high"
    if (hoursOld > 12) return "medium"
    return "low"
  }

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case "high":
        return "destructive"
      case "medium":
        return "secondary"
      default:
        return "outline"
    }
  }

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Pending Review Queue ({records.length})
        </CardTitle>
        <CardDescription>Visit records awaiting your review and approval</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Filters */}
          <div className="flex gap-4 flex-wrap">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search patients, VHVs, or symptoms..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-[180px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">Newest First</SelectItem>
                <SelectItem value="oldest">Oldest First</SelectItem>
                <SelectItem value="patient">Patient Name</SelectItem>
                <SelectItem value="vhv">VHV Name</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Records List */}
          <div className="space-y-3">
            {filteredRecords.map((record) => {
              const urgency = getUrgencyLevel(record)
              const urgencyColor = getUrgencyColor(urgency)

              return (
                <div key={record.id} className="border rounded-lg p-4 hover:bg-muted/50 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="space-y-2 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-medium">{record.patients.users.full_name}</h3>
                        <Badge variant="outline">{record.patients.patient_id}</Badge>
                        <Badge variant={urgencyColor as any}>
                          {urgency === "high" ? "Urgent" : urgency === "medium" ? "Priority" : "Normal"}
                        </Badge>
                      </div>

                      <div className="grid gap-2 text-sm text-muted-foreground md:grid-cols-2">
                        <div className="flex items-center gap-1">
                          <User className="h-3 w-3" />
                          VHV: {record.users.full_name}
                        </div>
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {new Date(record.created_at).toLocaleString()}
                        </div>
                      </div>

                      <p className="text-sm line-clamp-2">{record.symptoms}</p>

                      {/* Vital Signs Summary */}
                      <div className="flex gap-4 text-xs text-muted-foreground">
                        {record.blood_pressure && <span>BP: {record.blood_pressure}</span>}
                        {record.heart_rate && <span>HR: {record.heart_rate} BPM</span>}
                        {record.temperature && <span>Temp: {record.temperature}°C</span>}
                      </div>
                    </div>

                    <Button asChild size="sm">
                      <Link href={`/doctor/review/${record.id}`}>Review</Link>
                    </Button>
                  </div>
                </div>
              )
            })}

            {filteredRecords.length === 0 && (
              <div className="text-center py-8">
                <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">No pending records</h3>
                <p className="text-muted-foreground">
                  {searchTerm ? "No records match your search criteria." : "All records have been reviewed."}
                </p>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
