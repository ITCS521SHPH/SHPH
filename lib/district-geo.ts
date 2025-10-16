// Simple geo helpers for Bangkok districts
// Note: These are visual anchors (approximate), not authoritative boundaries.
// If you later have real GeoJSON polygons/centroids, replace the anchors here.

export type LatLng = [number, number]

// Central Bangkok reference
const BANGKOK_CENTER: LatLng = [13.7563, 100.5018]

// Deterministic pseudo-random spread based on district name
function hashString(s: string): number {
  let h = 0
  for (let i = 0; i < s.length; i++) {
    h = (h << 5) - h + s.charCodeAt(i)
    h |= 0
  }
  return Math.abs(h)
}

// Returns a stable anchor near Bangkok center for a given district.
// Offsets are small so anchors stay inside Bangkok.
export function getDistrictAnchor(district: string): LatLng {
  if (!district) return BANGKOK_CENTER
  const h = hashString(district)
  // Offset within ~10-12km box around center
  const latOffsetKm = ((h % 2000) / 2000 - 0.5) * 12 // -6..+6 km
  const lngOffsetKm = (((Math.floor(h / 2000)) % 2000) / 2000 - 0.5) * 12
  // Approx degrees per km near Bangkok
  const degLatPerKm = 1 / 110.574
  const degLngPerKm = 1 / (111.320 * Math.cos((BANGKOK_CENTER[0] * Math.PI) / 180))
  const lat = BANGKOK_CENTER[0] + latOffsetKm * degLatPerKm
  const lng = BANGKOK_CENTER[1] + lngOffsetKm * degLngPerKm
  return [lat, lng]
}

// Simple color palette for districts; generates a stable color per district
export function colorForDistrict(district: string): string {
  const palette = [
    '#e41a1c', '#377eb8', '#4daf4a', '#984ea3', '#ff7f00',
    '#a65628', '#f781bf', '#999999', '#66c2a5', '#fc8d62',
    '#8da0cb', '#e78ac3', '#a6d854', '#ffd92f', '#e5c494', '#b3b3b3'
  ]
  const idx = hashString(district) % palette.length
  return palette[idx]
}

// Circle radius (meters) to illustrate "area" when filtered
export const AREA_RADIUS_M = 4000
