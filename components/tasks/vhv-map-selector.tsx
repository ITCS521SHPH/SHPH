"use client"

import dynamic from "next/dynamic"
import { useEffect, useMemo, useRef, useState } from "react"
import * as L from "leaflet"
import { BANGKOK_DISTRICTS } from "@/lib/bangkok-districts"
import { getDistrictAnchor, colorForDistrict, AREA_RADIUS_M } from "@/lib/district-geo"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"

// Dynamic import to avoid SSR issues
const MapContainer = dynamic(() => import("react-leaflet").then((m) => m.MapContainer), { ssr: false })
const TileLayer: any = dynamic(async () => (await import("react-leaflet")).TileLayer as any, { ssr: false })
const Circle: any = dynamic(async () => (await import("react-leaflet")).Circle as any, { ssr: false })
const CircleMarker: any = dynamic(async () => (await import("react-leaflet")).CircleMarker as any, { ssr: false })
const Popup: any = dynamic(async () => (await import("react-leaflet")).Popup as any, { ssr: false })
const Tooltip: any = dynamic(async () => (await import("react-leaflet")).Tooltip as any, { ssr: false })

export type VhvLite = {
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
  vhvs: VhvLite[]
  selectedDistricts: string[]
  onToggleDistrict: (district: string) => void
  selectedVhvIds: string[]
  onToggleVhv: (vhvId: string) => void
  mode?: "area" | "patient"
}

function getVhvLabel(v: VhvLite) {
  if (v.name && v.name.trim().length > 0) {
    return v.name
  }
  const combined = `${v.firstName ?? ""} ${v.lastName ?? ""}`.trim()
  if (combined) {
    return combined
  }
  if (v.email) return v.email
  if (v.phone) return v.phone
  return "VHV"
}

type DistrictMarker = {
  key: string
  displayName: string
  anchor: [number, number]
  color: string
  totalCount: number
  filteredCount: number
  selectedCount: number
  items: VhvLite[]
  canToggle: boolean
}

