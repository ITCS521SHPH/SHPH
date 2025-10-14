"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { MapPin, Search } from "lucide-react"

// Leaflet imports - will be loaded dynamically
let L: any = null

interface HouseholdData {
  householdId: string
  coordinates: { lat: number; lng: number }
  patient: {
    patientId: string
    name: string
    medicalCondition: string
  }
  assignedVHV: string
}

export function PatientMapView() {
  const [map, setMap] = useState<any>(null)
  const [markers, setMarkers] = useState<any[]>([])
  const [householdData, setHouseholdData] = useState<HouseholdData[]>([])
  const [filteredData, setFilteredData] = useState<HouseholdData[]>([])
  const [locationFilter, setLocationFilter] = useState<string>("all")
  const [searchTerm, setSearchTerm] = useState<string>("")
  const [isLoading, setIsLoading] = useState(true)

  // Mock data for prototype - in production, this would come from the API
  const mockHouseholdData: HouseholdData[] = [
    {
      householdId: "H001",
      coordinates: { lat: 13.7563, lng: 100.5018 }, // Bangkok area
      patient: {
        patientId: "P001",
        name: "Sarah Johnson",
        medicalCondition: "Hypertension, Diabetes",
      },
      assignedVHV: "Maria Santos",
    },
    {
      householdId: "H002",
      coordinates: { lat: 13.7465, lng: 100.5347 },
      patient: {
        patientId: "P002",
        name: "John Smith",
        medicalCondition: "Chronic back pain",
      },
      assignedVHV: "Carlos Rodriguez",
    },
    {
      householdId: "H003",
      coordinates: { lat: 13.765, lng: 100.538 },
      patient: {
        patientId: "P003",
        name: "Emma Davis",
        medicalCondition: "Asthma",
      },
      assignedVHV: "Ana Lopez",
    },
  ]

  // Initialize map
  useEffect(() => {
    const initMap = async () => {
      if (typeof window === "undefined") return

      // Dynamically import Leaflet
      const leaflet = await import("leaflet")
      L = leaflet.default

      // Import Leaflet CSS
      await import("leaflet/dist/leaflet.css")

      // Fix for default marker icon
      delete (L.Icon.Default.prototype as any)._getIconUrl
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
        iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
        shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
      })

      // Create map instance
      const mapInstance = L.map("patient-map").setView([13.7563, 100.5018], 13)

      // Add tile layer
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19,
      }).addTo(mapInstance)

      setMap(mapInstance)
      setHouseholdData(mockHouseholdData)
      setFilteredData(mockHouseholdData)
      setIsLoading(false)
    }

    initMap()

    return () => {
      if (map) {
        map.remove()
      }
    }
  }, [])

  // Update markers when filtered data changes
  useEffect(() => {
    if (!map || !L) return

    // Clear existing markers
    markers.forEach((marker) => marker.remove())

    // Add new markers
    const newMarkers = filteredData.map((household) => {
      const marker = L.marker([household.coordinates.lat, household.coordinates.lng]).addTo(map)

      // Create popup content
      const popupContent = `
        <div style="min-width: 200px;">
          <h3 style="font-weight: bold; margin-bottom: 8px; font-size: 14px;">
            ${household.patient.name}
          </h3>
          <div style="font-size: 12px; color: #666; margin-bottom: 4px;">
            <strong>Household ID:</strong> ${household.householdId}
          </div>
          <div style="font-size: 12px; color: #666; margin-bottom: 4px;">
            <strong>Patient ID:</strong> ${household.patient.patientId}
          </div>
          <div style="font-size: 12px; color: #666; margin-bottom: 4px;">
            <strong>Medical Condition:</strong> ${household.patient.medicalCondition}
          </div>
          <div style="font-size: 12px; color: #666;">
            <strong>Assigned VHV:</strong> ${household.assignedVHV}
          </div>
        </div>
      `

      marker.bindPopup(popupContent)

      return marker
    })

    setMarkers(newMarkers)

    // Fit map to show all markers
    if (newMarkers.length > 0) {
      const group = L.featureGroup(newMarkers)
      map.fitBounds(group.getBounds().pad(0.1))
    }
  }, [filteredData, map])

  // Handle filtering
  useEffect(() => {
    let filtered = householdData

    // Apply location filter (district)
    if (locationFilter !== "all") {
      // In a real implementation, this would filter by district
      // For now, we'll just show all data
      filtered = householdData
    }

    // Apply search term filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      filtered = filtered.filter(
        (household) =>
          household.patient.name.toLowerCase().includes(term) ||
          household.patient.patientId.toLowerCase().includes(term) ||
          household.patient.medicalCondition.toLowerCase().includes(term) ||
          household.householdId.toLowerCase().includes(term),
      )
    }

    setFilteredData(filtered)
  }, [locationFilter, searchTerm, householdData])

  const handleClearFilters = () => {
    setLocationFilter("all")
    setSearchTerm("")
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Patient Household Map
          </CardTitle>
          <CardDescription>
            View patient households on the map and filter by location or patient details
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="location-filter">Filter by Location</Label>
              <Select value={locationFilter} onValueChange={setLocationFilter}>
                <SelectTrigger id="location-filter">
                  <SelectValue placeholder="All locations" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All locations</SelectItem>
                  <SelectItem value="village-a">Village A</SelectItem>
                  <SelectItem value="village-b">Village B</SelectItem>
                  <SelectItem value="village-c">Village C</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="search-filter">Search Patients</Label>
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search-filter"
                  placeholder="Name, ID, or condition..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>

            <div className="flex items-end">
              <Button variant="outline" onClick={handleClearFilters} className="w-full bg-transparent">
                Clear Filters
              </Button>
            </div>
          </div>

          <div className="mt-4 flex items-center gap-2">
            <Badge variant="secondary">
              {filteredData.length} household{filteredData.length !== 1 ? "s" : ""} shown
            </Badge>
            {(locationFilter !== "all" || searchTerm) && <Badge variant="outline">Filters active</Badge>}
          </div>
        </CardContent>
      </Card>

      {/* Map Container */}
      <Card>
        <CardContent className="p-0">
          <div
            id="patient-map"
            style={{
              height: "600px",
              width: "100%",
              borderRadius: "0.5rem",
            }}
          />
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-background/80">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">Loading map...</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Legend */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Map Legend</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-blue-500" />
              <span>Patient Household Location</span>
            </div>
            <p className="text-xs text-muted-foreground">
              Click on any marker to view patient details and assigned VHV information
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
