"use client"

import { useEffect, useMemo, useRef, useState } from "react"
// Avoid top-level import of 'leaflet' to prevent preview environments
// from rewriting it into a blob URL. Prefer CDN window.L and fall back to require.
import { BANGKOK_DISTRICTS } from "@/lib/bangkok-districts"
import { getDistrictAnchor, colorForDistrict, AREA_RADIUS_M } from "@/lib/district-geo"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"

// We'll use the global `L` provided by the Leaflet CDN (app/layout.tsx) and
// render the map manually in a client-only fashion. This avoids importing
// the `leaflet` package (which preview sometimes rewrites to esm.v0.dev).

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
  const mapElRef = useRef<HTMLDivElement | null>(null)
  const layerGroupRef = useRef<any>(null)
  const highlightLayerRef = useRef<any>(null)
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
      try {
        // prefer CDN global
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const L = (window as any).L ?? require("leaflet")
        delete (L.Icon.Default.prototype as any)._getIconUrl
        L.Icon.Default.mergeOptions({
          iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
          iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
          shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
        })
        setLeafletLoaded(true)
      } catch {}
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
        // prefer global L
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const L = (window as any).L ?? require("leaflet")
        const b = new L.LatLngBounds(latlngs)
        if (m.fitBounds) {
          m.fitBounds(b.pad(0.2), { animate: true })
        }
      } catch (error) {
        console.error("[v0] Error fitting bounds:", error)
      }
    }
  }, [filteredGroups, selectedDistricts, leafletLoaded])

  // Initialize Leaflet map when CDN-provided L becomes available
  useEffect(() => {
    if (!leafletLoaded) return
    if (!mapElRef.current) return
    const L = (window as any).L
    if (!L) return

    if (!mapRef.current) {
      const map = L.map(mapElRef.current, {
        center: [center.lat, center.lng],
        zoom: 12,
        preferCanvas: true,
      })
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      }).addTo(map)
      const lg = L.layerGroup().addTo(map)
      const hl = L.layerGroup().addTo(map)
      // Attach popupopen handler to wire popup DOM interactions back to React props
      const onPopupOpen = (ev: any) => {
        try {
          const popupEl = ev.popup?.getElement?.()
          if (!popupEl) return
          popupEl.querySelectorAll?.(".vhv-toggle-btn")?.forEach((el: any) => {
            // remove existing handlers to avoid duplicates
            el.onclick = (e: any) => {
              const id = el.dataset?.vhvId
              if (id) onToggleVhv(id)
            }
          })
        } catch (err) {
          /* ignore */
        }
      }
      map.on("popupopen", onPopupOpen)
      mapRef.current = map
      layerGroupRef.current = lg
      highlightLayerRef.current = hl
    }

    return () => {
      try {
        if (mapRef.current) {
          mapRef.current.remove()
          mapRef.current = null
        }
      } catch (e) {
        /* ignore */
      }
    }
  }, [leafletLoaded, center.lat, center.lng])

  

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
      // `key` is string here but `known` is a Set of district literal types;
      // cast to any to satisfy TypeScript in this dynamic case.
      if (known.has(key as any)) return
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

  // Render markers into Leaflet layer groups whenever marker data or selection changes
  useEffect(() => {
    if (!leafletLoaded) return
    const map = mapRef.current
    const lg = layerGroupRef.current
    const hl = highlightLayerRef.current
    if (!map || !lg || !hl) return

    try {
      const L = (window as any).L
      // clear existing markers
      lg.clearLayers()
      hl.clearLayers()

      for (const m of allMarkers) {
        const [lat, lng] = m.anchor
        // circle marker for district anchor
        const radius = Math.max(8, Math.min(20, 6 + Math.floor(m.filteredCount / 3)))
        const Circle = L.circleMarker([lat, lng], {
          radius,
          color: m.color,
          fillColor: m.color,
          fillOpacity: m.selectedCount > 0 ? 0.95 : 0.6,
          weight: m.selectedCount > 0 ? 2 : 1,
        })

        const title = `${m.displayName} (${m.filteredCount}${m.totalCount !== m.filteredCount ? ` / ${m.totalCount}` : ""})`
        // Build popup HTML listing VHVs with checkboxes; attach handlers via map 'popupopen' event
        const listHtml = (m.items || [])
          .map(
            (it: any) =>
              `<li style="margin-bottom:6px"><label style="display:flex;align-items:center;gap:6px"><input type=\"checkbox\" data-vhv-id=\"${it.id}\" class=\"vhv-toggle-btn\" ${
                selectedVhvSet.has(it.id) ? "checked" : ""
              }/> <span>${getVhvLabel(it)}</span></label></li>`,
          )
          .join("")
        const html = `<div style=\"min-width:220px\"><strong>${m.displayName}</strong><div style=\"font-size:12px;color:#555;margin-top:6px\">${
          m.filteredCount
        } VHV(s)</div><ul style=\"padding-left:1rem;margin:8px 0 0 0\">${listHtml}</ul></div>`

        Circle.bindPopup(html, { maxWidth: 320 })

        // click also toggles district selection if allowed (single-click on marker)
        if (m.canToggle) {
          Circle.on("click", () => onToggleDistrict(m.displayName))
        }

        Circle.addTo(lg)

        // if this marker has selected VHVs, draw a highlight circle for the district
        if (m.selectedCount > 0) {
          const highlight = L.circle([lat, lng], {
            radius: AREA_RADIUS_M || 500,
            color: m.color,
            fillColor: m.color,
            fillOpacity: 0.08,
            weight: 1,
          })
          highlight.addTo(hl)
        }
      }
    } catch (err) {
      // fail silently; map may not be ready in some environments
      // console.error("marker render error", err)
    }
  }, [allMarkers, leafletLoaded, selectedDistricts, selectedVhvIds])

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
            <div ref={mapElRef} style={{ height: "100%", width: "100%" }} />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default VhvMapSelector
