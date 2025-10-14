"use client"

import dynamic from "next/dynamic"
import { useEffect, useMemo, useRef, useState } from "react"
import { getDistrictAnchor, colorForDistrict, AREA_RADIUS_M } from "@/lib/district-geo"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { BANGKOK_DISTRICTS } from "@/lib/bangkok-districts"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"

// React Leaflet components via dynamic import to avoid SSR issues
const MapContainer: any = dynamic(async () => (await import("react-leaflet")).MapContainer as any, { ssr: false })
const TileLayer: any = dynamic(async () => (await import("react-leaflet")).TileLayer as any, { ssr: false })
const CircleMarker: any = dynamic(async () => (await import("react-leaflet")).CircleMarker as any, { ssr: false })
const Popup: any = dynamic(async () => (await import("react-leaflet")).Popup as any, { ssr: false })
const Tooltip: any = dynamic(async () => (await import("react-leaflet")).Tooltip as any, { ssr: false })
const Circle: any = dynamic(async () => (await import("react-leaflet")).Circle as any, { ssr: false })

// Import Leaflet styles only on client
if (typeof window !== "undefined") {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  require("leaflet/dist/leaflet.css")
  try {
    // Ensure Leaflet is available on window for bounds calculations
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    ;(window as any).L = require("leaflet")
  } catch {}
}

type VHV = {
  id: string
  firstName?: string
  lastName?: string
  name?: string
  email?: string
  phone?: string
  district?: string
  status?: string
}

type Props = {
  vhvs: VHV[]
}

export function VhvMap({ vhvs }: Props) {
  const mapRef = useRef<any>(null)
  const [search, setSearch] = useState("")
  const ALL_DISTRICTS = "__ALL__"
  const [districtFilter, setDistrictFilter] = useState<string>(ALL_DISTRICTS)

  const center = useMemo(() => ({ lat: 13.7563, lng: 100.5018 }), [])

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase()
    return (vhvs || []).filter((v) => {
      const inDistrict = districtFilter === ALL_DISTRICTS ? true : (v.district || "") === districtFilter
      if (!inDistrict) return false
      if (!term) return true
      const full = `${v.firstName ?? ""} ${v.lastName ?? ""} ${v.name ?? ""} ${v.email ?? ""} ${v.phone ?? ""} ${v.district ?? ""}`.toLowerCase()
      return full.includes(term)
    })
  }, [vhvs, search, districtFilter])

  // Fit bounds to filtered markers
  useEffect(() => {
    const m = mapRef.current
    if (!m) return
    if (filtered.length === 0) return
    const latlngs = filtered.map((v) => getDistrictAnchor(v.district || ""))
    try {
      const L = (window as any).L
      if (L && Array.isArray(latlngs) && latlngs.length > 0) {
        const bounds = new L.LatLngBounds(latlngs)
        if (bounds && m.fitBounds) {
          m.fitBounds(bounds.pad(0.2), { animate: true })
        }
      }
    } catch {}
  }, [filtered])

  return (
    <div className="space-y-3">
      <div className="flex flex-col md:flex-row gap-2 md:items-center">
        <div className="flex-1">
          <Input placeholder="Search by name, email or phone" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <div className="w-full md:w-64">
          <Select value={districtFilter} onValueChange={setDistrictFilter}>
            <SelectTrigger aria-label="Filter by district">
              <SelectValue placeholder="Filter by district" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL_DISTRICTS}>All districts
              </SelectItem>
              {BANGKOK_DISTRICTS.map((d) => (
                <SelectItem key={d} value={d}>{d}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="hidden md:flex items-center gap-2 flex-wrap">
          <Badge variant="outline">VHVs: {filtered.length}</Badge>
          {districtFilter !== ALL_DISTRICTS && (
            <Badge style={{ backgroundColor: colorForDistrict(districtFilter), color: "#fff" }}>{districtFilter}</Badge>
          )}
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="h-[65vh] w-full">
            <MapContainer
              center={[center.lat, center.lng]}
              zoom={12}
              style={{ height: "100%", width: "100%" }}
              ref={mapRef as any}
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />

              {districtFilter !== ALL_DISTRICTS && (
                <Circle
                  center={getDistrictAnchor(districtFilter)}
                  radius={AREA_RADIUS_M}
                  pathOptions={{ color: colorForDistrict(districtFilter), weight: 2, fillOpacity: 0.05 }}
                />
              )}

              {filtered.map((v) => {
                const pos = getDistrictAnchor(v.district || "")
                const color = colorForDistrict(v.district || "")
                const label = v.name || `${v.firstName ?? ""} ${v.lastName ?? ""}`.trim() || v.email || "VHV"
                return (
                  <CircleMarker key={v.id} center={pos} radius={8} pathOptions={{ color, fillColor: color, fillOpacity: 0.9 }}>
                    <Tooltip direction="top" offset={[0, -10]} opacity={1} permanent={false}>
                      <span>{label}</span>
                    </Tooltip>
                    <Popup>
                      <div className="space-y-1">
                        <div className="font-medium">{label}</div>
                        {v.phone && <div className="text-sm text-muted-foreground">Phone: {v.phone}</div>}
                        {v.email && <div className="text-sm text-muted-foreground">Email: {v.email}</div>}
                        {v.district && (
                          <div className="text-sm">Base area: <span className="font-medium">{v.district}</span></div>
                        )}
                        {v.status && <div className="text-xs">Status: {v.status}</div>}
                      </div>
                    </Popup>
                  </CircleMarker>
                )
              })}
            </MapContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default VhvMap
