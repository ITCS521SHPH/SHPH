import { createClient } from "@supabase/ssr"

/**
 * Fetches patient and their assigned VHV data for the map view.
 * Supports filtering by location (district) and a search term.
 *
 * @param {object} filters - The filter criteria.
 * @param {string} [filters.location] - Filter by patient's district.
 * @param {string} [filters.searchTerm] - Filter by patient name, national ID, or medical history.
 */
export const getHouseholdMapData = async (filters: { location?: string; searchTerm?: string } = {}) => {
  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)

  if (!supabase) {
    console.error("Supabase client is not initialized.")
    return { data: null, error: new Error("Supabase client not initialized.") }
  }

  // Start building the query from the 'assignments' table to easily link patients and VHVs
  let query = supabase
    .from("assignments")
    .select(
      `
      id,
      patient:patients!inner (
        id,
        first_name,
        last_name,
        district,
        medical_history,
        latitude,
        longitude
      ),
      vhv:health_workers!inner (
        users ( email )
      )
    `,
    )
    .eq("status", "ACTIVE") // Only show active assignments
    .eq("vhv.type", "VHV") // Ensure the linked health worker is a VHV
    .not("patient.latitude", "is", null) // Only get patients with coordinates
    .not("patient.longitude", "is", null)

  // Apply location (district) filter if provided
  if (filters.location) {
    query = query.eq("patient.district", filters.location)
  }

  // Apply search term filter if provided
  if (filters.searchTerm) {
    const term = `%${filters.searchTerm}%`
    // The 'or' filter checks multiple columns on the related 'patients' table
    query = query.or(`first_name.ilike.${term},last_name.ilike.${term},medical_history.ilike.${term}`, {
      referencedTable: "patients",
    })
  }

  const { data, error } = await query

  // Re-format data for easier use on the frontend
  const formattedData = data?.map((item) => ({
    householdId: item.patient.id,
    coordinates: { lat: item.patient.latitude, lng: item.patient.longitude },
    patient: {
      patientId: item.patient.id,
      name: `${item.patient.first_name} ${item.patient.last_name}`,
      medicalCondition: item.patient.medical_history || "N/A",
    },
    // Assuming VHV name is their email for this implementation
    assignedVHV: item.vhv.users?.email || "Not available",
  }))

  if (error) {
    console.error("Error fetching household map data:", error)
  }

  return { data: formattedData, error }
}
