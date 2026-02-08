/**
 * Admin Vehicles Composable
 * Full CRUD operations for vehicles in admin panel
 */
import type { Vehicle } from '~/composables/useVehicles'

export interface AdminVehicleFilters {
  status?: string | null
  category?: string | null
  type_id?: string | null
  subcategory_id?: string | null
  search?: string
  is_online?: boolean | null // null = all, true = online, false = offline
}

export interface VehicleFormData {
  brand: string
  model: string
  year: number | null
  price: number | null
  rental_price: number | null
  category: 'alquiler' | 'venta' | 'terceros'
  categories?: string[] // Multiple categories support (legacy compatibility)
  type_id: string | null
  location: string | null
  location_en: string | null
  location_country: string | null
  location_province: string | null
  location_region: string | null
  description_es: string | null
  description_en: string | null
  filters_json: Record<string, unknown>
  status: string
  featured: boolean
  plate?: string | null
  // Financial fields
  acquisition_cost?: number | null
  acquisition_date?: string | null
  min_price?: number | null
  // Online/Offline distinction
  is_online: boolean
  // Intermediation fields (only for offline)
  owner_name?: string | null
  owner_contact?: string | null
  owner_notes?: string | null
  // Maintenance and rental data (stored as JSONB)
  maintenance_records?: MaintenanceEntry[]
  rental_records?: RentalEntry[]
}

export interface AdminVehicle extends Vehicle {
  acquisition_cost?: number | null
  acquisition_date?: string | null
  min_price?: number | null
  plate?: string | null
  internal_id?: number
  categories?: string[] // Multiple categories support
  maintenance_records?: MaintenanceEntry[]
  rental_records?: RentalEntry[]
  // Online/Offline
  is_online: boolean
  // Intermediation fields
  owner_name?: string | null
  owner_contact?: string | null
  owner_notes?: string | null
}

export interface MaintenanceEntry {
  id: string
  date: string
  reason: string
  cost: number
  invoice_url?: string
}

export interface RentalEntry {
  id: string
  from_date: string
  to_date: string
  amount: number
  notes?: string
}

const PAGE_SIZE = 50