export function VhvMapSelector({
  vhvs,
  selectedDistricts,
  onToggleDistrict,
  selectedVhvIds,
  onToggleVhv,
  mode = "area",
}: Props) {
  const mapRef = useRef<any>(null)
  const [search, setSearch] = useState("")
  const [leafletLoaded, setLeafletLoaded] = useState(false)

  const center = useMemo(() => ({ lat: 13.7563, lng: 100.5018 }), [])
  const selectedSet = useMemo(() => new Set(selectedDistricts), [selectedDistricts])
  const selectedVhvSet = useMemo(() => new Set(selectedVhvIds), [selectedVhvIds])

  const displayVHVs = useMemo(() => {
    const term = search.trim().toLowerCase()
    return (vhvs || []).filter((v) => {
      const inArea = selectedSet.size === 0 ? true : selectedSet.has((v.district || "").trim())
      if (!inArea) return false
      if (!term) return true
      const full =
        `${v.firstName ?? ""} ${v.lastName ?? ""} ${v.name ?? ""} ${v.email ?? ""} ${v.phone ?? ""} ${v.district ?? ""}`.toLowerCase()
      return full.includes(term)
    })
  }, [vhvs, selectedSet, search])

  const filteredGroups = useMemo(() => {
    const map = new Map<
      string,
      {
        displayName: string
        rawDistrict: string | undefined
        items: VhvLite[]
      }
    >()

    for (const vhv of displayVHVs) {
      const rawDistrict = vhv.district?.trim()
      const displayName = rawDistrict && rawDistrict.length > 0 ? rawDistrict : "Unknown district"
      const key = rawDistrict && rawDistrict.length > 0 ? rawDistrict : "__UNKNOWN__"
      const existing = map.get(key)
      if (existing) {
        existing.items.push(vhv)
      } else {
        map.set(key, { displayName, rawDistrict, items: [vhv] })
      }
    }

    return map
  }, [displayVHVs])

  useEffect(() => {
    if (typeof window !== "undefined") {
      delete (L.Icon.Default.prototype as any)._getIconUrl
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
        iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
        shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
      })
      setLeafletLoaded(true)
    }
  }, [])

  useEffect(() => {
    if (!leafletLoaded) return

    const m = mapRef.current
    if (!m) return

    const latlngs: [number, number][] = []
    if (selectedDistricts.length > 0) {
      selectedDistricts.forEach((d) => latlngs.push(getDistrictAnchor(d)))
    } else {
      filteredGroups.forEach((group) => {
        if (group.items.length > 0) {
          latlngs.push(getDistrictAnchor(group.rawDistrict ?? ""))
        }
      })
    }

    if (latlngs.length > 0) {
      try {
        const b = new L.LatLngBounds(latlngs)
        if (m.fitBounds) {
          m.fitBounds(b.pad(0.2), { animate: true })
        }
      } catch (error) {
        console.error("[v0] Error fitting bounds:", error)
      }
    }
  }, [filteredGroups, selectedDistricts, leafletLoaded])

  const districts = BANGKOK_DISTRICTS

  const vhvCountByDistrict = useMemo(() => {
    const map = new Map<string, number>()
    for (const v of vhvs || []) {
      const d = (v.district || "").trim()
      if (!d) continue
      map.set(d, (map.get(d) || 0) + 1)
    }
    return map
  }, [vhvs])

  const districtMarkers = useMemo((): DistrictMarker[] => {
    return districts.map((district) => {
      const group = filteredGroups.get(district)
      const items = group?.items ?? []
      const anchor = getDistrictAnchor(district)
      const color = colorForDistrict(district)
      const totalCount = vhvCountByDistrict.get(district) || 0
      const filteredCount = items.length
      const selectedCount = items.reduce((acc, item) => (selectedVhvSet.has(item.id) ? acc + 1 : acc), 0)
      return {
        key: district,
        displayName: district,
        anchor,
        color,
        totalCount,
        filteredCount,
        selectedCount,
        items,
        canToggle: true,
      }
    })
  }, [districts, filteredGroups, vhvCountByDistrict, selectedVhvSet])

  const extraMarkers = useMemo((): DistrictMarker[] => {
    const known = new Set(districts)
    const extras: DistrictMarker[] = []

    filteredGroups.forEach((group, key) => {
      if (known.has(key)) return
      const items = group.items
      if (items.length === 0) return
      const anchor = getDistrictAnchor(group.rawDistrict ?? "")
      const color = colorForDistrict(group.rawDistrict ?? group.displayName)
      const filteredCount = items.length
      const selectedCount = items.reduce((acc, item) => (selectedVhvSet.has(item.id) ? acc + 1 : acc), 0)
      extras.push({
        key,
        displayName: group.displayName,
        anchor,
        color,
        totalCount: filteredCount,
        filteredCount,
        selectedCount,
        items,
        canToggle: false,
      })
    })

    return extras
  }, [districts, filteredGroups, selectedVhvSet])

  const allMarkers = useMemo(
    (): DistrictMarker[] => [...districtMarkers, ...extraMarkers],
    [districtMarkers, extraMarkers],
  )

  if (!leafletLoaded) {
    return (
      <div className="space-y-3">
        <div className="flex items-center justify-center h-[60vh] w-full bg-muted rounded-lg">
          <p className="text-muted-foreground">Loading map...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-col md:flex-row gap-2 md:items-center">
        <div className="flex-1">
          <Input
            placeholder="Search VHV by name/email/phone"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="hidden md:flex items-center gap-2 flex-wrap">
          <Badge variant="outline">VHVs: {displayVHVs.length}</Badge>
          {selectedDistricts.length > 0 && <Badge variant="outline">Areas: {selectedDistricts.length}</Badge>}
          <Button
            variant="outline"
            size="sm"
            onClick={() => selectedDistricts.forEach((d) => onToggleDistrict(d))}
            disabled={selectedDistricts.length === 0}
          >
            Clear Areas
          </Button>
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="h-[60vh] w-full">
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

              {allMarkers.map((marker) => {
                const isSelectedArea = marker.canToggle ? selectedSet.has(marker.displayName) : false
                const hasSelectedVHVs = marker.selectedCount > 0
                const radius = isSelectedArea ? 10 : hasSelectedVHVs ? 8 : 6
                const tooltipCount =
                  marker.filteredCount !== marker.totalCount
                    ? `${marker.filteredCount}/${marker.totalCount}`
                    : `${marker.totalCount}`
                const tooltipAction =
                  marker.canToggle && marker.totalCount > 0 ? ` (click to ${isSelectedArea ? "remove" : "select"})` : ""
                const pathOptions = {
                  color: hasSelectedVHVs ? "#000" : marker.color,
                  fillColor: marker.color,
                  fillOpacity: isSelectedArea ? 0.9 : marker.filteredCount > 0 ? 0.6 : 0.3,
                  weight: isSelectedArea || hasSelectedVHVs ? 2 : 1,
                }

                return (
                  <CircleMarker
                    key={`area-${marker.key}`}
                    center={marker.anchor}
                    radius={radius}
                    pathOptions={pathOptions}
                    eventHandlers={
                      marker.canToggle
                        ? {
                            click: () => onToggleDistrict(marker.displayName),
                          }
                        : undefined
                    }
                  >
                    <Tooltip direction="right" offset={[10, 0]} opacity={1} permanent={false}>
                      <span>
                        {marker.displayName} • {tooltipCount} VHV{marker.totalCount === 1 ? "" : "s"}
                        {tooltipAction}
                      </span>
                    </Tooltip>
                    <Popup>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between gap-2">
                          <div className="font-semibold leading-tight">{marker.displayName}</div>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline">
                              {marker.filteredCount} VHV{marker.filteredCount === 1 ? "" : "s"}
                            </Badge>
                            {marker.selectedCount > 0 && (
                              <Badge variant="secondary">{marker.selectedCount} selected</Badge>
                            )}
                          </div>
                        </div>
                        <div className="max-h-64 overflow-y-auto pr-1">
                          {marker.items.length === 0 ? (
                            <div className="text-sm text-muted-foreground">No VHVs match the current filters.</div>
                          ) : (
                            <div className="space-y-2">
                              {marker.items.map((v) => {
                                const label = getVhvLabel(v)
                                const isSelected = selectedVhvSet.has(v.id)
                                return (
                                  <div
                                    key={v.id}
                                    className={`rounded border p-2 ${isSelected ? "border-primary bg-primary/5" : "border-border bg-background/60"}`}
                                  >
                                    <div className="font-medium leading-tight">{label}</div>
                                    {v.phone && <div className="text-sm text-muted-foreground">Phone: {v.phone}</div>}
                                    {v.email && <div className="text-sm text-muted-foreground">Email: {v.email}</div>}
                                    {(v.district || marker.displayName) && (
                                      <div className="text-sm">
                                        Base area:{" "}
                                        <span className="font-medium">{v.district || marker.displayName}</span>
                                      </div>
                                    )}
                                    <div className="pt-2">
                                      <Button
                                        size="sm"
                                        variant={isSelected ? "secondary" : "default"}
                                        onClick={(event) => {
                                          event.preventDefault()
                                          event.stopPropagation()
                                          onToggleVhv(v.id)
                                        }}
                                      >
                                        {isSelected ? "Unselect" : "Select"}
                                      </Button>
                                    </div>
                                  </div>
                                )
                              })}
                            </div>
                          )}
                        </div>
                      </div>
                    </Popup>
                  </CircleMarker>
                )
              })}

              {selectedDistricts.map((d) => (
                <Circle
                  key={`hl-${d}`}
                  center={getDistrictAnchor(d)}
                  radius={AREA_RADIUS_M}
                  pathOptions={{ color: colorForDistrict(d), weight: 2, fillOpacity: 0.04 }}
                />
              ))}
            </MapContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default VhvMapSelector