export function useAdminVehicles() {
  const supabase = useSupabaseClient()

  const vehicles = ref<AdminVehicle[]>([])
  const loading = ref(false)
  const saving = ref(false)
  const error = ref<string | null>(null)
  const total = ref(0)

  /**
   * Fetch all vehicles with admin access (all statuses)
   */
  async function fetchVehicles(filters: AdminVehicleFilters = {}) {
    loading.value = true
    error.value = null

    try {
      let query = supabase
        .from('vehicles')
        .select('*, vehicle_images(*), types(*)', { count: 'exact' })
        .order('created_at', { ascending: false })

      if (filters.status) {
        query = query.eq('status', filters.status)
      }

      if (filters.category) {
        query = query.eq('category', filters.category)
      }

      if (filters.subcategory_id) {
        // Get type_ids linked to this subcategory via junction table
        const { data: links } = await supabase
          .from('type_subcategories')
          .select('type_id')
          .eq('subcategory_id', filters.subcategory_id)

        if (links?.length) {
          const typeIds = (links as { type_id: string }[]).map(l => l.type_id)
          query = query.in('type_id', typeIds)
        }
        else {
          vehicles.value = []
          total.value = 0
          loading.value = false
          return
        }
      }

      if (filters.type_id) {
        query = query.eq('type_id', filters.type_id)
      }

      if (filters.search) {
        query = query.or(`brand.ilike.%${filters.search}%,model.ilike.%${filters.search}%`)
      }

      if (filters.is_online !== null && filters.is_online !== undefined) {
        query = query.eq('is_online', filters.is_online)
      }

      const { data, error: err, count } = await query.range(0, PAGE_SIZE - 1)

      if (err) throw err

      vehicles.value = (data as unknown as AdminVehicle[]) || []
      total.value = count || 0
    }
    catch (err: unknown) {
      const supabaseError = err as { message?: string }
      error.value = supabaseError?.message || (err instanceof Error ? err.message : 'Error fetching vehicles')
      vehicles.value = []
    }
    finally {
      loading.value = false
    }
  }

  /**
   * Fetch single vehicle by ID with all relations
   */
  async function fetchById(id: string): Promise<AdminVehicle | null> {
    loading.value = true
    error.value = null

    try {
      const { data, error: err } = await supabase
        .from('vehicles')
        .select('*, vehicle_images(*), types(*)')
        .eq('id', id)
        .order('position', { referencedTable: 'vehicle_images', ascending: true })
        .single()

      if (err) throw err

      return data as unknown as AdminVehicle
    }
    catch (err: unknown) {
      const supabaseError = err as { message?: string }
      error.value = supabaseError?.message || (err instanceof Error ? err.message : 'Error fetching vehicle')
      return null
    }
    finally {
      loading.value = false
    }
  }

  /**
   * Create new vehicle
   */
  async function createVehicle(formData: VehicleFormData): Promise<string | null> {
    saving.value = true
    error.value = null

    try {
      // Generate slug from brand + model + year
      const slug = generateSlug(formData.brand, formData.model, formData.year)

      const insertData = {
        ...formData,
        slug,
      }

      const { data, error: err } = await supabase
        .from('vehicles')
        .insert(insertData as never)
        .select('id')
        .single()

      if (err) throw err

      return (data as { id: string } | null)?.id || null
    }
    catch (err: unknown) {
      // Supabase errors have a message property but aren't Error instances
      const supabaseError = err as { message?: string; details?: string; hint?: string }
      error.value = supabaseError?.message || (err instanceof Error ? err.message : 'Error creating vehicle')
      console.error('Create vehicle error:', err)
      return null
    }
    finally {
      saving.value = false
    }
  }

  /**
   * Update existing vehicle
   */
  async function updateVehicle(id: string, formData: Partial<VehicleFormData>): Promise<boolean> {
    saving.value = true
    error.value = null

    try {
      const updateData = {
        ...formData,
        updated_at: new Date().toISOString(),
      }

      const { error: err } = await supabase
        .from('vehicles')
        .update(updateData as never)
        .eq('id', id)

      if (err) throw err

      return true
    }
    catch (err: unknown) {
      const supabaseError = err as { message?: string; details?: string; hint?: string }
      error.value = supabaseError?.message || (err instanceof Error ? err.message : 'Error updating vehicle')
      console.error('Update vehicle error:', err)
      return false
    }
    finally {
      saving.value = false
    }
  }

  /**
   * Delete vehicle
   */
  async function deleteVehicle(id: string): Promise<boolean> {
    saving.value = true
    error.value = null

    try {
      const { error: err } = await supabase
        .from('vehicles')
        .delete()
        .eq('id', id)

      if (err) throw err

      // Remove from local list
      vehicles.value = vehicles.value.filter(v => v.id !== id)
      total.value--

      return true
    }
    catch (err: unknown) {
      const supabaseError = err as { message?: string }
      error.value = supabaseError?.message || (err instanceof Error ? err.message : 'Error deleting vehicle')
      console.error('Delete vehicle error:', err)
      return false
    }
    finally {
      saving.value = false
    }
  }

  /**
   * Update vehicle status (quick action)
   */
  async function updateStatus(id: string, status: string): Promise<boolean> {
    return updateVehicle(id, { status } as Partial<VehicleFormData>)
  }

  /**
   * Toggle featured status
   */
  async function toggleFeatured(id: string, featured: boolean): Promise<boolean> {
    return updateVehicle(id, { featured } as Partial<VehicleFormData>)
  }

  /**
   * Archive/Sell vehicle (move to historico)
   */
  async function archiveVehicle(
    id: string,
    saleData: {
      sale_price: number
      sale_category: string
      buyer_name?: string
      buyer_contact?: string
    }
  ): Promise<boolean> {
    saving.value = true
    error.value = null

    try {
      // Fetch vehicle data first
      const vehicle = await fetchById(id)
      if (!vehicle) throw new Error('Vehicle not found')

      // Insert into historico
      const historicoData = {
        original_vehicle_id: id,
        brand: vehicle.brand,
        model: vehicle.model,
        year: vehicle.year,
        type_id: vehicle.type_id,
        original_price: vehicle.price,
        sale_price: saleData.sale_price,
        sale_date: new Date().toISOString().split('T')[0],
        sale_category: saleData.sale_category,
        buyer_name: saleData.buyer_name,
        buyer_contact: saleData.buyer_contact,
        vehicle_data: vehicle,
      }

      const { error: insertErr } = await supabase
        .from('historico')
        .insert(historicoData as never)

      if (insertErr) throw insertErr

      // Update vehicle status to sold
      const { error: updateErr } = await supabase
        .from('vehicles')
        .update({ status: 'sold' } as never)
        .eq('id', id)

      if (updateErr) throw updateErr

      return true
    }
    catch (err: unknown) {
      const supabaseError = err as { message?: string }
      error.value = supabaseError?.message || (err instanceof Error ? err.message : 'Error archiving vehicle')
      console.error('Archive vehicle error:', err)
      return false
    }
    finally {
      saving.value = false
    }
  }

  /**
   * Add image to vehicle
   */
  async function addImage(
    vehicleId: string,
    imageData: {
      cloudinary_public_id: string
      url: string
      thumbnail_url?: string
      alt_text?: string
    }
  ): Promise<boolean> {
    try {
      // Get current max position
      const { data: existing } = await supabase
        .from('vehicle_images')
        .select('position')
        .eq('vehicle_id', vehicleId)
        .order('position', { ascending: false })
        .limit(1)

      const existingData = existing as unknown as { position: number }[] | null
      const maxPosition = existingData?.[0]?.position ?? -1

      const insertData = {
        vehicle_id: vehicleId,
        cloudinary_public_id: imageData.cloudinary_public_id,
        url: imageData.url,
        thumbnail_url: imageData.thumbnail_url,
        alt_text: imageData.alt_text,
        position: maxPosition + 1,
      }

      const { error: err } = await supabase
        .from('vehicle_images')
        .insert(insertData as never)

      if (err) throw err
      return true
    }
    catch (err: unknown) {
      const supabaseError = err as { message?: string }
      error.value = supabaseError?.message || (err instanceof Error ? err.message : 'Error adding image')
      return false
    }
  }

  /**
   * Delete image
   */
  async function deleteImage(imageId: string): Promise<boolean> {
    try {
      const { error: err } = await supabase
        .from('vehicle_images')
        .delete()
        .eq('id', imageId)

      if (err) throw err
      return true
    }
    catch (err: unknown) {
      const supabaseError = err as { message?: string }
      error.value = supabaseError?.message || (err instanceof Error ? err.message : 'Error deleting image')
      return false
    }
  }

  /**
   * Reorder images
   */
  async function reorderImages(images: { id: string; position: number }[]): Promise<boolean> {
    try {
      for (const img of images) {
        const { error: err } = await supabase
          .from('vehicle_images')
          .update({ position: img.position } as never)
          .eq('id', img.id)

        if (err) throw err
      }
      return true
    }
    catch (err: unknown) {
      const supabaseError = err as { message?: string }
      error.value = supabaseError?.message || (err instanceof Error ? err.message : 'Error reordering images')
      return false
    }
  }

  return {
    vehicles: readonly(vehicles),
    loading: readonly(loading),
    saving: readonly(saving),
    error: readonly(error),
    total: readonly(total),
    fetchVehicles,
    fetchById,
    createVehicle,
    updateVehicle,
    deleteVehicle,
    updateStatus,
    toggleFeatured,
    archiveVehicle,
    addImage,
    deleteImage,
    reorderImages,
  }
}

// Helper function to generate URL-friendly slug
function generateSlug(brand: string, model: string, year: number | null): string {
  const parts = [brand, model]
  if (year) parts.push(String(year))

  return parts
    .join('-')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036F]/g, '') // Remove diacritics
    .replace(/[^a-z0-9-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
}
